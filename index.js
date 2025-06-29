const { Telegraf } = require('telegraf');
const { TwitterApi } = require('twitter-api-v2');
const express = require('express');

// Initialize Express app for health checks
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint for Render
app.get('/', (req, res) => {
  res.json({ status: 'Bot is running', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Environment variables validation
const requiredEnvVars = [
  'TELEGRAM_BOT_TOKEN',
  'TWITTER_API_KEY',
  'TWITTER_API_SECRET',
  'TWITTER_ACCESS_TOKEN',
  'TWITTER_ACCESS_TOKEN_SECRET',
  'TELEGRAM_CHANNEL_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

// Initialize Telegram bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Initialize Twitter client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const rwClient = twitterClient.readWrite;

// Channel ID to monitor (can be multiple channels)
const MONITORED_CHANNELS = process.env.TELEGRAM_CHANNEL_ID.split(',').map(id => id.trim());

// Message processing function
async function processMessage(ctx) {
  try {
    const message = ctx.message || ctx.channelPost;
    if (!message) return;

    // Check if message is from monitored channel
    const chatId = message.chat.id.toString();
    if (!MONITORED_CHANNELS.includes(chatId)) {
      console.log(`Message from unmonitored channel: ${chatId}`);
      return;
    }

    let tweetText = '';
    let mediaIds = [];

    // Extract text content
    if (message.text) {
      tweetText = message.text;
    } else if (message.caption) {
      tweetText = message.caption;
    }

    // Handle different message types
    if (message.photo && message.photo.length > 0) {
      // Get the highest resolution photo
      const photo = message.photo[message.photo.length - 1];
      const photoBuffer = await downloadTelegramFile(ctx, photo.file_id);
      const mediaId = await uploadMediaToTwitter(photoBuffer, 'image/jpeg');
      if (mediaId) mediaIds.push(mediaId);
    }

    if (message.video) {
      const videoBuffer = await downloadTelegramFile(ctx, message.video.file_id);
      const mediaId = await uploadMediaToTwitter(videoBuffer, 'video/mp4');
      if (mediaId) mediaIds.push(mediaId);
    }

    if (message.document) {
      // Handle documents (you might want to add specific logic for different file types)
      console.log('Document received, type:', message.document.mime_type);
    }

    // Ensure tweet text doesn't exceed Twitter's character limit
    if (tweetText.length > 280) {
      tweetText = tweetText.substring(0, 277) + '...';
    }

    // If no text and no media, skip
    if (!tweetText && mediaIds.length === 0) {
      console.log('No content to tweet');
      return;
    }

    // Post to Twitter
    const tweetOptions = {
      text: tweetText || 'New post from Telegram channel'
    };

    if (mediaIds.length > 0) {
      tweetOptions.media = { media_ids: mediaIds };
    }

    const tweet = await rwClient.v2.tweet(tweetOptions);
    console.log('Tweet posted successfully:', tweet.data.id);

  } catch (error) {
    console.error('Error processing message:', error);
    
    // Send error notification to a specific chat (optional)
    if (process.env.ERROR_CHAT_ID) {
      try {
        await ctx.telegram.sendMessage(
          process.env.ERROR_CHAT_ID,
          `Error posting to Twitter: ${error.message}`
        );
      } catch (notifyError) {
        console.error('Failed to send error notification:', notifyError);
      }
    }
  }
}

// Download file from Telegram
async function downloadTelegramFile(ctx, fileId) {
  try {
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const response = await fetch(fileLink.href);
    return await response.buffer();
  } catch (error) {
    console.error('Error downloading Telegram file:', error);
    throw error;
  }
}

// Upload media to Twitter
async function uploadMediaToTwitter(buffer, mimeType) {
  try {
    const mediaUpload = await rwClient.v1.uploadMedia(buffer, { mimeType });
    return mediaUpload;
  } catch (error) {
    console.error('Error uploading media to Twitter:', error);
    return null;
  }
}

// Bot event listeners
bot.on('channel_post', processMessage);
bot.on('message', processMessage);

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  console.error('Context:', ctx.updateType);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  bot.stop('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  bot.stop('SIGTERM');
  process.exit(0);
});

// Start the bot and express server
async function startBot() {
  try {
    // Test Twitter connection
    const me = await rwClient.v2.me();
    console.log('Twitter connection successful. Authenticated as:', me.data.username);

    // Start the bot
    await bot.launch();
    console.log('Telegram bot started successfully');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Health check server running on port ${PORT}`);
    });

    console.log('Bot is running and ready to forward messages from Telegram to Twitter');
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

startBot();
