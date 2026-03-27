#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

load_local_env
media_root=$(ensure_media_root)
backend_media_root=$(backend_media_root_dir)
preview_host=$(frontend_preview_host)
preview_port=$(frontend_preview_port)

printf '%s\n' "Ensuring production build exists before preview"
printf '%s\n' "Frontend fallback media root: $media_root"
printf '%s\n' "Backend media root: $backend_media_root"
printf '%s\n' "Preview host: $preview_host"
printf '%s\n' "Preview port: $preview_port"

cd "$ROOT_DIR"
npm run build
exec npm run preview -- --host "$preview_host" --port "$preview_port"
