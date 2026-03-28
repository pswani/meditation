#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

load_local_env
media_root=$(ensure_media_root)
backend_media_root=$(backend_media_root_dir)
frontend_sound_root=$(frontend_sound_root_dir)
backend_sound_root=$(backend_sound_root_dir)

if [ -d "$frontend_sound_root" ]; then
  find "$frontend_sound_root" -maxdepth 1 -type f ! -name '.gitkeep' | while IFS= read -r sound_file; do
    cp "$sound_file" "$backend_sound_root/$(basename "$sound_file")"
  done
fi

printf '%s\n' "Frontend fallback media root ready at: $media_root"
printf '%s\n' "Backend media root ready at: $backend_media_root"
printf '%s\n' "Frontend fallback sound root ready at: $frontend_sound_root"
printf '%s\n' "Backend sound root ready at: $backend_sound_root"
