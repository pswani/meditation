#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

print_usage() {
  printf '%s\n' "Usage: ./scripts/app-start.sh [--frontend-only]"
}

start_backend=1

while [ "$#" -gt 0 ]; do
  case "$1" in
    --frontend-only)
      start_backend=0
      ;;
    --help|-h)
      print_usage
      exit 0
      ;;
    *)
      print_usage
      exit 1
      ;;
  esac
  shift
done

load_local_env
ensure_media_root >/dev/null
ensure_runtime_dirs

frontend_port=$(frontend_dev_port)
frontend_url=$(frontend_dev_url)
frontend_log=$(component_log_file frontend)

ensure_component_stopped frontend "$frontend_port"

if [ "$start_backend" -eq 1 ]; then
  backend_port_value=$(backend_port)
  backend_url=$(backend_health_url)
  backend_log=$(component_log_file backend)

  ensure_component_stopped backend "$backend_port_value"

  append_log_header backend "Starting managed backend"
  nohup "$SCRIPT_DIR/dev-backend.sh" >> "$backend_log" 2>&1 &
  backend_pid=$!
  write_pid_file backend "$backend_pid"

  if ! wait_for_http "$backend_url" 90; then
    printf '%s\n' "Backend did not become healthy at $backend_url"
    printf '%s\n' "Recent backend log output:"
    print_log_tail backend 40
    stop_component backend
    exit 1
  fi
fi

append_log_header frontend "Starting managed frontend"
nohup "$SCRIPT_DIR/dev-frontend.sh" >> "$frontend_log" 2>&1 &
frontend_pid=$!
write_pid_file frontend "$frontend_pid"

if ! wait_for_http "$frontend_url" 90; then
  printf '%s\n' "Frontend did not become reachable at $frontend_url"
  printf '%s\n' "Recent frontend log output:"
  print_log_tail frontend 40
  stop_component frontend
  if [ "$start_backend" -eq 1 ]; then
    stop_component backend
  fi
  exit 1
fi

printf '%s\n' "Managed local app stack is running."
printf '%s\n' "Frontend: $frontend_url"
printf '%s\n' "Frontend log: $frontend_log"

if [ "$start_backend" -eq 1 ]; then
  printf '%s\n' "Backend: $backend_url"
  printf '%s\n' "Backend log: $backend_log"
  printf '%s\n' "Database: embedded H2 under $(h2_db_dir)/$(h2_db_name)"
else
  printf '%s\n' "Backend and embedded H2 were left running."
fi
