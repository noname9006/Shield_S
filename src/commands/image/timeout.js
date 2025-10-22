const { PermissionFlagsBits } = require('discord.js');
const config = require('../../core/config');
const logger = require('../../core/logger');

/**
 * Parse duration string to milliseconds
 * @param {string} durationStr - Duration string (e.g., "30m", "2h", "1d")
 * @returns {number|null} Duration in milliseconds or null if invalid
 */
function parseDuration(durationStr) {
  const match = durationStr.match(/^(\d+)([mhd])$/);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'm': return value * 60 * 1000; // minutes
    case 'h': return value * 60 * 60 * 1000; // hours
    case 'd': return value * 24 * 60 * 60 * 1000; // days
    default: return null;
  }
}

/**
 * Format duration for display
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(ms) {
  const minutes = Math.floor(ms / (60 * 1000));
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

module.exports = {
  name: 'timeout',
  description: 'Set the timeout duration for image violations',
  async execute(message, args) {
    // Check if user has admin permissions
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission to use this command.');
    }

    // Check if duration is provided
    if (args.length === 0) {
      const currentConfig = config.getImageScannerConfig(message.guild.id);
      const currentDuration = formatDuration(currentConfig.timeout);
      return message.reply(`⚙️ Current timeout duration: **${currentDuration}**\n\nUsage: \`>s image timeout <duration>\`\nExample: \`>s image timeout 30m\`, \`>s image timeout 2h\`, \`>s image timeout 1d\``);
    }

    const durationStr = args[0].toLowerCase();
    const durationMs = parseDuration(durationStr);

    if (!durationMs) {
      return message.reply('❌ Invalid duration format. Use format like: `30m`, `2h`, or `1d`');
    }

    // Discord timeout limit is 28 days
    const maxTimeout = 28 * 24 * 60 * 60 * 1000;
    if (durationMs > maxTimeout) {
      return message.reply('❌ Timeout duration cannot exceed 28 days.');
    }

    config.setImageTimeout(message.guild.id, durationMs);
    logger.info(`Image timeout set to ${durationStr} in ${message.guild.name}`);
    
    return message.reply(`✅ Image scan timeout duration set to **${durationStr}**`);
  }
};