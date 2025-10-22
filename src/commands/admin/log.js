const { PermissionFlagsBits } = require('discord.js');
const config = require('../../core/config');
const logger = require('../../core/logger');

module.exports = {
  name: 'log',
  description: 'Set the log channel for security events',
  async execute(message, args) {
    // Check if user has admin permissions
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission to use this command.');
    }

    // Check if channel is mentioned
    const channelMention = message.mentions.channels.first();
    
    if (!channelMention) {
      return message.reply('❌ Please mention a channel. Usage: `>s log #channel`');
    }

    // Save log channel
    config.setLogChannel(message.guild.id, channelMention.id);
    
    logger.info(`Log channel set to ${channelMention.name} in ${message.guild.name}`);
    
    return message.reply(`✅ Log channel set to ${channelMention}`);
  }
};