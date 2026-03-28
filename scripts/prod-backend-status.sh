#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

http_status() {
  url=$1
  if curl -fsS --max-time 2 "$url" >/dev/null 2>&1; then
    printf '%s\n' "healthy"
    return
  fi

  printf '%s\n' "unreachable"
}

load_local_env
: "${MEDITATION_RUNTIME_DIR:=local-data/runtime-production}"
ensure_runtime_dirs

component_name="backend-production"
backend_pid=$(read_pid_file "$component_name")

if component_is_running "$component_name"; then
  backend_state="running"
else
  backend_state="stopped"
fi

printf '%s\n' "Production backend: $backend_state"
printf '%s\n' "Backend PID: ${backend_pid:-none}"
printf '%s\n' "Backend jar: $(backend_jar_path)"
printf '%s\n' "Backend health URL: $(backend_bound_health_url)"
printf '%s\n' "Backend health: $(http_status "$(backend_bound_health_url)")"
printf '%s\n' "Backend log: $(component_log_file "$component_name")"
printf '%s\n' "Database files: $(h2_db_dir)/$(h2_db_name)"
