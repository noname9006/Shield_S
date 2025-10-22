const config = require('../../core/config');
const logger = require('../../core/logger');
const moderationActions = require('../moderation/moderationActions');
const securityLogger = require('../logging/securityLogger');
const imageUploader = require('../storage/imageUploader');

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico'];

/**
 * Check if message contains only images (no text)
 * @param {Message} message - Discord message
 * @returns {boolean}
 */
function hasOnlyImages(message) {
  return message.content.trim().length === 0;
}

/**
 * Filter image attachments from message
 * @param {Message} message - Discord message
 * @returns {Collection} Filtered image attachments
 */
function getImageAttachments(message) {
  return message.attachments.filter(attachment => {
    const extension = attachment.name?.split('.').pop()?.toLowerCase();
    return extension && IMAGE_EXTENSIONS.includes(extension);
  });
}

/**
 * Check if user has any excluded roles
 * @param {GuildMember} member - Guild member
 * @param {Array} excludedRoles - Array of excluded role IDs
 * @returns {boolean}
 */
function hasExcludedRole(member, excludedRoles) {
  return member.roles.cache.some(role => excludedRoles.includes(role.id));
}

/**
 * Scan message for suspicious image-only content
 * @param {Message} message - Discord message to scan
 */
async function scanMessage(message) {
  // Ignore bots
  if (message.author.bot) return;

  // Check if message has text content
  if (!hasOnlyImages(message)) {
    return;
  }

  // Get guild configuration
  const scannerConfig = config.getImageScannerConfig(message.guild.id);
  const member = message.guild.members.cache.get(message.author.id);

  // Get image attachments
  const imageAttachments = getImageAttachments(message);
  const imageCount = imageAttachments.size;

  // Check if user has excluded role
  if (member && hasExcludedRole(member, scannerConfig.excludedRoles)) {
    logger.info(`User ${message.author.tag} has excluded role, logging only`);
    
    // Upload images before logging
    const uploadedImageUrls = await imageUploader.uploadImages(message, imageAttachments);
    
    // Log the event but don't take action
    await securityLogger.logSecurityEvent(
      message,
      'excluded',
      'User has excluded role - no action taken',
      imageCount,
      uploadedImageUrls
    );
    return;
  }

  // Check threshold
  let shouldTrigger = false;
  if (scannerConfig.thresholdType === 'exact') {
    shouldTrigger = imageCount === scannerConfig.threshold;
  } else if (scannerConfig.thresholdType === 'greater') {
    shouldTrigger = imageCount > scannerConfig.threshold;
  }

  if (!shouldTrigger) {
    return;
  }

  logger.warn(`Detected ${imageCount}-image message from ${message.author.tag} in ${message.guild.name}`);

  try {
    // Upload images to storage channel BEFORE deleting the message
    const uploadedImageUrls = await imageUploader.uploadImages(message, imageAttachments);
    
    // Delete the message
    await moderationActions.deleteMessage(message);

    // Timeout the user
    if (member) {
      const success = await moderationActions.timeoutMember(
        member, 
        scannerConfig.timeout, 
        'Posted message with suspicious image count (automated security action)'
      );
      
      if (success) {
        const timeoutText = moderationActions.formatTimeoutDuration(scannerConfig.timeout);
        await securityLogger.logTimeoutAction(message, scannerConfig.timeout, timeoutText, imageCount, uploadedImageUrls);
      }
    }

  } catch (error) {
    logger.error('Error handling suspicious message:', error);
  }
}

module.exports = {
  scanMessage
};