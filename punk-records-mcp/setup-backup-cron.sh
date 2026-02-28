#!/bin/bash
# Setup daily backup cron job for Punk Records

PLIST_NAME="com.punkrecords.backup.plist"
PLIST_SRC="$(pwd)/$PLIST_NAME"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"

echo "Setting up daily backup cron job (runs at 12:00 AM daily)..."

# Copy plist to LaunchAgents
cp "$PLIST_SRC" "$PLIST_DEST"
echo "✓ Copied plist to $PLIST_DEST"

# Load the job
launchctl unload "$PLIST_DEST" 2>/dev/null || true
launchctl load "$PLIST_DEST"
echo "✓ Loaded backup job"

# Verify it's loaded
if launchctl list | grep -q "com.punkrecords.backup"; then
    echo "✓ Backup job is running"
    echo ""
    echo "Backups will run daily at 12:00 AM (midnight)"
    echo "Logs: ~/punk-records/.brain/backup.log"
    echo ""
    echo "To test manually: npm run backup"
    echo "To remove: launchctl unload $PLIST_DEST && rm $PLIST_DEST"
else
    echo "✗ Failed to load backup job"
    exit 1
fi
