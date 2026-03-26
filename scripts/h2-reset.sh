#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

load_local_env

db_dir=$(h2_db_dir)
db_name=$(h2_db_name)

mkdir -p "$db_dir"
rm -f "$db_dir/$db_name.mv.db" "$db_dir/$db_name.trace.db" "$db_dir/$db_name.lock.db"

printf '%s\n' "H2 directory ready at: $db_dir"
printf '%s\n' "Cleared database files for: $db_name"
printf '%s\n' "JDBC example: jdbc:h2:file:$db_dir/$db_name"
