# Installation Guide for Bun Server

## Prerequisites

### Windows Development
1. **Install Bun**: `powershell -c "irm bun.sh/install.ps1 | iex"`
2. **Install Visual Studio Build Tools** (for canvas native module):
   - Download from: https://visualstudio.microsoft.com/downloads/
   - Install "Desktop development with C++" workload
   - Or install Python 3.x (used by node-gyp)

### Linux/Raspberry Pi
1. **Install Bun**: `curl -fsSL https://bun.sh/install | bash`
2. **Install system dependencies**:
   ```bash
   sudo apt-get update
   sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
   ```

## Installation Steps

### 1. Install Dependencies

```bash
bun install
```

**If canvas installation fails on Windows:**
- The server will fall back to a mock canvas implementation
- For full functionality, install build tools (see above)

### 2. Verify Flipdot Package

The `@owowagency/flipdot-emu` package is a local file package located at:
```
test-flipboard-upload/packages/owowagency-flipdot-emu-1.0.0.tgz
```

If this file is missing, copy it from another project or contact the package maintainer.

### 3. Run in Development Mode

```bash
bun run dev
```

This will:
- Save PNG frames to `./flipboard-output/` instead of sending to hardware
- Use mock display if flipdot package isn't available
- Use fallback canvas if native module isn't installed

### 4. Run in Production Mode (Raspberry Pi)

```bash
bun start
```

**Note:** Requires:
- Flipboard hardware connected to `/dev/ttyACM0` (Linux) or COM port (Windows)
- Native canvas module installed
- Flipdot package available

## Troubleshooting

### Canvas Module Not Found
**Error:** `Cannot find module '../build/Release/canvas.node'`

**Solutions:**
1. **Install build tools** (see Prerequisites)
2. **Rebuild canvas**: `bun install canvas --force`
3. **Use fallback mode**: The server will automatically use a fallback if canvas fails

### Flipdot Package Not Found
**Error:** `@owowagency/flipdot-emu@^1.0.0 failed to resolve`

**Solution:**
- Ensure `test-flipboard-upload/packages/owowagency-flipdot-emu-1.0.0.tgz` exists
- Or update `package.json` to point to the correct local path

### Serial Port Access Denied (Linux)
**Error:** `Cannot open /dev/ttyACM0`

**Solution:**
```bash
sudo chmod 666 /dev/ttyACM0
# Or add user to dialout group
sudo usermod -a -G dialout $USER
```

## Alternative: Use Node.js Instead

If Bun has compatibility issues, you can use the original Node.js server:

```bash
npm install
npm run server
```



