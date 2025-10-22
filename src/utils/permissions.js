const { PermissionFlagsBits } = require('discord.js');

function hasAdminPermission(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

function hasBanPermission(member) {
  return member.permissions.has(PermissionFlagsBits.BanMembers);
}

module.exports = {
  hasAdminPermission,
  hasBanPermission
};