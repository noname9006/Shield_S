const { ActivityType } = require('discord.js');
const logger = require('../core/logger');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    logger.success(`Bot is ready! Logged in as ${client.user.tag}`);
    logger.info(`Serving ${client.guilds.cache.size} guilds`);
    
    client.user.setActivity('for suspicious images', { type: ActivityType.Watching });
  }
};