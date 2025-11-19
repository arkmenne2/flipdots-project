# 📤 FileZilla Upload Guide - Complete

## ✅ Files to Upload to Server

Upload these files/folders to your server at `i558110.hera.fontysict.net/api-testing/`:

### **Essential Files (REQUIRED)**

1. **`server-bun.ts`** - Main server entry point
2. **`package.json`** - Dependencies and scripts
3. **`tsconfig.json`** - TypeScript configuration
4. **`room.html`** - Preview page for testing

### **Essential Directories (REQUIRED)**

1. **`src/`** - All server-side TypeScript modules
   - `src/room-renderer.ts`
   - `src/player-server.ts`
   - `src/gallery-server.ts`
   - `src/download-handler.ts`
   - `src/ticker.ts`
   - `src/settings.ts`
   - `src/png-encoder.ts`

2. **`js/`** - Client-side JavaScript files (needed by server)
   - `js/world.js` - World map data (REQUIRED)
   - `js/config.js` - Configuration constants (REQUIRED)
   - `js/engine.js` - Not needed for server
   - `js/gallery.js` - Not needed for server
   - `js/player.js` - Not needed for server

3. **`packages/`** - Flipdot-emu package
   - `packages/owowagency-flipdot-emu-1.0.0.tgz`

4. **`data/`** - Data directory (create if doesn't exist)
   - `data/uploads.json` - Gallery uploads data (will be created if missing)

5. **`lib/`** - Library files (if exists)
   - `lib/uploads.ts`
   - `lib/github.ts`

### ⚠️ **Optional Files (Upload if you want)**

- **`index.php`** - PHP backend (if you still use PHP endpoints)
- **`dashboard.html`** - Dashboard page
- **`README-BUN.md`** - Documentation
- **`DEPLOY-FILEZILLA.md`** - This file
- **`INSTALL.md`** - Installation guide
- **`TROUBLESHOOTING.md`** - Troubleshooting guide

### ❌ **DO NOT Upload**

- **`node_modules/`** - Will be installed on server
- **`flipboard-output/`** - Generated frames (created automatically)
- **`temp-repos/`** - Temporary files
- **`temp-room-project/`** - Test files
- **`test-flipboard-upload/`** - Test files
- **`.git/`** - Git repository (optional)
- **`*.md`** - Documentation (optional, except README-BUN.md)

## 📋 After Upload - Server Setup

### 1. Connect to Server via SSH
```bash
ssh your-username@i558110.hera.fontysict.net
cd /path/to/api-testing
```

### 2. Install Bun (if not installed)
```bash
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
```

### 3. Install Dependencies
```bash
bun install
```

### 4. Create Necessary Directories
```bash
mkdir -p flipboard-output
mkdir -p data
```

### 5. Start the Server
```bash
# Development mode (for testing)
bun run dev

# Production mode (for flipboard)
bun start
```

### 6. Run in Background (Optional)
```bash
# Using nohup
nohup bun run dev > server.log 2>&1 &

# Or using PM2 (if installed)
pm2 start "bun run dev" --name flipboard-server
```

## 🔗 Test Links After Deployment

### **Main Preview Page**
```
https://i558110.hera.fontysict.net/api-testing/room.html
```
**What it does:** Shows live preview of frames being sent to flipboard

### **Frame Endpoint (Direct Image)**
```
https://i558110.hera.fontysict.net/api-testing/api/frame
```
**What it does:** Returns the latest rendered frame as PNG image
**Test:** Open in browser - should see a black/white 84×28 pixel image

### **Health Check**
```
https://i558110.hera.fontysict.net/api-testing/health
```
**What it does:** Returns server status
**Expected:** `{"status":"OK","timestamp":"..."}`

### **API Endpoints**

#### Get Uploads
```
GET https://i558110.hera.fontysict.net/api-testing/api/uploads
```
**Expected:** JSON array of uploaded repositories

#### Download Repository
```
POST https://i558110.hera.fontysict.net/api-testing/api/download-repo
Content-Type: application/json

{
  "url": "https://github.com/owner/repo"
}
```

#### Player Control
```
POST https://i558110.hera.fontysict.net/api-testing/api/player/input
Content-Type: application/json

{
  "forward": 1,
  "strafe": 0,
  "turn": 0.5
}
```

#### Save Frame (Manual)
```
GET https://i558110.hera.fontysict.net/api-testing/api/save-frame
```
**What it does:** Saves current frame to disk

## ✅ Testing Checklist

1. **Server Starts**
   - ✅ Check server console for startup messages
   - ✅ Should see: `🌐 API server running on port 3001`

2. **Health Check**
   - ✅ Visit: `https://i558110.hera.fontysict.net/api-testing/health`
   - ✅ Should return: `{"status":"OK"}`

3. **Preview Page**
   - ✅ Visit: `https://i558110.hera.fontysict.net/api-testing/room.html`
   - ✅ Should see: Live updating frames (84×28 pixels)
   - ✅ Check browser console (F12) for errors

4. **Frame Endpoint**
   - ✅ Visit: `https://i558110.hera.fontysict.net/api-testing/api/frame`
   - ✅ Should see: PNG image (may be black initially)

5. **Uploads Endpoint**
   - ✅ Visit: `https://i558110.hera.fontysict.net/api-testing/api/uploads`
   - ✅ Should return: JSON array (may be empty `[]`)

## 🐛 Troubleshooting

### Server Not Starting
- Check if port 3001 is available
- Check Bun installation: `bun --version`
- Check dependencies: `bun install`

### Preview Page Shows "Loading..."
- Check if server is running
- Check browser console (F12) for errors
- Verify `/api/frame` endpoint works

### Frames Are Black
- Check server console for rendering errors
- Verify `data/uploads.json` exists
- Check if canvas module loaded (or using fallback)

### CORS Errors
- Server has CORS enabled for all origins
- Check browser console for specific error

## 📝 Quick Upload Checklist

- [ ] `server-bun.ts`
- [ ] `package.json`
- [ ] `tsconfig.json`
- [ ] `room.html`
- [ ] `src/` folder (all files)
- [ ] `js/world.js` and `js/config.js`
- [ ] `packages/owowagency-flipdot-emu-1.0.0.tgz`
- [ ] `data/` folder (if exists)
- [ ] `lib/` folder (if exists)

**Total size:** ~1-2 MB (excluding node_modules)
