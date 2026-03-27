#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

print_usage() {
  printf '%s\n' "Usage: ./scripts/app-stop.sh [--frontend-only|--backend-only]"
}

stop_frontend=1
stop_backend=1

while [ "$#" -gt 0 ]; do
  case "$1" in
    --frontend-only)
      stop_backend=0
      ;;
    --backend-only)
      stop_frontend=0
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
ensure_runtime_dirs

if [ "$stop_frontend" -eq 1 ]; then
  if component_is_running frontend; then
    stop_component frontend
    printf '%s\n' "Stopped managed frontend."
  else
    printf '%s\n' "Managed frontend was not running."
  fi
fi

if [ "$stop_backend" -eq 1 ]; then
  if component_is_running backend; then
    stop_component backend
    printf '%s\n' "Stopped managed backend."
    printf '%s\n' "Embedded H2 is no longer in use by the backend process."
  else
    printf '%s\n' "Managed backend was not running."
  fi
fi
