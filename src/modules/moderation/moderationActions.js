const logger = require('../../core/logger');

/**
 * Calculate timeout duration in a human-readable format
 * @param {number} timeoutDuration - Timeout duration in milliseconds
 * @returns {string} Formatted timeout text
 */
function formatTimeoutDuration(timeoutDuration) {
  const timeoutDays = Math.floor(timeoutDuration / (24 * 60 * 60 * 1000));
  const timeoutHours = Math.floor((timeoutDuration % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  let timeoutText = '';
  if (timeoutDays > 0) {
    timeoutText = `${timeoutDays} day${timeoutDays !== 1 ? 's' : ''}`;
    if (timeoutHours > 0) {
      timeoutText += ` and ${timeoutHours} hour${timeoutHours !== 1 ? 's' : ''}`;
    }
  } else if (timeoutHours > 0) {
    timeoutText = `${timeoutHours} hour${timeoutHours !== 1 ? 's' : ''}`;
  } else {
    const timeoutMinutes = Math.floor(timeoutDuration / (60 * 1000));
    timeoutText = `${timeoutMinutes} minute${timeoutMinutes !== 1 ? 's' : ''}`;
  }
  
  return timeoutText;
}

/**
 * Timeout a member
 * @param {GuildMember} member - Guild member to timeout
 * @param {number} duration - Duration in milliseconds
 * @param {string} reason - Reason for timeout
 * @returns {Promise<boolean>} Success status
 */
async function timeoutMember(member, duration, reason) {
  try {
    await member.timeout(duration, reason);
    const timeoutText = formatTimeoutDuration(duration);
    logger.info(`Timed out user: ${member.user.tag} for ${timeoutText}`);
    return true;
  } catch (error) {
    logger.error(`Failed to timeout member ${member.user.tag}:`, error);
    return false;
  }
}

/**
 * Ban a member
 * @param {Guild} guild - Guild object
 * @param {string} userId - User ID to ban
 * @param {string} reason - Reason for ban
 * @returns {Promise<boolean>} Success status
 */
async function banMember(guild, userId, reason) {
  try {
    await guild.members.ban(userId, { reason });
    logger.info(`Banned user: ${userId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to ban member ${userId}:`, error);
    return false;
  }
}

/**
 * Delete a message
 * @param {Message} message - Message to delete
 * @returns {Promise<boolean>} Success status
 */
async function deleteMessage(message) {
  try {
    await message.delete();
    logger.info('Message deleted successfully');
    return true;
  } catch (error) {
    logger.error('Failed to delete message:', error);
    return false;
  }
}

module.exports = {
  formatTimeoutDuration,
  timeoutMember,
  banMember,
  deleteMessage
};