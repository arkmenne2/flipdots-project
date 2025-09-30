# Postman API Testing Guide

## 🌐 Base URLs

**Local Testing:**
- Local Server: `http://localhost:3000`
- ngrok Public URL: `https://abc123.ngrok.io` (replace with your actual ngrok URL)

## 📋 Test Endpoints

### 1. Health Check Endpoint
**Purpose:** Verify server is running

**Request:**
- **Method:** `GET`
- **URL:** `http://localhost:3000/health` or `https://your-ngrok-url.ngrok.io/health`
- **Headers:** None required

**Expected Response:**
```json
{
    "status": "OK",
    "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### 2. Slack Slash Command Simulation
**Purpose:** Test the /upload-flipboard command logic

**Request:**
- **Method:** `POST`
- **URL:** `http://localhost:3000/slack/events` or `https://your-ngrok-url.ngrok.io/slack/events`
- **Headers:**
  ```
  Content-Type: application/x-www-form-urlencoded
  ```
- **Body (x-www-form-urlencoded):**
  ```
  token=your_verification_token
  team_id=T1234567890
  team_domain=yourteam
  channel_id=C1234567890
  channel_name=general
  user_id=U1234567890
  user_name=testuser
  command=/upload-flipboard
  text=https://github.com/electromalina/flipdots-project/tree/Doom-Flipboard-Jen/custom-doom
  response_url=https://hooks.slack.com/commands/1234567890/1234567890/abcdefghijk
  trigger_id=1234567890.1234567890.abcdefghijk
  ```

## 🧪 Postman Collection

### Collection: Flipboard Slack API Tests

#### Test 1: Health Check
```json
{
    "name": "Health Check",
    "request": {
        "method": "GET",
        "header": [],
        "url": {
            "raw": "{{base_url}}/health",
            "host": ["{{base_url}}"],
            "path": ["health"]
        }
    }
}
```

#### Test 2: Valid GitHub URL
```json
{
    "name": "Upload Flipboard - Valid URL",
    "request": {
        "method": "POST",
        "header": [
            {
                "key": "Content-Type",
                "value": "application/x-www-form-urlencoded"
            }
        ],
        "body": {
            "mode": "urlencoded",
            "urlencoded": [
                {"key": "command", "value": "/upload-flipboard"},
                {"key": "text", "value": "https://github.com/electromalina/flipdots-project/tree/Doom-Flipboard-Jen/custom-doom"},
                {"key": "user_name", "value": "testuser"},
                {"key": "channel_name", "value": "general"}
            ]
        },
        "url": {
            "raw": "{{base_url}}/slack/events",
            "host": ["{{base_url}}"],
            "path": ["slack", "events"]
        }
    }
}
```

#### Test 3: Invalid GitHub URL
```json
{
    "name": "Upload Flipboard - Invalid URL",
    "request": {
        "method": "POST",
        "header": [
            {
                "key": "Content-Type",
                "value": "application/x-www-form-urlencoded"
            }
        ],
        "body": {
            "mode": "urlencoded",
            "urlencoded": [
                {"key": "command", "value": "/upload-flipboard"},
                {"key": "text", "value": "not-a-valid-url"},
                {"key": "user_name", "value": "testuser"},
                {"key": "channel_name", "value": "general"}
            ]
        },
        "url": {
            "raw": "{{base_url}}/slack/events",
            "host": ["{{base_url}}"],
            "path": ["slack", "events"]
        }
    }
}
```

## 🔧 Environment Variables for Postman

Create an environment in Postman with these variables:

**Local Environment:**
- `base_url`: `http://localhost:3000`

**ngrok Environment:**
- `base_url`: `https://your-ngrok-url.ngrok.io` (replace with actual URL)

## 📝 How to Get Your ngrok URL

1. **Option 1: Check ngrok web interface**
   - Open browser: `http://localhost:4040`
   - Look for "Forwarding" URL

2. **Option 2: Check terminal where ngrok is running**
   - Look for line like: `Forwarding https://abc123.ngrok.io -> http://localhost:3000`

## 🎯 Expected Test Results

### Health Check
- **Status Code:** `200 OK`
- **Response:** JSON with status and timestamp

### Valid GitHub URL
- **Status Code:** `200 OK`
- **Response:** Success message or Slack-formatted response

### Invalid GitHub URL
- **Status Code:** `200 OK` (Slack expects 200)
- **Response:** Error message about invalid URL

## 🐛 Troubleshooting

**If health check fails:**
- Ensure server is running: `node server.js`
- Check if port 3000 is available
- Verify no firewall blocking

**If ngrok URL doesn't work:**
- Restart ngrok: `ngrok http 3000`
- Update Postman environment with new URL
- Check ngrok dashboard at `http://localhost:4040`
