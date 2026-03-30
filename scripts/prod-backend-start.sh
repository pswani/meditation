#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

print_usage() {
  printf '%s\n' "Usage: ./scripts/prod-backend-start.sh"
}

if [ "$#" -gt 0 ]; then
  case "$1" in
    --help|-h)
      print_usage
      exit 0
      ;;
    *)
      print_usage
      exit 1
      ;;
  esac
fi

load_local_env
: "${MEDITATION_RUNTIME_DIR:=local-data/runtime-production}"
: "${MEDITATION_H2_DB_DIR:=$(h2_db_dir)}"
: "${MEDITATION_MEDIA_STORAGE_ROOT:=$(resolve_path "local-data/media")}"
export MEDITATION_H2_DB_DIR MEDITATION_MEDIA_STORAGE_ROOT
ensure_runtime_dirs

component_name="backend-production"
backend_jar=$(backend_jar_path)
backend_url=$(backend_bound_health_url)
backend_log=$(component_log_file "$component_name")
java_command=$(java_bin)

mkdir -p "$MEDITATION_H2_DB_DIR" "$MEDITATION_MEDIA_STORAGE_ROOT"

if [ -z "$backend_jar" ] || [ ! -f "$backend_jar" ]; then
  printf '%s\n' "Backend jar not found."
  printf '%s\n' "Run ./scripts/package-deploy.sh or set MEDITATION_BACKEND_JAR_PATH."
  exit 1
fi

if [ -z "$java_command" ]; then
  printf '%s\n' "Java runtime not found. Install openjdk@21 or set MEDITATION_JAVA_BIN."
  exit 1
fi

ensure_component_stopped "$component_name" "$(backend_port)"
append_log_header "$component_name" "Starting production backend"

nohup "$java_command" -jar "$backend_jar" --server.address="$(backend_bind_host)" --server.port="$(backend_port)" >> "$backend_log" 2>&1 &
backend_pid=$!
write_pid_file "$component_name" "$backend_pid"

if ! wait_for_http "$backend_url" 90; then
  printf '%s\n' "Production backend did not become healthy at $backend_url"
  printf '%s\n' "Recent backend log output:"
  print_log_tail "$component_name" 40
  stop_component "$component_name"
  exit 1
fi

printf '%s\n' "Production backend is running."
printf '%s\n' "Backend jar: $backend_jar"
printf '%s\n' "Backend health: $backend_url"
printf '%s\n' "Backend log: $backend_log"
