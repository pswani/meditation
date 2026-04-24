#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

usage() {
  cat <<'USAGE'
Simple build and deploy pipeline entrypoint.

Usage:
  ./scripts/pipeline.sh verify
  ./scripts/pipeline.sh build
  ./scripts/pipeline.sh package [--skip-build] [--bundle-dir PATH]
  ./scripts/pipeline.sh release [--skip-build] [--bundle-dir PATH] [--domain NAME] [--email ADDRESS]
  ./scripts/pipeline.sh help

Commands:
  verify   Run the quality gate: frontend checks, backend verify, backend health smoke.
  build    Build frontend and backend artifacts.
  package  Build (unless --skip-build) and assemble the deployment bundle.
  release  Package then install via prod-macos-setup.sh install-app.

Notes:
  - This script is a thin wrapper over the existing production scripts.
  - It provides one discoverable command surface without changing runtime behavior.
USAGE
}

run_verify() {
  load_local_env
  cd "$ROOT_DIR"
  npm run typecheck
  npm run lint
  npm run test
  npm run build
  command_value=$(backend_build_cmd)
  if [ -n "$command_value" ]; then
    run_backend_command_inline "VERIFY" "$command_value"
    run_backend_smoke_check
  fi
}

cleanup_verify_backend() {
  if [ -n "${verify_backend_pid:-}" ] && pid_is_running "$verify_backend_pid"; then
    kill "$verify_backend_pid" 2>/dev/null || true
    sleep 1
    if pid_is_running "$verify_backend_pid"; then
      kill -9 "$verify_backend_pid" 2>/dev/null || true
    fi
  fi

  if [ -n "${verify_runtime_dir:-}" ] && [ -d "$verify_runtime_dir" ]; then
    rm -rf "$verify_runtime_dir"
  fi

  if [ -n "${verify_h2_dir:-}" ] && [ -d "$verify_h2_dir" ]; then
    rm -rf "$verify_h2_dir"
  fi

  if [ -n "${verify_media_root:-}" ] && [ -d "$verify_media_root" ]; then
    rm -rf "$verify_media_root"
  fi
}

run_backend_smoke_check() {
  backend_jar=$(backend_jar_path)
  java_command=$(java_bin)

  if [ -z "$backend_jar" ] || [ ! -f "$backend_jar" ]; then
    printf '%s\n' "Backend smoke check skipped because no built backend jar was found."
    return 1
  fi

  if [ -z "$java_command" ]; then
    printf '%s\n' "Backend smoke check skipped because no Java runtime was found."
    return 1
  fi

  verify_runtime_dir=$(create_temp_dir meditation-verify-runtime)
  verify_h2_dir=$(create_temp_dir meditation-verify-h2)
  verify_media_root=$(create_temp_dir meditation-verify-media)
  verify_backend_host=127.0.0.1
  verify_backend_port=18080
  verify_health_url="http://${verify_backend_host}:${verify_backend_port}/api/health"
  verify_log_file="${verify_runtime_dir}/backend-verify.log"
  verify_backend_pid=""
  trap cleanup_verify_backend EXIT INT TERM

  printf '%s\n' "Backend smoke check using runtime dir $verify_runtime_dir"
  printf '%s\n' "Backend smoke check using H2 dir $verify_h2_dir"
  printf '%s\n' "Backend smoke check using media root $verify_media_root"

  (
    export MEDITATION_RUNTIME_DIR="$verify_runtime_dir"
    export MEDITATION_H2_DB_DIR="$verify_h2_dir"
    export MEDITATION_BACKEND_BIND_HOST="$verify_backend_host"
    export MEDITATION_BACKEND_PORT="$verify_backend_port"
    export MEDITATION_MEDIA_STORAGE_ROOT="$verify_media_root"
    ensure_component_stopped "backend-verify" "$verify_backend_port" "$verify_health_url"
  )

  (
    export MEDITATION_RUNTIME_DIR="$verify_runtime_dir"
    export MEDITATION_H2_DB_DIR="$verify_h2_dir"
    export MEDITATION_BACKEND_BIND_HOST="$verify_backend_host"
    export MEDITATION_BACKEND_PORT="$verify_backend_port"
    export MEDITATION_MEDIA_STORAGE_ROOT="$verify_media_root"
    nohup "$java_command" -jar "$backend_jar" --server.address="$verify_backend_host" --server.port="$verify_backend_port" \
      >"$verify_log_file" 2>&1 &
    printf '%s\n' "$!" > "${verify_runtime_dir}/backend-verify.pid"
  )

  verify_backend_pid=$(cat "${verify_runtime_dir}/backend-verify.pid")
  if ! wait_for_http "$verify_health_url" 90 "$verify_backend_pid"; then
    printf '%s\n' "Backend smoke check failed. Recent backend log output:"
    tail -n 40 "$verify_log_file" || true
    return 1
  fi

  curl -fsS "$verify_health_url" >/dev/null
  printf '%s\n' "Backend smoke check passed at $verify_health_url"
  cleanup_verify_backend
  trap - EXIT INT TERM
}

if [ "$#" -eq 0 ]; then
  usage
  exit 1
fi

command_name=$1
shift

case "$command_name" in
  verify)
    run_verify
    ;;
  build)
    exec "$SCRIPT_DIR/prod-build.sh"
    ;;
  package)
    exec "$SCRIPT_DIR/package-deploy.sh" "$@"
    ;;
  release)
    exec "$SCRIPT_DIR/prod-release.sh" "$@"
    ;;
  help|--help|-h)
    usage
    ;;
  *)
    printf '%s\n' "Unknown command: $command_name"
    usage
    exit 1
    ;;
esac
