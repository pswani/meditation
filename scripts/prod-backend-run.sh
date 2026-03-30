#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

print_usage() {
  printf '%s\n' "Usage: ./scripts/prod-backend-run.sh"
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

backend_env_file=${MEDITATION_BACKEND_ENV_FILE:-/opt/meditation/shared/meditation.env}
if [ -f "$backend_env_file" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$backend_env_file"
  set +a
fi

: "${MEDITATION_RUNTIME_DIR:=/opt/meditation/runtime-production}"
: "${MEDITATION_H2_DB_DIR:=/opt/meditation/shared/h2}"
: "${MEDITATION_MEDIA_STORAGE_ROOT:=/opt/meditation/shared/media}"
: "${MEDITATION_BACKEND_JAR_PATH:=/opt/meditation/app/backend/meditation-backend.jar}"
export MEDITATION_RUNTIME_DIR MEDITATION_H2_DB_DIR MEDITATION_MEDIA_STORAGE_ROOT MEDITATION_BACKEND_JAR_PATH

ensure_runtime_dirs
mkdir -p "$MEDITATION_H2_DB_DIR" "$MEDITATION_MEDIA_STORAGE_ROOT"

backend_jar=$(backend_jar_path)
java_command=$(java_bin)

if [ -z "$backend_jar" ] || [ ! -f "$backend_jar" ]; then
  printf '%s\n' "Backend jar not found at ${backend_jar:-$MEDITATION_BACKEND_JAR_PATH}"
  exit 1
fi

if [ -z "$java_command" ]; then
  printf '%s\n' "Java runtime not found. Install openjdk@21 or set MEDITATION_JAVA_BIN."
  exit 1
fi

exec "$java_command" -jar "$backend_jar" --server.address="$(backend_bind_host)" --server.port="$(backend_port)"
