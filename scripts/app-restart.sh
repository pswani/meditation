#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

print_usage() {
  printf '%s\n' "Usage: ./scripts/app-restart.sh [--no-db]"
}

no_db=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --no-db)
      no_db=1
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

if [ "$no_db" -eq 1 ]; then
  printf '%s\n' "Restarting the frontend only so the backend and embedded H2 stay up."
  "$SCRIPT_DIR/app-stop.sh" --frontend-only
  exec "$SCRIPT_DIR/app-start.sh" --frontend-only
fi

printf '%s\n' "Restarting the managed frontend and backend."
"$SCRIPT_DIR/app-stop.sh"
exec "$SCRIPT_DIR/app-start.sh"
