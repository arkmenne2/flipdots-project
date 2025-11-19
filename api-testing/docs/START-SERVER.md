# 🚀 How to Start the Bun Server on Remote Server

## ⚠️ **THE PROBLEM**

The Bun server is **NOT running** on your remote server. That's why you're getting 404 errors.

Your requests are hitting Apache/PHP (`index.php`), which doesn't have the `/api/frame` endpoint. The Bun server needs to be running separately.

## ✅ **SOLUTION: Start the Bun Server**

### **Option 1: SSH and Start Manually (Quick Test)**

1. **SSH into your server:**
   ```bash
   ssh your-username@i558110.hera.fontysict.net
   ```

2. **Navigate to the project:**
   ```bash
   cd /path/to/api-testing
   # Or wherever you uploaded the files
   ```

3. **Install Bun (if not installed):**
   ```bash
   curl -fsSL https://bun.sh/install | bash
   export PATH="$HOME/.bun/bin:$PATH"
   ```

4. **Install dependencies:**
   ```bash
   bun install
   ```

5. **Start the server:**
   ```bash
   bun run dev
   ```

6. **Test it:**
   - Open: `http://i558110.hera.fontysict.net:3001/room.html`
   - Or: `http://i558110.hera.fontysict.net:3001/api/frame`

### **Option 2: Run in Background (Permanent)**

To keep the server running after you disconnect:

**Easy way (using provided script):**
```bash
# Make script executable (first time only)
chmod +x scripts/start-server.sh

# Start server in background
./scripts/start-server.sh
```

**Manual way:**
```bash
# Using nohup
nohup bun run dev > server.log 2>&1 &

# Or using PM2 (if installed)
pm2 start "bun run dev" --name flipboard-server
pm2 save  # Save to start on reboot
```

**Useful scripts provided:**
- `scripts/start-server.sh` - Start server in background
- `scripts/stop-server.sh` - Stop the server
- `scripts/check-server.sh` - Check if server is running

### **Optional: Configure Display Modes (Flipdots / LED)**

Set environment variables before running the server (add to `~/.bashrc` or export in the same shell):

```bash
# Choose hardware targets: flipdot,led,emu,stdout (comma separated)
export DISPLAY_MODE=flipdot,led

# Flipdot serial config (USB cable)
export FLIPDOT_SERIAL_PATH=/dev/ttyACM0
export FLIPDOT_BAUD_RATE=57600

# LED wall over TCP
export LED_HOST=127.0.0.1
export LED_PORT=7890

# Layout tweaks
export DISPLAY_PANEL_WIDTH=28
export DISPLAY_MIRRORED=true

# Gameplay / rendering
export AUTO_DEMO=false          # true enables auto movement on boot
export GALLERY_REFRESH_MS=15000 # reload uploads.json every 15s
```

### **Option 3: Configure Apache Reverse Proxy (Recommended)**

This allows you to access the server at `https://i558110.hera.fontysict.net/api-testing/api/frame` instead of port 3001.

1. **Enable Apache proxy modules:**
   ```bash
   sudo a2enmod proxy
   sudo a2enmod proxy_http
   sudo systemctl restart apache2
   ```

2. **Create/edit Apache config** (usually in `/etc/apache2/sites-available/` or `.htaccess`):

   **Option A: Add to `.htaccess` in `/api-testing/` directory:**
   ```apache
   # Proxy API requests to Bun server
   RewriteEngine On
   RewriteCond %{REQUEST_URI} ^/api-testing/api/(.*)$
   RewriteRule ^api/(.*)$ http://127.0.0.1:3001/api/$1 [P,L]
   
   # Proxy health check
   RewriteCond %{REQUEST_URI} ^/api-testing/health$
   RewriteRule ^health$ http://127.0.0.1:3001/health [P,L]
   ```

   **Option B: Add to Apache virtual host config:**
   ```apache
   <LocationMatch "^/api-testing/api/">
       ProxyPass http://127.0.0.1:3001/api/
       ProxyPassReverse http://127.0.0.1:3001/api/
   </LocationMatch>
   
   <LocationMatch "^/api-testing/health">
       ProxyPass http://127.0.0.1:3001/health
       ProxyPassReverse http://127.0.0.1:3001/health
   </LocationMatch>
   ```

3. **Restart Apache:**
   ```bash
   sudo systemctl restart apache2
   ```

4. **Start Bun server** (must be running):
   ```bash
   cd /path/to/api-testing
   nohup bun run dev > server.log 2>&1 &
   ```

## 🔍 **How to Check if Server is Running**

### **Check if Bun server is running:**
```bash
# Check if port 3001 is listening
netstat -tuln | grep 3001
# Or
ss -tuln | grep 3001
```

### **Test the server directly:**
```bash
# From the server itself
curl http://127.0.0.1:3001/health
curl http://127.0.0.1:3001/api/frame --output test.png
```

### **Check server logs:**
```bash
# If using nohup
tail -f server.log

# If using PM2
pm2 logs flipboard-server
```

## 🎯 **Quick Start Checklist**

- [ ] SSH into server
- [ ] `cd` to project directory
- [ ] `bun install` (if not done)
- [ ] `bun run dev` (start server)
- [ ] Test: `curl http://127.0.0.1:3001/health`
- [ ] Test in browser: `http://i558110.hera.fontysict.net:3001/room.html`
- [ ] (Optional) Configure Apache reverse proxy
- [ ] (Optional) Run in background with `nohup` or `pm2`

## 🐛 **Common Issues**

### **Port 3001 already in use:**
```bash
# Find what's using the port
lsof -i :3001
# Kill it
kill -9 <PID>
```

### **Bun not found:**
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
# Add to ~/.bashrc for permanent
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
```

### **Permission denied:**
```bash
# Make sure you have write permissions
chmod -R 755 /path/to/api-testing
```

## 📝 **Current Status**

- ✅ Files uploaded to server
- ❌ **Bun server NOT running** ← **THIS IS THE PROBLEM**
- ❌ Apache not configured to proxy (optional)

**Next step:** Start the Bun server using one of the options above!

