#!/bin/sh
# Consistent H2 backup: quiesce writes, copy the DB files, restart.
# Usage: ./scripts/backup-db.sh [--dest /path/to/backup/dir]
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
DEST="${1:-/opt/meditation/backups}"
H2_DATA_DIR="/opt/meditation/shared/h2"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="${DEST}/db-${TIMESTAMP}"

mkdir -p "${BACKUP_DIR}"

printf '%s\n' "Stopping backend for consistent snapshot..."
"${SCRIPT_DIR}/prod-backend-stop.sh"

printf '%s\n' "Copying H2 files to ${BACKUP_DIR}..."
cp "${H2_DATA_DIR}"/*.mv.db "${BACKUP_DIR}/" 2>/dev/null || true
cp "${H2_DATA_DIR}"/*.trace.db "${BACKUP_DIR}/" 2>/dev/null || true

printf '%s\n' "Restarting backend..."
"${SCRIPT_DIR}/prod-backend-start.sh"

printf '%s\n' "Backup complete: ${BACKUP_DIR}"
ls -lh "${BACKUP_DIR}"
