# Local Development Setup

## 1. Install ngrok (if not installed)
```bash
npm install -g ngrok
```

## 2. Start your local server
```bash
npm run dev
```

## 3. In another terminal, expose your local server
```bash
ngrok http 3000
```

## 4. Copy the ngrok URL
You'll see something like: `https://abc123.ngrok.io`

## 5. Update Slack App URLs
In your Slack app settings, use:
- **Slash Commands Request URL**: `https://abc123.ngrok.io/slack/events`
- **Interactivity Request URL**: `https://abc123.ngrok.io/slack/events`

## 6. Test the command
In Slack: `/upload-flipboard https://github.com/electromalina/flipdots-project/tree/Doom-Flipboard-Jen/custom-doom`
