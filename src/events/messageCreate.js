const config = require('../core/config');
const imageScanner = require('../modules/scanner/imageScanner');
const logger = require('../core/logger');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    // Ignore bots
    if (message.author.bot) return;

    // Check for commands
    const prefix = config.getPrefix();
    if (message.content.startsWith(prefix)) {
      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      // Check for subcommands (e.g., >s image threshold)
      let command = client.commands.get(commandName);
      
      // If first command is "image", check for image subcommands
      if (commandName === 'image' && args.length > 0) {
        const subCommandName = args.shift().toLowerCase();
        command = client.commands.get(subCommandName);
      }
      
      if (!command) return;

      try {
        await command.execute(message, args);
      } catch (error) {
        logger.error('Error executing command:', error);
        message.reply('There was an error executing that command.');
      }
      return;
    }

    // Scan for suspicious image-only messages
    await imageScanner.scanMessage(message);
  }
};