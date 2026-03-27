#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

load_local_env
media_root=$(ensure_media_root)
backend_media_root=$(backend_media_root_dir)

backend_pid=""

cleanup() {
  if [ -n "$backend_pid" ] && kill -0 "$backend_pid" 2>/dev/null; then
    kill "$backend_pid" 2>/dev/null || true
    wait "$backend_pid" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

printf '%s\n' "Frontend fallback media root: $media_root"
printf '%s\n' "Backend media root: $backend_media_root"

if [ -n "$(backend_dev_cmd)" ]; then
  printf '%s\n' "Starting paired backend in the background"
  "$SCRIPT_DIR/dev-backend.sh" &
  backend_pid=$!
  sleep 2

  if ! kill -0 "$backend_pid" 2>/dev/null; then
    wait "$backend_pid"
    exit 1
  fi
else
  printf '%s\n' "No external backend configured. Starting frontend only."
fi

cd "$ROOT_DIR"
exec npm run dev
