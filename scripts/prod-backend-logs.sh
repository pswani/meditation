#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

print_usage() {
  printf '%s\n' "Usage: ./scripts/prod-backend-logs.sh [--tail N]"
}

lines=40

while [ "$#" -gt 0 ]; do
  case "$1" in
    --tail)
      shift
      if [ "$#" -eq 0 ]; then
        print_usage
        exit 1
      fi
      lines=$1
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
: "${MEDITATION_RUNTIME_DIR:=local-data/runtime-production}"
ensure_runtime_dirs

print_log_tail "backend-production" "$lines"
