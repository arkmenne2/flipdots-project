# 🚀 Flipboard Slack API - Next.js Version

A modern Next.js backend for your Slack flipboard integration with React dashboard.

## ✨ Features

- **🎮 Slack Integration** - `/upload-flipboard` slash command
- **📊 React Dashboard** - Beautiful UI to view uploads
- **🔗 GitHub Validation** - Automatic URL parsing and validation
- **💾 File-based Storage** - JSON file storage (keeps last 6 uploads)
- **🎨 Modern UI** - Responsive design with TypeScript support

## 📁 Project Structure

```
├── pages/
│   ├── api/
│   │   ├── index.ts          # API info endpoint
│   │   ├── health.ts         # Health check
│   │   ├── uploads.ts        # Upload history (JSON)
│   │   └── slack/
│   │       └── events.ts     # Slack slash command handler
│   ├── index.tsx             # Homepage
│   └── dashboard.tsx         # Upload dashboard
├── lib/
│   ├── github.ts             # GitHub URL utilities
│   └── uploads.ts            # Upload logging functions
├── data/
│   └── uploads.json          # Upload storage (auto-created)
├── next.config.js            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

## 🛠️ Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Server will start at: `http://localhost:3000`

### 3. Available Endpoints

- **Homepage:** `http://localhost:3000/`
- **Dashboard:** `http://localhost:3000/dashboard`
- **API Info:** `http://localhost:3000/api`
- **Health:** `http://localhost:3000/api/health`
- **Uploads:** `http://localhost:3000/api/uploads`
- **Slack Events:** `http://localhost:3000/api/slack/events`

## 🌐 Production Deployment

### Option 1: Vercel (Recommended)

1. **Connect to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Update Slack App URL:**
   ```
   https://your-app.vercel.app/api/slack/events
   ```

### Option 2: Traditional Hosting

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

3. **Configure reverse proxy** (nginx/apache) to point to Next.js server

### Option 3: Static Export (if supported by your host)

1. **Add to `next.config.js`:**
   ```javascript
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     images: {
       unoptimized: true
     }
   }
   ```

2. **Build static files:**
   ```bash
   npm run build
   ```

## ⚙️ Slack App Configuration

### Update Request URLs

Replace your Slack app URLs with:

**Slash Command:**
- **Request URL:** `https://your-domain.com/api/slack/events`

**Interactivity:**
- **Request URL:** `https://your-domain.com/api/slack/events`

### Required Scopes

Ensure these Bot Token Scopes are set:
- `commands`
- `chat:write`
- `chat:write.public`

## 🧪 Testing

### Local Testing

1. **Start dev server:** `npm run dev`
2. **Use ngrok for Slack:** `ngrok http 3000`
3. **Update Slack URL:** `https://abc123.ngrok.io/api/slack/events`

### Endpoints Testing

```bash
# Health check
curl http://localhost:3000/api/health

# API info
curl http://localhost:3000/api

# Upload history
curl http://localhost:3000/api/uploads
```

### Slack Command Testing

In Slack:
```
/upload-flipboard https://github.com/electromalina/flipdots-project/tree/Doom-Flipboard-Jen/custom-doom
```

## 📊 Dashboard Features

The React dashboard (`/dashboard`) includes:

- **📈 Statistics** - Total uploads counter
- **📋 Recent Uploads** - Last 5 uploads with details
- **🔗 GitHub Links** - Direct links to repositories
- **👤 User Info** - Slack username and channel
- **📱 Responsive** - Works on mobile and desktop

## 🔧 Configuration

### Environment Variables (Optional)

Create `.env.local` for custom configuration:

```env
# Custom port (default: 3000)
PORT=3000

# Custom data directory (default: ./data)
DATA_DIR=./data
```

### URL Rewriting

The app includes URL rewriting to maintain compatibility:
- `/api-testing/*` → `/api/*`

This ensures your existing Slack configuration continues to work.

## 📝 API Reference

### GET /api
Returns server information and available endpoints.

### GET /api/health
Health check endpoint.

### POST /api/slack/events
Handles Slack slash commands. Expects form-encoded data.

### GET /api/uploads
Returns JSON array of upload history (last 6 uploads).

### GET /dashboard
React dashboard for viewing uploads.

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **Permission errors:**
   - Ensure `data/` directory is writable
   - Check file permissions for `uploads.json`

3. **Slack not receiving responses:**
   - Verify URL is publicly accessible
   - Check CORS headers are set correctly
   - Ensure POST method is allowed

### Debug Mode

Add to your Slack handler for debugging:
```typescript
console.log('Slack request:', req.body);
```

## 🚀 Deployment Checklist

- [ ] Install dependencies: `npm install`
- [ ] Build application: `npm run build`
- [ ] Test locally: `npm run dev`
- [ ] Deploy to hosting platform
- [ ] Update Slack app Request URL
- [ ] Test slash command in Slack
- [ ] Verify dashboard is accessible
- [ ] Check upload logging works

## 💡 Next Steps

- Add database integration (PostgreSQL/MongoDB)
- Implement user authentication
- Add upload analytics
- Create API rate limiting
- Add email notifications
- Implement webhook integrations

## 📄 License

MIT License - see LICENSE file for details.


