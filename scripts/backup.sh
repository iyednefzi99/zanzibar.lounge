#!/usr/bin/env bash
set -euo pipefail

# Database backup script for Zanzibar Lounge.
# Usage: ./scripts/backup.sh [BACKUP_DIR] [S3_BUCKET]
#
# BACKUP_DIR defaults to ./backups
# S3_BUCKET  if provided, uploads the compressed backup to s3://$S3_BUCKET/backups/

BACKUP_DIR="${1:-./backups}"
S3_BUCKET="${2:-}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="zanzibar_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Starting backup at $TIMESTAMP ..."
pg_dump "$DATABASE_URL" --no-owner --no-privileges --clean --if-exists \
  | gzip > "$BACKUP_DIR/$BACKUP_FILE"

FILESIZE=$(stat -f%z "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null || stat --format=%s "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null || echo "unknown")
echo "Backup saved: $BACKUP_DIR/$BACKUP_FILE ($FILESIZE bytes)"

if [ -n "$S3_BUCKET" ]; then
  echo "Uploading to s3://$S3_BUCKET/backups/$BACKUP_FILE ..."
  aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$S3_BUCKET/backups/$BACKUP_FILE" \
    --storage-class STANDARD_IA
  echo "Upload complete."
fi

echo "Cleaning up backups older than $RETENTION_DAYS days ..."
find "$BACKUP_DIR" -name "zanzibar_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" -delete

echo "Backup finished."
