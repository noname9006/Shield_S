require('dotenv').config();
const client = require('./src/core/client');
const logger = require('./src/core/logger');

// Start the bot
client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    logger.info('Bot logged in successfully');
  })
  .catch(err => {
    logger.error('Failed to login:', err);
    process.exit(1);
  });

// Handle process termination
process.on('SIGINT', () => {
  logger.info('Shutting down bot...');
  client.destroy();
  process.exit(0);
});