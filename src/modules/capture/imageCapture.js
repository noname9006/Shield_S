const axios = require('axios');
const FormData = require('form-data');
const logger = require('../../core/logger');

class ImageCapture {
  constructor(serverUrl, apiKey) {
    if (!serverUrl || !apiKey) {
      logger.warn('Image capture not configured - SERVER_URL or API_KEY missing');
      this.enabled = false;
      return;
    }

    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
    this.enabled = true;
  }

  /**
   * Check if image capture is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
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
      logger.error(`Failed to download image from ${url}:`, error.message);
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
    if (!this.enabled) {
      logger.warn('Image capture not enabled, skipping upload');
      return null;
    }

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
      logger.error('Failed to upload image:', error.message);
      throw error;
    }
  }

  /**
   * Upload multiple images to server
   * @param {Array<Object>} images - Array of {buffer, name}
   * @returns {Promise<Object>} - Upload results
   */
  async uploadImages(images) {
    if (!this.enabled) {
      logger.warn('Image capture not enabled, skipping batch upload');
      return { success: false, uploads: [] };
    }

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
      logger.error('Failed to upload images:', error.message);
      throw error;
    }
  }
}

module.exports = ImageCapture;