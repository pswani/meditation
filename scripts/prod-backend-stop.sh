#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

print_usage() {
  printf '%s\n' "Usage: ./scripts/prod-backend-stop.sh"
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
ensure_runtime_dirs

component_name="backend-production"

if component_is_running "$component_name"; then
  stop_component "$component_name"
  printf '%s\n' "Stopped production backend."
else
  printf '%s\n' "Production backend was not running."
fi
