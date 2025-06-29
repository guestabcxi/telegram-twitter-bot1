# Telegram to Twitter Bot

A Node.js bot that automatically forwards messages from Telegram channels to Twitter.

## Features

- ✅ Forward text messages from Telegram channels to Twitter
- ✅ Support for images and videos
- ✅ Handle multiple channels
- ✅ Character limit handling (280 chars)
- ✅ Error handling and logging
- ✅ Health check endpoint for deployment
- ✅ Graceful shutdown

## Prerequisites

### 1. Create a Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Use `/newbot` command and follow instructions
3. Save the bot token you receive

### 2. Get Channel ID

1. Add your bot to the channel as an administrator
2. Send a message to the channel
3. Visit `https://api.telegram.org/bot<YourBOTToken>/getUpdates`
4. Look for the channel ID in the response (negative number like `-1001234567890`)

### 3. Twitter API Setup

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Generate API keys and access tokens
4. Make sure your app has Read and Write permissions

## Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd telegram-twitter-bot
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file:
```bash
cp .env.example .env
```

4. Fill in your credentials in the `.env` file

## Local Development

1. Start the bot:
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

2. The bot will start and show connection status
3. Send messages to your monitored Telegram channel to test

## Deployment on Render

### 1. Prepare Your Repository

1. Push your code to GitHub (make sure `.env` is in `.gitignore`)
2. Don't commit sensitive credentials

### 2. Deploy on Render

1. Go to [Render](https://render.com) and sign up
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `telegram-twitter-bot`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Set Environment Variables

In Render dashboard, go to Environment and add:

- `TELEGRAM_BOT_TOKEN`: Your bot token from BotFather
- `TELEGRAM_CHANNEL_ID`: Your channel ID (negative number)
- `TWITTER_API_KEY`: Your Twitter API key
- `TWITTER_API_SECRET`: Your Twitter API secret  
- `TWITTER_ACCESS_TOKEN`: Your Twitter access token
- `TWITTER_ACCESS_TOKEN_SECRET`: Your Twitter access token secret

### 4. Deploy

1. Click "Create Web Service"
2. Render will automatically deploy your bot
3. Check the logs to ensure it's running properly

## Configuration

### Multiple Channels

To monitor multiple channels, separate channel IDs with commas:
```
TELEGRAM_CHANNEL_ID=-1001234567890,-1001234567891,-1001234567892
```

### Error Notifications

Set `ERROR_CHAT_ID` to receive error notifications in a specific chat.

## Monitoring

- Health check endpoint: `https://your-app.onrender.com/health`
- Status endpoint: `https://your-app.onrender.com/`
- Check Render logs for detailed information

## Supported Message Types

- ✅ Text messages
- ✅ Images (photos)
- ✅ Videos  
- ✅ Messages with captions
- ⚠️ Documents (logged but not posted)
- ❌ Stickers, voice messages, etc.

## Limitations

- Twitter character limit: 280 characters (longer messages are truncated)
- Media size limits apply based on Twitter's restrictions
- Rate limiting: Twitter has API rate limits

## Troubleshooting

### Bot Not Receiving Messages

1. Ensure bot is added to channel as administrator
2. Check that `TELEGRAM_CHANNEL_ID` is correct (negative number)
3. Verify bot token is correct

### Twitter Posting Failed

1. Check Twitter API credentials
2. Ensure app has Read and Write permissions
3. Check Twitter API rate limits

### Render Deployment Issues

1. Check build logs in Render dashboard
2. Ensure all environment variables are set
3. Verify `package.json` scripts are correct

## License

MIT License - feel free to modify and use as needed.
