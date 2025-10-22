const config = require('../../core/config');
const logger = require('../../core/logger');
const moderationActions = require('../moderation/moderationActions');
const securityLogger = require('../logging/securityLogger');
const messageCollector = require('./messageCollector');
const ImageCapture = require('../capture/imageCapture');
const CaptureService = require('../capture/captureService');

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico'];

// Initialize capture services
const imageCapture = new ImageCapture(
  process.env.IMAGE_SERVER_URL,
  process.env.IMAGE_SERVER_API_KEY
);
const captureService = new CaptureService(imageCapture);

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

  // Check if user has excluded role
  if (member && hasExcludedRole(member, scannerConfig.excludedRoles)) {
    logger.info(`User ${message.author.tag} has excluded role, logging only`);
    
    const imageAttachments = getImageAttachments(message);
    await securityLogger.logSecurityEvent(
      message,
      'excluded',
      'User has excluded role - no action taken',
      imageAttachments.size,
      [message],
      1,
      {}
    );
    return;
  }

  // Get image attachments
  const imageAttachments = getImageAttachments(message);
  const imageCount = imageAttachments.size;

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
    // Step 1: Collect recent messages from the user
    const userMessages = await messageCollector.collectUserMessages(message, 10, 5);
    const analysis = messageCollector.analyzeMessagePattern(userMessages);
    
    logger.info(`Analysis: ${analysis.emptyMessages} empty message(s) out of ${analysis.totalMessages}`);
    
    // Step 2: Capture images BEFORE deletion
    let capturedImages = {};
    if (imageCapture.isEnabled()) {
      logger.info('Capturing images before deletion...');
      capturedImages = await captureService.captureMultipleMessages(userMessages);
      logger.info(`Captured ${Object.keys(capturedImages).length} message(s) with images`);
    } else {
      logger.warn('Image capture is disabled - images will not be saved');
    }

    // Step 3: Delete the message
    await moderationActions.deleteMessage(message);

    // Step 4: Timeout the user
    if (member) {
      const success = await moderationActions.timeoutMember(
        member, 
        scannerConfig.timeout, 
        'Posted message with suspicious image count (automated security action)'
      );
      
      if (success) {
        const timeoutText = moderationActions.formatTimeoutDuration(scannerConfig.timeout);
        
        // Step 5: Log with all enhanced information
        await securityLogger.logTimeoutAction(
          message, 
          scannerConfig.timeout, 
          timeoutText, 
          imageCount,
          userMessages,
          analysis.emptyMessages,
          capturedImages
        );
      }
    }

  } catch (error) {
    logger.error('Error handling suspicious message:', error);
  }
}

module.exports = {
  scanMessage,
  hasOnlyImages,
  getImageAttachments
};