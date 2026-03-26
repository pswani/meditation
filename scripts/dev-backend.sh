#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

load_local_env
command_value=$(backend_dev_cmd)

if [ -z "$command_value" ]; then
  printf '%s\n' "No backend exists in this repo."
  printf '%s\n' "To pair an external backend, set MEDITATION_BACKEND_DIR and optionally MEDITATION_BACKEND_DEV_CMD in .env.local."
  exit 1
fi

run_backend_command "DEV" "$command_value"
