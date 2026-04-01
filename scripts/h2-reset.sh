#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

load_local_env

db_dir=$(h2_db_dir)
db_name=$(h2_db_name)

if component_is_running backend || port_in_use "$(backend_port)" || url_is_reachable "$(backend_health_url)"; then
  printf '%s\n' "Refusing to reset the local H2 database while a backend is still reachable at $(backend_health_url)."
  printf '%s\n' "Stop the backend first, then rerun this reset command."
  exit 1
fi

mkdir -p "$db_dir"
rm -f "$db_dir/$db_name.mv.db" "$db_dir/$db_name.trace.db" "$db_dir/$db_name.lock.db"

printf '%s\n' "H2 directory ready at: $db_dir"
printf '%s\n' "Cleared database files for: $db_name"
printf '%s\n' "JDBC example: jdbc:h2:file:$db_dir/$db_name"
