#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

print_usage() {
  printf '%s\n' "Usage: ./scripts/app-logs.sh [frontend|backend|all] [--tail N]"
}

component=all
lines=40

while [ "$#" -gt 0 ]; do
  case "$1" in
    frontend|backend|all)
      component=$1
      ;;
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
ensure_runtime_dirs

if [ "$component" = "frontend" ] || [ "$component" = "all" ]; then
  printf '%s\n' "=== frontend ==="
  print_log_tail frontend "$lines"
fi

if [ "$component" = "backend" ] || [ "$component" = "all" ]; then
  if [ "$component" = "all" ]; then
    printf '\n'
  fi
  printf '%s\n' "=== backend ==="
  print_log_tail backend "$lines"
fi
