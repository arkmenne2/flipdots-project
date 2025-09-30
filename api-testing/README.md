# Flipboard Slack API

A Slack app that allows users to upload and share flipboard GitHub repositories using slash commands.

## Features

- `/upload-flipboard` slash command to share GitHub repositories
- Supports GitHub URLs with branches and specific paths
- Rich message formatting with repository information
- Interactive buttons for easy access
- GitHub API integration for enhanced repository details

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file with your Slack app credentials:

```env
SLACK_BOT_TOKEN=xapp-1-A09H2EVHB4J-9593883263681-8391448d646940b17c0002fc472e933fa5d787874255a9db3b708b4b676bbc72
SLACK_SIGNING_SECRET=your_slack_signing_secret_here
PORT=3000
GITHUB_TOKEN=your_github_token_here
```

### 3. Create Slack App

1. Go to [Slack API](https://api.slack.com/apps)
2. Click "Create New App" → "From an app manifest"
3. Select your workspace
4. Copy and paste the contents of `app-manifest.json`
5. Click "Create"
6. Install the app to your workspace

### 4. Configure Slack App

1. Go to "OAuth & Permissions" in your Slack app settings
2. Copy the "Bot User OAuth Token" and update your `.env` file
3. Go to "Basic Information" and copy the "Signing Secret"
4. Go to "Slash Commands" and set the Request URL to your server endpoint:
   - For local development: `https://your-ngrok-url.ngrok.io/slack/events`
   - For production: `https://your-domain.com/slack/events`

### 5. Run the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

## Usage

In any Slack channel where the app is installed, use:

```
/upload-flipboard https://github.com/electromalina/flipdots-project/tree/Doom-Flipboard-Jen/custom-doom
```

or with @mention format:
```
/upload-flipboard @https://github.com/electromalina/flipdots-project/tree/Doom-Flipboard-Jen/custom-doom
```

## Supported GitHub URL Formats

- `https://github.com/user/repo`
- `https://github.com/user/repo/tree/branch`
- `https://github.com/user/repo/tree/branch/path/to/folder`

## Development

### Local Testing with ngrok

1. Install ngrok: `npm install -g ngrok`
2. Start your local server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Update your Slack app's Request URL with the ngrok URL

### Health Check

The server includes a health check endpoint at `/health` for monitoring.

## API Endpoints

- `POST /slack/events` - Slack events and slash commands
- `GET /health` - Health check endpoint

## License

MIT
