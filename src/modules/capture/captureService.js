const logger = require('../../core/logger');

class CaptureService {
  constructor(imageCapture) {
    this.imageCapture = imageCapture;
  }

  /**
   * Capture images from Discord message attachments
   * @param {Message} message - Discord message object
   * @returns {Promise<Array>} - Array of uploaded image URLs
   */
  async captureMessageImages(message) {
    if (!this.imageCapture.isEnabled()) {
      return [];
    }

    const uploadedImages = [];

    try {
      if (!message.attachments || message.attachments.size === 0) {
        return uploadedImages;
      }

      const images = [];

      for (const [, attachment] of message.attachments) {
        if (attachment.contentType && attachment.contentType.startsWith('image/')) {
          try {
            logger.info(`Downloading image: ${attachment.name}`);
            const imageBuffer = await this.imageCapture.downloadImage(attachment.url);
            images.push({
              buffer: imageBuffer,
              name: attachment.name || `image-${Date.now()}.png`
            });
          } catch (error) {
            logger.warn(`Failed to download attachment ${attachment.name}: ${error.message}`);
          }
        }
      }

      if (images.length > 0) {
        logger.info(`Uploading ${images.length} image(s) to server...`);
        const result = await this.imageCapture.uploadImages(images);
        if (result.success) {
          uploadedImages.push(...result.uploads.filter(u => u.success).map(u => u.url));
          logger.info(`Successfully uploaded ${uploadedImages.length} image(s)`);
        }
      }

    } catch (error) {
      logger.error('Failed to capture message images:', error.message);
    }

    return uploadedImages;
  }

  /**
   * Capture images from multiple messages
   * @param {Array<Message>} messages - Array of Discord messages
   * @returns {Promise<Object>} - Map of message ID to image URLs
   */
  async captureMultipleMessages(messages) {
    if (!this.imageCapture.isEnabled()) {
      logger.warn('Image capture not enabled, skipping capture');
      return {};
    }

    const results = {};
    let totalCaptured = 0;

    for (const message of messages) {
      try {
        const imageUrls = await this.captureMessageImages(message);
        if (imageUrls.length > 0) {
          results[message.id] = imageUrls;
          totalCaptured += imageUrls.length;
        }
      } catch (error) {
        logger.error(`Failed to capture images from message ${message.id}: ${error.message}`);
      }
    }

    logger.info(`Total captured: ${totalCaptured} image(s) from ${Object.keys(results).length} message(s)`);
    return results;
  }
}

module.exports = CaptureService;