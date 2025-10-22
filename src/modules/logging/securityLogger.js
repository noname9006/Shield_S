const { EmbedBuilder } = require('discord.js');
const config = require('../../core/config');
const logger = require('../../core/logger');

/**
 * Log a security event to the configured log channel
 * @param {Message} message - Original message object
 * @param {string} action - Action taken (e.g., "timeout", "ban")
 * @param {string} actionDetails - Details about the action
 * @param {number} imageCount - Number of images detected
 * @param {Array} messages - Array of message objects to link
 * @param {number} emptyMessageCount - Number of messages sent with no text
 * @param {Object} capturedImages - Map of message ID to image URLs from VPS
 * @returns {Promise<void>}
 */
async function logSecurityEvent(message, action, actionDetails, imageCount = 0, messages = [], emptyMessageCount = 0, capturedImages = {}) {
  const logChannelId = config.getLogChannel(message.guild.id);
  
  if (!logChannelId) {
    logger.warn('No log channel configured for this guild');
    return;
  }

  const logChannel = message.guild.channels.cache.get(logChannelId);
  
  if (!logChannel) {
    logger.error('Log channel not found');
    return;
  }

  try {
    // Build description with potential scam warning
    let description = '';
    if (emptyMessageCount > 0 && imageCount > 0) {
      description = `⚠️ **Potential scam** (${imageCount} image${imageCount !== 1 ? 's' : ''} sent with no text)`;
    }

    const embed = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle('🚨 Security Action: User Timed Out')
      .addFields(
        { name: 'User', value: `<@${message.author.id}> (${message.author.id})`, inline: true },
        { name: 'Channel', value: `<#${message.channel.id}>`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Shield Security Bot' });

    // Add description only if there's a scam warning
    if (description) {
      embed.setDescription(description);
    }

    // Add captured images from VPS (only clickable links, no thumbnails)
    if (capturedImages && Object.keys(capturedImages).length > 0) {
      let allImageUrls = [];
      
      // Collect all image URLs
      for (const [msgId, imageUrls] of Object.entries(capturedImages)) {
        allImageUrls.push(...imageUrls);
      }

      if (allImageUrls.length > 0) {
        // Show clickable links to all captured images
        const imageLinks = allImageUrls.map((url, i) => `[Image ${i + 1}](${url})`).join(' • ');
        
        embed.addFields({ 
          name: `Captured Images`, 
          value: imageLinks.length > 1024 ? imageLinks.substring(0, 1021) + '...' : imageLinks,
          inline: false 
        });
      }
    } else {
      // No images were captured
      embed.addFields({ 
        name: '⚠️ Images Not Captured', 
        value: 'Images were not saved (image server may be disabled or failed)',
        inline: false 
      });
    }

    await logChannel.send({ 
      embeds: [embed]
    });
    
    logger.info('Event logged to channel');
  } catch (error) {
    logger.error('Failed to log security event:', error);
  }
}

/**
 * Log a timeout action
 * @param {Message} message - Original message
 * @param {number} timeoutDuration - Timeout duration in milliseconds
 * @param {string} timeoutText - Formatted timeout duration
 * @param {number} imageCount - Number of images detected
 * @param {Array} messages - Array of message objects
 * @param {number} emptyMessageCount - Number of empty messages
 * @param {Object} capturedImages - Map of message ID to image URLs from VPS
 */
async function logTimeoutAction(message, timeoutDuration, timeoutText, imageCount, messages = [], emptyMessageCount = 0, capturedImages = {}) {
  await logSecurityEvent(message, 'timeout', '', imageCount, messages, emptyMessageCount, capturedImages);
}

/**
 * Log a ban action
 * @param {Message} message - Original message
 * @param {number} imageCount - Number of images detected
 * @param {Array} messages - Array of message objects
 * @param {number} emptyMessageCount - Number of empty messages
 * @param {Object} capturedImages - Map of message ID to image URLs from VPS
 */
async function logBanAction(message, imageCount, messages = [], emptyMessageCount = 0, capturedImages = {}) {
  await logSecurityEvent(message, 'ban', '', imageCount, messages, emptyMessageCount, capturedImages);
}

module.exports = {
  logSecurityEvent,
  logTimeoutAction,
  logBanAction
};