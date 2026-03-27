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

printf '%s\n' "Frontend: $frontend_state"
printf '%s\n' "Frontend PID: ${frontend_pid:-none}"
printf '%s\n' "Frontend URL: $(frontend_dev_url)"
printf '%s\n' "Frontend health: $(http_status "$(frontend_dev_url)")"
printf '%s\n' "Frontend log: $(component_log_file frontend)"
printf '\n'
printf '%s\n' "Backend: $backend_state"
printf '%s\n' "Backend PID: ${backend_pid:-none}"
printf '%s\n' "Backend health URL: $(backend_health_url)"
printf '%s\n' "Backend health: $(http_status "$(backend_health_url)")"
printf '%s\n' "Backend log: $(component_log_file backend)"
printf '\n'
printf '%s\n' "Database: embedded H2 managed by the backend process"
printf '%s\n' "Database files: $(h2_db_dir)/$(h2_db_name)"
