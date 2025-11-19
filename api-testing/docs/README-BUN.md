# 🎮 Flipboard 3D Gallery - Bun Server (Raspberry Pi)

Server-side rendering for flipboard and LED displays using the Bun runtime. Everything runs headless on the Raspberry Pi—no browser required.

## 🚀 Features

- **Server-side 3D raycasting** - Mirrors the browser room in real-time
- **Flipdot + LED output** - Target multiple transports via `DISPLAY_MODE`
- **API endpoints** - Slack integration, gallery data, remote control
- **GitHub cloning** - Walking into a painting triggers repo download
- **Binary / dithering pipeline** - Optimised for flipdot contrast

## 📋 Requirements

- **Bun runtime** - Install from [bun.sh](https://bun.sh)
- **Raspberry Pi** with flipboard hardware (USB serial) or LED controller (TCP)
- **Node.js packages** - Installed via Bun

## 🛠️ Installation

1. **Install Bun** (if not already installed):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Configure flipboard hardware**:
   - Ensure flipboard is connected via USB serial port
   - Default path: `/dev/ttyACM0` (configurable in `server-bun.ts`)

## 🎯 Usage

### Development Mode (saves PNG frames)
```bash
bun run dev
```
This mode keeps hardware optional and serves preview frames via `/api/frame`.

### Production Mode (sends to flipboard)
```bash
bun start
```
Hardware targets are controlled by environment variables (see below).

## ⚙️ Environment Configuration

Set these before starting the server (add to `~/.bashrc` or export per session):

```bash
# Hardware targets: flipdot, led, emu, stdout (comma separated)
export DISPLAY_MODE=flipdot,led

# Flipdot (USB serial)
export FLIPDOT_SERIAL_PATH=/dev/ttyACM0
export FLIPDOT_BAUD_RATE=57600

# LED wall (TCP)
export LED_HOST=127.0.0.1
export LED_PORT=7890

# Layout + rendering
export DISPLAY_PANEL_WIDTH=28
export DISPLAY_MIRRORED=true
export FPS=15
export AUTO_DEMO=false          # true enables looped camera tour
export GALLERY_REFRESH_MS=15000 # reload uploads.json automatically
```

## 📁 Project Structure

```stop
├── server-bun.ts          # Main Bun server entry point
├── src/
│   ├── ticker.ts          # Frame rate controller
│   ├── settings.ts        # Flipboard display settings
│   ├── room-renderer.ts   # 3D raycasting renderer
│   ├── player-server.ts   # Server-side player state
│   ├── gallery-server.ts  # Gallery data management
│   └── download-handler.ts # GitHub repo downloader
├── js/                    # Original client-side code (for reference)
└── data/
    └── uploads.json       # Gallery data from Slack
```

## 🌐 API Endpoints

- `GET /health` - Health check
- `GET /api/uploads` - Get gallery uploads
- `POST /api/slack/events` - Slack slash command handler
- `POST /api/download-repo` - Download GitHub repository
- `POST /api/player/input` - Control player movement (optional)

## 🎮 Player Control

The server boots with the player stationary (no spin). Drive it remotely via the API:

```bash
curl -X POST http://localhost:3001/api/player/input \
  -H "Content-Type: application/json" \
  -d '{"forward": 1, "strafe": 0, "turn": 0}'
```

Set `AUTO_DEMO=true` to enable a looping presentation mode.

## 🔧 Configuration

- Prefer environment variables (see table above)
- Panel layout is defined in `src/settings.ts` (`LAYOUT`)
- API server port defaults to `3001` (`PORT` env overrides)

## 📦 Dependencies

- `@owowagency/flipdot-emu` - Flipboard hardware driver
- `canvas` - Server-side canvas rendering
- `download-git-repo` - GitHub repository downloader
- `express` - API server

## 🐛 Troubleshooting

**Serial port not found:**
- Check USB connection: `ls /dev/ttyACM*`
- Update path in `server-bun.ts` if using different port

**Frames not displaying:**
- Run in dev mode first to verify rendering works
- Check serial port permissions: `sudo chmod 666 /dev/ttyACM0`

**API not responding:**
- Check if port 3001 is available
- Verify Bun is running: `bun --version`

## 📝 Notes

- The server runs continuously, rendering frames at 15 FPS
- `data/uploads.json` auto-reloads on change + periodic refresh
- Collision with a painting kicks off `download-git-repo`
- Binary threshold: pixels > 127 brightness = white, else black




