const { PermissionFlagsBits } = require('discord.js');
const config = require('../../core/config');
const logger = require('../../core/logger');

module.exports = {
  name: 'threshold',
  description: 'Set the image threshold for triggering the bot',
  async execute(message, args) {
    // Check if user has admin permissions
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission to use this command.');
    }

    // Check if threshold is provided
    if (args.length === 0) {
      const currentConfig = config.getImageScannerConfig(message.guild.id);
      const thresholdDisplay = currentConfig.thresholdType === 'greater' 
        ? `>${currentConfig.threshold}` 
        : currentConfig.threshold.toString();
      return message.reply(`⚙️ Current threshold: **${thresholdDisplay}** images\n\nUsage: \`>s image threshold <value>\`\nExample: \`>s image threshold 4\` (exactly 4 images) or \`>s image threshold >3\` (more than 3 images)`);
    }

    const thresholdStr = args[0];
    let threshold;
    let thresholdType = 'exact';

    // Check if it's a "greater than" threshold
    if (thresholdStr.startsWith('>')) {
      threshold = parseInt(thresholdStr.substring(1));
      thresholdType = 'greater';
    } else {
      threshold = parseInt(thresholdStr);
    }

    if (isNaN(threshold) || threshold < 1) {
      return message.reply('❌ Invalid threshold. Please provide a positive number or >X format.');
    }

    config.setImageThreshold(message.guild.id, threshold, thresholdType);
    
    const displayValue = thresholdType === 'greater' ? `>${threshold}` : threshold.toString();
    logger.info(`Image threshold set to ${displayValue} in ${message.guild.name}`);
    
    return message.reply(`✅ Image scan threshold set to **${displayValue}** images (with no text)`);
  }
};