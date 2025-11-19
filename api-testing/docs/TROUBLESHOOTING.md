# Troubleshooting Guide

## Error: "Failed to load frame from server"

### Step 1: Check if server is running
```bash
# Check if bun process is running
Get-Process -Name "bun" -ErrorAction SilentlyContinue
```

If no process found, start the server:
```bash
bun run dev
```

### Step 2: Check server console output
When you run `bun run dev`, you should see:
```
✅ Flipdot-emu package loaded (or warning)
✅ Canvas package loaded (or error)
🌐 API server running on port 3001
👀 Preview: http://localhost:3001/room.html
🎮 Flipboard 3D Gallery Server started
```

**If you see errors:**
- `❌ Canvas package failed to load` - Canvas isn't installed properly
  - Server will still work with fallback (black frames)
  - To fix: Install Visual Studio Build Tools or Python, then `bun install canvas --force`
  
- `❌ Failed to start server on port 3001` - Port is already in use
  - Solution: Kill the other process or change PORT in server-bun.ts

### Step 3: Test the API directly
Open in browser: `http://localhost:3001/api/frame`

**Expected:** Should show a black image (or rendered frame if canvas works)

**If 404:** Server isn't running or route isn't registered
**If error:** Check server console for details

### Step 4: Check browser console
Press F12 in browser, check Console tab for errors:
- CORS errors - Server should handle this, but check
- Network errors - Check if server is accessible
- 404 errors - Check URL path

### Step 5: Verify server is accessible
```bash
# Test health endpoint
curl http://localhost:3001/health

# Should return: {"status":"OK","timestamp":"..."}
```

### Common Issues

#### Server won't start
- Check if port 3001 is available
- Check if bun is installed: `bun --version`
- Check dependencies: `bun install`

#### Canvas errors
- On Windows: Install Visual Studio Build Tools
- Or use fallback mode (server will work but only show black frames)

#### Frame endpoint returns 404
- Check if `latestFrameBuffer` is initialized
- Check server console for initialization errors
- Try accessing `/health` endpoint first

#### Browser shows connection error
- Make sure URL is: `http://localhost:3001/room.html`
- Check if server is running on correct port
- Check browser console for specific error messages

## Quick Fix Commands

```bash
# Kill any existing bun processes
taskkill /F /IM bun.exe

# Start fresh
bun run dev

# In another terminal, test the endpoint
curl http://localhost:3001/api/frame -o test.png
```

If `test.png` is created and valid, the server is working!



