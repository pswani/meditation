#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

print_usage() {
  printf '%s\n' "Usage: ./scripts/prod-backend-restart.sh"
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

"$SCRIPT_DIR/prod-backend-stop.sh"
exec "$SCRIPT_DIR/prod-backend-start.sh"
