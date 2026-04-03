#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

load_local_env
ensure_media_root >/dev/null

cd "$ROOT_DIR"
npm run build

command_value=$(backend_build_cmd)
if [ -n "$command_value" ]; then
  run_backend_command_inline "BUILD" "$command_value"
fi
