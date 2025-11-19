#!/bin/bash
# Flipboard 3D Gallery - Server Stop Script

echo "🛑 Stopping Flipboard 3D Gallery Server..."
echo ""

# Find and kill Bun server processes
PIDS=$(pgrep -f 'bun.*server-bun')

if [ -z "$PIDS" ]; then
    echo "ℹ️  No server process found. Server is not running."
    exit 0
fi

echo "Found server process(es): $PIDS"
echo ""

# Kill the processes
for PID in $PIDS; do
    echo "   Killing process $PID..."
    kill $PID
done

# Wait a moment
sleep 1

# Check if still running (force kill if needed)
REMAINING=$(pgrep -f 'bun.*server-bun')
if [ ! -z "$REMAINING" ]; then
    echo "⚠️  Some processes still running, force killing..."
    pkill -9 -f 'bun.*server-bun'
    sleep 1
fi

# Final check
FINAL=$(pgrep -f 'bun.*server-bun')
if [ -z "$FINAL" ]; then
    echo "✅ Server stopped successfully!"
else
    echo "❌ Failed to stop server. Remaining PIDs: $FINAL"
    exit 1
fi

