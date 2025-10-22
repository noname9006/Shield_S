const axios = require('axios');
const logger = require('../../core/logger');

/**
 * Upload images to the configured storage channel
 * @param {Message} message - Original message object
 * @param {Collection} imageAttachments - Collection of image attachments
 * @returns {Promise<Array>} Array of objects with url and filename
 */
async function uploadImages(message, imageAttachments) {
  const storageServerId = process.env.IMAGE_STORAGE_SERVER_ID;
  const storageChannelId = process.env.IMAGE_STORAGE_CHANNEL_ID;

  if (!storageServerId || !storageChannelId) {
    logger.warn('Image storage server/channel not configured in environment variables');
    return [];
  }

  try {
    const client = message.client;
    const storageGuild = await client.guilds.fetch(storageServerId);
    
    if (!storageGuild) {
      logger.error('Storage server not found');
      return [];
    }

    const storageChannel = await storageGuild.channels.fetch(storageChannelId);
    
    if (!storageChannel) {
      logger.error('Storage channel not found');
      return [];
    }

    const uploadedUrls = [];

    // Download and re-upload each image
    for (const [id, attachment] of imageAttachments) {
      try {
        // Download the image
        const response = await axios.get(attachment.url, {
          responseType: 'arraybuffer',
          timeout: 10000
        });

        // Create a buffer from the downloaded data
        const buffer = Buffer.from(response.data);

        // Upload to storage channel with metadata
        const uploadMessage = await storageChannel.send({
          content: `**Original Message:** ${message.id}\n**User:** ${message.author.tag} (${message.author.id})\n**Server:** ${message.guild.name}\n**Channel:** ${message.channel.name}\n**Date:** ${new Date().toISOString()}`,
          files: [{
            attachment: buffer,
            name: attachment.name
          }]
        });

        // Get the uploaded image URL and store with original filename
        if (uploadMessage.attachments.size > 0) {
          const uploadedAttachment = uploadMessage.attachments.first();
          uploadedUrls.push({
            url: uploadedAttachment.url,
            filename: attachment.name
          });
          logger.info(`Image uploaded to storage: ${uploadedAttachment.url}`);
        }

      } catch (error) {
        logger.error(`Failed to upload image ${attachment.name}:`, error.message);
      }
    }

    return uploadedUrls;

  } catch (error) {
    logger.error('Failed to access storage channel:', error);
    return [];
  }
}

module.exports = {
  uploadImages
};