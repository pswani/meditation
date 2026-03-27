#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

load_local_env
media_root=$(ensure_media_root)
backend_media_root=$(backend_media_root_dir)
frontend_host=$(frontend_dev_host)
frontend_port=$(frontend_dev_port)

printf '%s\n' "Starting frontend dev server"
printf '%s\n' "Frontend fallback media root: $media_root"
printf '%s\n' "Backend media root: $backend_media_root"
printf '%s\n' "Frontend host: $frontend_host"
printf '%s\n' "Frontend port: $frontend_port"

cd "$ROOT_DIR"
exec npm run dev -- --host "$frontend_host" --port "$frontend_port"
