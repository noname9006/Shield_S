const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const config = require('../../core/config');
const logger = require('../../core/logger');
const imageUploader = require('../storage/imageUploader');

/**
 * Extract file extension from Discord CDN URL
 * @param {string} url - Discord CDN URL
 * @returns {string} File extension
 */
function extractExtension(url) {
  try {
    // Extract filename from URL: get part between last / and ?
    const urlWithoutQuery = url.split('?')[0];
    const parts = urlWithoutQuery.split('/');
    const fullFilename = parts[parts.length - 1];
    
    // Get extension
    const extensionMatch = fullFilename.match(/\.([^.]+)$/);
    if (extensionMatch) {
      return extensionMatch[1];
    }
    
    return 'png'; // Default
  } catch (error) {
    return 'png';
  }
}

/**
 * Build attachment links as plain URLs with simple filenames
 * @param {Array} imageUrls - Array of image objects with url and filename
 * @returns {Array} Array of field objects
 */
function buildAttachmentFields(imageUrls) {
  const fields = [];
  const maxFieldLength = 1024;
  let currentChunk = [];
  let currentLength = 0;
  
  for (let i = 0; i < imageUrls.length; i++) {
    const item = imageUrls[i];
    const extension = extractExtension(item.url);
    const simpleFilename = `image.${extension}`;
    const line = `🔗 [${simpleFilename}](${item.url})`;
    const lineLength = line.length + 1; // +1 for newline
    
    // If adding this line would exceed the limit, start a new field
    if (currentLength + lineLength > maxFieldLength && currentChunk.length > 0) {
      const fieldName = fields.length === 0 ? '📎 Attachments' : '📎 Attachments (cont.)';
      fields.push({
        name: fieldName,
        value: currentChunk.join('\n'),
        inline: false
      });
      currentChunk = [];
      currentLength = 0;
    }
    
    currentChunk.push(line);
    currentLength += lineLength;
  }
  
  // Add remaining items
  if (currentChunk.length > 0) {
    const fieldName = fields.length === 0 ? '📎 Attachments' : '📎 Attachments (cont.)';
    fields.push({
      name: fieldName,
      value: currentChunk.join('\n'),
      inline: false
    });
  }
  
  return fields;
}

/**
 * Log a security event to the configured log channel
 * @param {Message} message - Original message object
 * @param {string} action - Action taken (e.g., "timeout", "ban")
 * @param {string} actionDetails - Details about the action
 * @param {number} imageCount - Number of images detected
 * @param {Array} imageUrls - Array of uploaded image URLs with filenames
 * @returns {Promise<void>}
 */
async function logSecurityEvent(message, action, actionDetails, imageCount = 0, imageUrls = []) {
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
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('⚠️ Security Alert: Suspected Scam')
      .setDescription(`**User:** <@${message.author.id}> (\`${message.author.id}\`)\n**Action:** ${actionDetails}`)
      .addFields(
        { name: 'Channel:', value: `<#${message.channel.id}>`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Sh256ield Security Bot • Protecting Botanix Community' });

    // Add image gallery fields if available
    if (imageUrls.length > 0) {
      const attachmentFields = buildAttachmentFields(imageUrls);
      embed.addFields(...attachmentFields);
    }

    await logChannel.send({ 
      embeds: [embed]
    });
    
    logger.info('Event logged to channel with images');
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
 * @param {Array} imageUrls - Array of uploaded image URLs with filenames
 */
async function logTimeoutAction(message, timeoutDuration, timeoutText, imageCount, imageUrls = []) {
  const actionDetails = `User timed out for **${timeoutText}** and message deleted`;
  await logSecurityEvent(message, 'timeout', actionDetails, imageCount, imageUrls);
}

/**
 * Log a ban action
 * @param {Message} message - Original message
 * @param {number} imageCount - Number of images detected
 * @param {Array} imageUrls - Array of uploaded image URLs with filenames
 */
async function logBanAction(message, imageCount, imageUrls = []) {
  const actionDetails = 'User banned and message deleted';
  await logSecurityEvent(message, 'ban', actionDetails, imageCount, imageUrls);
}

module.exports = {
  logSecurityEvent,
  logTimeoutAction,
  logBanAction
};