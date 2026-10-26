#!/usr/bin/env bash
set -euo pipefail

: "${DIRECT_URL:?Set DIRECT_URL to the direct PostgreSQL connection string}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
mkdir -p "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
output="$BACKUP_DIR/amebo-n-tech-$timestamp.sql.gz"

# pg_dump writes a portable SQL dump; gzip keeps routine backups smaller.
pg_dump "$DIRECT_URL" --no-owner --no-privileges | gzip -9 > "$output"
test -s "$output"
find "$BACKUP_DIR" -type f -name 'amebo-n-tech-*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
printf 'Backup created: %s\n' "$output"
