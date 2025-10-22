const logger = require('../../core/logger');

/**
 * Collect recent messages from the same user in the channel
 * @param {Message} message - Discord message
 * @param {number} limit - Number of messages to fetch
 * @param {number} timeWindowMinutes - Time window in minutes
 * @returns {Promise<Array>} Array of messages from the same user
 */
async function collectUserMessages(message, limit = 10, timeWindowMinutes = 5) {
  try {
    const messages = await message.channel.messages.fetch({ limit: 50 });
    
    // Filter messages from the same user within the time window
    const timeWindowMs = timeWindowMinutes * 60 * 1000;
    const cutoffTime = Date.now() - timeWindowMs;
    
    const userMessages = messages
      .filter(msg => 
        msg.author.id === message.author.id && 
        msg.createdTimestamp > cutoffTime
      )
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      .first(limit);
    
    return Array.from(userMessages.values());
  } catch (error) {
    logger.error('Error collecting user messages:', error);
    return [message];
  }
}

/**
 * Count messages with no text content
 * @param {Array<Message>} messages - Array of messages
 * @returns {number} Count of empty messages
 */
function countEmptyMessages(messages) {
  return messages.filter(m => !m.content || m.content.trim() === '').length;
}

/**
 * Analyze message patterns for suspicious behavior
 * @param {Array<Message>} messages - Array of messages
 * @returns {Object} Analysis results
 */
function analyzeMessagePattern(messages) {
  const emptyCount = countEmptyMessages(messages);
  const totalImages = messages.reduce((sum, msg) => sum + msg.attachments.size, 0);
  const avgImagesPerMessage = totalImages / messages.length;

  return {
    totalMessages: messages.length,
    emptyMessages: emptyCount,
    emptyMessageRatio: emptyCount / messages.length,
    totalImages: totalImages,
    avgImagesPerMessage: avgImagesPerMessage,
    isPotentialScam: emptyCount > 0 && totalImages > 0
  };
}

module.exports = {
  collectUserMessages,
  countEmptyMessages,
  analyzeMessagePattern
};