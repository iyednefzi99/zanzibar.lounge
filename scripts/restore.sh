#!/usr/bin/env bash
set -euo pipefail

# Database restore script for Zanzibar Lounge.
# Usage: ./scripts/restore.sh [BACKUP_FILE]
#
# If BACKUP_FILE is omitted, lists available backups and prompts for selection.

BACKUP_DIR="${1:-./backups}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

if [ -n "${2:-}" ]; then
  BACKUP_FILE="$2"
else
  if [ ! -d "$BACKUP_DIR" ]; then
    echo "No backups directory found at $BACKUP_DIR" >&2
    exit 1
  fi

  echo "Available backups:"
  echo "---"
  ls -1t "$BACKUP_DIR"/zanzibar_*.sql.gz 2>/dev/null || { echo "No backups found in $BACKUP_DIR" >&2; exit 1; }
  echo "---"
  echo ""
  read -rp "Enter the backup file path to restore: " BACKUP_FILE
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: File not found: $BACKUP_FILE" >&2
  exit 1
fi

echo "Restoring from: $BACKUP_FILE"
echo "Target: $DATABASE_URL"
echo ""
echo "WARNING: This will overwrite the current database contents."
read -rp "Proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL" --quiet

echo ""
echo "Verifying restoration ..."
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

echo "Tables in database: $TABLE_COUNT"

if [ "$TABLE_COUNT" -lt 1 ]; then
  echo "ERROR: Verification failed — no tables found after restore." >&2
  exit 1
fi

echo "Restore completed successfully."
