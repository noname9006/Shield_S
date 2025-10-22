const axios = require('axios');
const FormData = require('form-data');
const logger = require('../core/logger');

class ImageCapture {
  constructor(serverUrl, apiKey) {
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
  }

  /**
   * Download image from URL
   * @param {string} url - Image URL
   * @returns {Promise<Buffer>} - Image buffer
   */
  async downloadImage(url) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      return Buffer.from(response.data);
    } catch (error) {
      logger.error(`Failed to download image from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Upload single image to server
   * @param {Buffer} imageBuffer - Image data
   * @param {string} originalName - Original filename
   * @returns {Promise<Object>} - Upload result with URL
   */
  async uploadImage(imageBuffer, originalName = 'image.png') {
    try {
      const formData = new FormData();
      formData.append('image', imageBuffer, originalName);

      const response = await axios.post(`${this.serverUrl}/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          'X-API-Key': this.apiKey
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to upload image:', error);
      throw error;
    }
  }

  /**
   * Upload multiple images to server
   * @param {Array<Object>} images - Array of {buffer, name}
   * @returns {Promise<Object>} - Upload results
   */
  async uploadImages(images) {
    try {
      const formData = new FormData();

      for (const img of images) {
        formData.append('images', img.buffer, img.name);
      }

      const response = await axios.post(`${this.serverUrl}/upload/batch`, formData, {
        headers: {
          ...formData.getHeaders(),
          'X-API-Key': this.apiKey
        },
        timeout: 60000
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to upload images:', error);
      throw error;
    }
  }

  /**
   * Capture images from Discord message attachments
   * @param {Message} message - Discord message object
   * @returns {Promise<Array>} - Array of uploaded image URLs
   */
  async captureMessageImages(message) {
    const uploadedImages = [];

    try {
      if (!message.attachments || message.attachments.size === 0) {
        return uploadedImages;
      }

      const images = [];

      for (const [, attachment] of message.attachments) {
        if (attachment.contentType && attachment.contentType.startsWith('image/')) {
          try {
            const imageBuffer = await this.downloadImage(attachment.url);
            images.push({
              buffer: imageBuffer,
              name: attachment.name || `image-${Date.now()}.png`
            });
          } catch (error) {
            logger.warn(`Failed to download attachment ${attachment.name}`);
          }
        }
      }

      if (images.length > 0) {
        const result = await this.uploadImages(images);
        if (result.success) {
          uploadedImages.push(...result.uploads.filter(u => u.success).map(u => u.url));
        }
      }

    } catch (error) {
      logger.error('Failed to capture message images:', error);
    }

    return uploadedImages;
  }

  /**
   * Capture images from multiple messages
   * @param {Array<Message>} messages - Array of Discord messages
   * @returns {Promise<Object>} - Map of message ID to image URLs
   */
  async captureMultipleMessages(messages) {
    const results = {};

    for (const message of messages) {
      try {
        const imageUrls = await this.captureMessageImages(message);
        if (imageUrls.length > 0) {
          results[message.id] = imageUrls;
        }
      } catch (error) {
        logger.error(`Failed to capture images from message ${message.id}`);
      }
    }

    return results;
  }
}

module.exports = ImageCapture;