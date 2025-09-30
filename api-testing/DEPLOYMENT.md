# 🚀 FileZilla Deployment Guide

## 📁 Files to Upload

Upload these files to your server's `api-testing` directory using FileZilla:

### **Required Files:**
- `index.php` - Main PHP server file
- `.htaccess` - URL rewriting and CORS configuration

### **Optional Files (for reference):**
- `README.md` - Documentation
- `postman-tests.md` - Testing guide
- `Flipboard-API-Tests.postman_collection.json` - Postman collection

## 📂 Server Directory Structure

Your server should look like this:
```
/public_html/api-testing/
├── index.php
├── .htaccess
├── README.md (optional)
└── other files...
```

## 🔧 FileZilla Upload Steps

1. **Connect to your server** via FileZilla
2. **Navigate** to the `api-testing` directory (or create it)
3. **Upload** the following files:
   - `index.php`
   - `.htaccess`
4. **Set permissions** (if needed):
   - `index.php`: 644
   - `.htaccess`: 644

## 🌐 Test Your Deployment

After uploading, test these URLs:

### **Root Endpoint:**
```
https://i558110.hera.fontysict.net/api-testing/
```
Should return: Server info JSON

### **Health Check:**
```
https://i558110.hera.fontysict.net/api-testing/health
```
Should return: `{"status":"OK","timestamp":"..."}`

### **Slack Events (for Slack only):**
```
https://i558110.hera.fontysict.net/api-testing/slack/events
```
This is for Slack POST requests only

## ⚙️ Slack App Configuration

Update your Slack app with:
- **Request URL:** `https://i558110.hera.fontysict.net/api-testing/slack/events`

## 🧪 Testing with Postman

You can test the PHP version using the same Postman collection, just update the base URL to:
```
https://i558110.hera.fontysict.net/api-testing
```

## 🐛 Troubleshooting

### **If you get 403 Forbidden:**
- Check file permissions (should be 644)
- Ensure `.htaccess` is uploaded correctly

### **If you get 500 Internal Server Error:**
- Check server error logs
- Ensure PHP is enabled on your hosting

### **If Slack command doesn't work:**
- Verify the Request URL in Slack app settings
- Check that POST requests are working

## 🎯 Expected Results

- **Root URL:** Shows server info
- **Health endpoint:** Returns OK status
- **Slack command:** Works in Slack with rich formatting

## 📝 Notes

- This PHP version provides the same functionality as the Node.js version
- It handles GitHub URL validation and parsing
- It returns properly formatted Slack responses
- No database or additional setup required
