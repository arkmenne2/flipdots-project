#!/bin/bash
# Flipboard 3D Gallery - Server Startup Script
# This script starts the Bun server in the background

echo "🚀 Starting Flipboard 3D Gallery Server..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed!"
    echo "   Install it with: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install
fi

# Check if server is already running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 3001 is already in use!"
    echo "   The server might already be running."
    echo "   To stop it: pkill -f 'bun.*server-bun'"
    echo ""
    read -p "   Kill existing process and restart? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -f 'bun.*server-bun'
        sleep 2
    else
        echo "   Exiting..."
        exit 1
    fi
fi

# Start server in background
echo "🌐 Starting Bun server on port 3001..."
echo "   Logs will be saved to: server.log"
echo ""

# Start with nohup
nohup bun run dev > server.log 2>&1 &

# Get the process ID
SERVER_PID=$!

# Wait a moment to check if it started successfully
sleep 2

# Check if process is still running
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server started successfully!"
    echo "   PID: $SERVER_PID"
    echo "   Log file: $SCRIPT_DIR/server.log"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs:        tail -f server.log"
    echo "   Stop server:      kill $SERVER_PID"
    echo "   Check status:     ps -p $SERVER_PID"
    echo ""
    echo "🔗 Test URLs:"
    echo "   Health:           http://localhost:3001/health"
    echo "   Preview:          http://localhost:3001/room.html"
    echo "   Frame:            http://localhost:3001/api/frame"
    echo ""
else
    echo "❌ Server failed to start!"
    echo "   Check server.log for errors:"
    echo "   tail -20 server.log"
    exit 1
fi

