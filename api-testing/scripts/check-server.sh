#!/bin/bash
# Flipboard 3D Gallery - Server Status Check

echo "🔍 Checking Flipboard 3D Gallery Server Status..."
echo ""

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed!"
    exit 1
fi

# Check if process is running
PIDS=$(pgrep -f 'bun.*server-bun')

if [ -z "$PIDS" ]; then
    echo "❌ Server is NOT running"
    echo ""
    echo "To start the server:"
    echo "   ./start-server.sh"
    echo "   or"
    echo "   bun run dev"
    exit 1
fi

echo "✅ Server is running!"
echo "   PIDs: $PIDS"
echo ""

# Check if port 3001 is listening
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Port 3001 is listening"
else
    echo "⚠️  Port 3001 is not listening (server might be starting up)"
fi

echo ""

# Test health endpoint
echo "🏥 Testing health endpoint..."
HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null)

if [ $? -eq 0 ] && [ ! -z "$HEALTH" ]; then
    echo "✅ Health check passed:"
    echo "   $HEALTH"
else
    echo "❌ Health check failed (server might still be starting)"
fi

echo ""
echo "🔗 Test URLs:"
echo "   Health:  http://localhost:3001/health"
echo "   Preview: http://localhost:3001/room.html"
echo "   Frame:   http://localhost:3001/api/frame"
echo ""

# Show recent logs if log file exists
if [ -f "server.log" ]; then
    echo "📋 Last 5 lines from server.log:"
    echo "---"
    tail -5 server.log
    echo "---"
    echo ""
    echo "View full logs: tail -f server.log"
fi

