const { PermissionFlagsBits } = require('discord.js');
const config = require('../../core/config');
const logger = require('../../core/logger');

module.exports = {
  name: 'excluderole',
  description: 'Add or remove roles excluded from image scanning',
  async execute(message, args) {
    // Check if user has admin permissions
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission to use this command.');
    }

    // Show current excluded roles if no args
    if (args.length === 0) {
      const currentConfig = config.getImageScannerConfig(message.guild.id);
      if (currentConfig.excludedRoles.length === 0) {
        return message.reply('⚙️ No excluded roles configured.\n\nUsage: `>s image excluderole <@role|roleID>` to add\n`>s image excluderole remove <@role|roleID>` to remove');
      }
      
      const roleList = currentConfig.excludedRoles
        .map(roleId => `<@&${roleId}>`)
        .join(', ');
      return message.reply(`⚙️ **Excluded roles:**\n${roleList}\n\nTo add: \`>s image excluderole <@role>\`\nTo remove: \`>s image excluderole remove <@role>\``);
    }

    // Check if it's a remove operation
    const isRemove = args[0].toLowerCase() === 'remove';
    if (isRemove) {
      args.shift(); // Remove 'remove' from args
    }

    // Get role from mention or ID
    let role = message.mentions.roles.first();
    
    if (!role && args[0]) {
      // Try to get role by ID
      role = message.guild.roles.cache.get(args[0]);
    }

    if (!role) {
      return message.reply('❌ Please mention a valid role or provide a role ID.\nUsage: `>s image excluderole <@role>` or `>s image excluderole <roleID>`');
    }

    if (isRemove) {
      config.removeExcludedRole(message.guild.id, role.id);
      logger.info(`Removed excluded role ${role.name} in ${message.guild.name}`);
      return message.reply(`✅ Removed ${role} from excluded roles. Users with this role will now be affected by image scanning.`);
    } else {
      config.addExcludedRole(message.guild.id, role.id);
      logger.info(`Added excluded role ${role.name} in ${message.guild.name}`);
      return message.reply(`✅ Added ${role} to excluded roles. Users with this role will not be timed out, but events will still be logged.`);
    }
  }
};