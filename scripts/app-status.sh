#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

http_status() {
  url=$1
  if url_is_reachable "$url"; then
    printf '%s\n' "healthy"
    return
  fi

  printf '%s\n' "unreachable"
}

load_local_env
ensure_runtime_dirs

if component_is_running frontend; then
  frontend_state="running"
else
  frontend_state="stopped"
fi

if component_is_running backend; then
  backend_state="running"
else
  backend_state="stopped"
fi

frontend_pid=$(read_pid_file frontend)
backend_pid=$(read_pid_file backend)
frontend_health=$(http_status "$(frontend_dev_url)")
backend_health=$(http_status "$(backend_health_url)")

printf '%s\n' "Frontend: $frontend_state"
printf '%s\n' "Frontend PID: ${frontend_pid:-none}"
printf '%s\n' "Frontend URL: $(frontend_dev_url)"
printf '%s\n' "Frontend health: $frontend_health"
if [ "$frontend_state" = "stopped" ] && [ "$frontend_health" = "healthy" ]; then
  printf '%s\n' "Frontend note: another process is responding at the configured URL."
fi
printf '%s\n' "Frontend log: $(component_log_file frontend)"
printf '\n'
printf '%s\n' "Backend: $backend_state"
printf '%s\n' "Backend PID: ${backend_pid:-none}"
printf '%s\n' "Backend health URL: $(backend_health_url)"
printf '%s\n' "Backend health: $backend_health"
if [ "$backend_state" = "stopped" ] && [ "$backend_health" = "healthy" ]; then
  printf '%s\n' "Backend note: another process is responding at the configured health URL."
fi
printf '%s\n' "Backend log: $(component_log_file backend)"
printf '\n'
printf '%s\n' "Database: embedded H2 managed by the backend process"
printf '%s\n' "Database files: $(h2_db_dir)/$(h2_db_name)"
