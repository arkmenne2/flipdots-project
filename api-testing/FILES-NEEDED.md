# 📁 Files Needed for Deployment

## 🎨 For room.html (3D Gallery Room)

### **Essential Files:**

1. **HTML Files:**
   - `room.html` - Main 3D gallery room page
   - `dashboard.html` - Upload dashboard (optional but recommended)

2. **JavaScript Files (js/ folder):**
   - `js/config.js` - Configuration settings
   - `js/engine.js` - 3D rendering engine
   - `js/gallery.js` - Gallery paintings system
   - `js/player.js` - Player movement and controls
   - `js/world.js` - World map and walls

3. **API Backend (PHP):**
   - `index.php` - Main PHP API server
   - `.htaccess` - URL rewriting and CORS configuration

4. **Data Folder:**
   - `data/` - Folder (will be created automatically if it doesn't exist)
   - `data/uploads.json` - Upload storage (auto-created by PHP)

## 📦 Complete File List for FileZilla Upload

### **Required Files:**
```
/api-testing/
├── room.html                    ✅ Main gallery room
├── dashboard.html               ✅ Dashboard page
├── index.php                    ✅ PHP API backend
├── .htaccess                    ✅ Server configuration
├── js/
│   ├── config.js                ✅ Game configuration
│   ├── engine.js                ✅ 3D rendering engine
│   ├── gallery.js               ✅ Gallery system
│   ├── player.js                ✅ Player controls
│   └── world.js                 ✅ World map
└── data/                        ✅ (Create folder, 755 permissions)
    └── uploads.json             (Auto-created by PHP)
```

### **Optional Files (for reference):**
- `README.md` - Documentation
- `DEPLOYMENT.md` - Deployment guide
- `postman-tests.md` - Testing guide
- `Flipboard-API-Tests.postman_collection.json` - Postman collection

## ❌ Do NOT Upload:
- `node_modules/` - Node.js dependencies (not needed for PHP)
- `pages/` - Next.js pages (not needed for PHP hosting)
- `lib/` - TypeScript files (not needed for PHP hosting)
- `package.json`, `package-lock.json` - Node.js files
- `.next/`, `out/`, `build/` - Build folders
- `tsconfig.json`, `next.config.js` - TypeScript/Next.js config
- `temp-*` folders - Temporary files
- `flipboard-output/` - Generated images
- `test-*` folders - Test files

## 🔧 External Dependencies (Loaded from CDN):
- Three.js - Loaded from `https://unpkg.com/three@0.160.0/build/three.min.js` (no file needed)

## 📋 Quick Checklist:

- [ ] `room.html`
- [ ] `dashboard.html`
- [ ] `index.php`
- [ ] `.htaccess`
- [ ] `js/config.js`
- [ ] `js/engine.js`
- [ ] `js/gallery.js`
- [ ] `js/player.js`
- [ ] `js/world.js`
- [ ] `data/` folder (create with 755 permissions)

## 🎯 Server Structure After Upload:

```
/public_html/api-testing/
├── room.html
├── dashboard.html
├── index.php
├── .htaccess
├── js/
│   ├── config.js
│   ├── engine.js
│   ├── gallery.js
│   ├── player.js
│   └── world.js
└── data/
    └── uploads.json (auto-created)
```

## ⚙️ Permissions:
- Files: `644`
- Folders: `755`
- `data/` folder: `755` or `777` (needs to be writable for PHP)

## 🌐 URLs After Deployment:
- Gallery Room: `https://your-domain.com/api-testing/room.html`
- Dashboard: `https://your-domain.com/api-testing/dashboard.html`
- API: `https://your-domain.com/api-testing/uploads`
- Health: `https://your-domain.com/api-testing/health`

