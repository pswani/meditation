#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

load_local_env
media_root=$(ensure_media_root)
backend_media_root=$(backend_media_root_dir)

printf '%s\n' "Building frontend bundle"
printf '%s\n' "Frontend fallback media root: $media_root"
printf '%s\n' "Backend media root: $backend_media_root"

cd "$ROOT_DIR"
npm run build

command_value=$(backend_build_cmd)
if [ -n "$command_value" ]; then
  printf '%s\n' "Building paired backend"
  run_backend_command "BUILD" "$command_value"
else
  printf '%s\n' "No external backend build configured. Frontend build complete."
fi
