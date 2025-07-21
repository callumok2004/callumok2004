#!/bin/bash

BACKUP_SRC=("/root" "/var/www" "/var/lib/docker/volumes")
MOUNT_POINT="/root/usb_share"
BACKUP_DIR="$MOUNT_POINT/backup_$(date +%Y%m%d)"
COMPRESS_DIR="$MOUNT_POINT/archives"
LOG_FILE="/var/log/backup_script.log"
RETENTION_DAYS=3

touch "$LOG_FILE"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

if ! mountpoint -q "$MOUNT_POINT"; then
    log "Error: $MOUNT_POINT is not mounted"
    exit 1
fi

mkdir -p "$BACKUP_DIR" "$COMPRESS_DIR"

for SRC in "${BACKUP_SRC[@]}"; do
    if [ -d "$SRC" ]; then
        log "Backing up $SRC to $BACKUP_DIR"
        rsync -a --delete --exclude=usb_share/ --exclude=backup_* --verbose "$SRC/" "$BACKUP_DIR/$(basename $SRC)/" >> "$LOG_FILE" 2>&1
        if [ $? -eq 0 ]; then
            log "Backup of $SRC completed successfully"
            ARCHIVE_FILE="$COMPRESS_DIR/$(basename $SRC)_$(date +%Y%m%d).tar.gz"
            log "Compressing $SRC to $ARCHIVE_FILE"
            tar -czf "$ARCHIVE_FILE" -C "$BACKUP_DIR" "$(basename $SRC)" >> "$LOG_FILE" 2>&1
            if [ $? -eq 0 ]; then
                log "Compression of $SRC to $ARCHIVE_FILE completed successfully"
                # Remove uncompressed backup to save space
                rm -rf "$BACKUP_DIR/$(basename $SRC)"
                log "Removed uncompressed backup for $SRC"
            else
                log "Compression of $SRC failed"
            fi
        else
            log "Backup of $SRC failed"
        fi
    else
        log "Directory $SRC does not exist, skipping"
    fi
done

log "Cleaning up archives older than $RETENTION_DAYS days in $COMPRESS_DIR"
find "$COMPRESS_DIR" -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete -print | while read -r file; do
    log "Deleted old backup: $file"
done

find "$MOUNT_POINT" -type d -name "backup_*" -empty -delete -print | while read -r dir; do
    log "Deleted empty backup directory: $dir"
done

log "OS Backup script completed"
log "HA Backup starting"

CONTAINER_NAME="homeassistant"
SOURCE_PATH="/config/backups"
DEST_PATH="/root/usb_share/ha_backups"
TMP_BACKUP_DIR="/tmp/ha_backups"

mkdir -p "$TMP_BACKUP_DIR"
mkdir -p "$DEST_PATH"

find "$DEST_PATH" -type f -name '*.tar' -mtime +7 -delete

docker exec "$CONTAINER_NAME" ls "$SOURCE_PATH" | grep '\.tar$' | while read backup_file; do
  base_name="${backup_file%.tar}"

  if ls "$DEST_PATH/${base_name}_copied_"*.tar &> /dev/null; then
    continue
  fi

  docker cp "$CONTAINER_NAME:$SOURCE_PATH/$backup_file" "$TMP_BACKUP_DIR/$backup_file"

  ts=$(date +%Y-%m-%d_%H-%M-%S)
  cp "$TMP_BACKUP_DIR/$backup_file" "$DEST_PATH/${base_name}_copied_$ts.tar"
done

rm -rf "$TMP_BACKUP_DIR"

log "Finished HA backup"
