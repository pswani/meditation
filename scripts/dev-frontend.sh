#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

load_local_env
media_root=$(ensure_media_root)

printf '%s\n' "Starting frontend dev server"
printf '%s\n' "Media root: $media_root"

cd "$ROOT_DIR"
exec npm run dev
