let chalk;

// Dynamically import chalk
(async () => {
  chalk = (await import('chalk')).default;
})();

const logger = {
  info: (message) => {
    if (chalk) {
      console.log(chalk.blue('[INFO]'), new Date().toISOString(), message);
    } else {
      console.log('[INFO]', new Date().toISOString(), message);
    }
  },
  
  warn: (message) => {
    if (chalk) {
      console.log(chalk.yellow('[WARN]'), new Date().toISOString(), message);
    } else {
      console.log('[WARN]', new Date().toISOString(), message);
    }
  },
  
  error: (message, error) => {
    if (chalk) {
      console.log(chalk.red('[ERROR]'), new Date().toISOString(), message);
    } else {
      console.log('[ERROR]', new Date().toISOString(), message);
    }
    if (error) console.error(error);
  },
  
  success: (message) => {
    if (chalk) {
      console.log(chalk.green('[SUCCESS]'), new Date().toISOString(), message);
    } else {
      console.log('[SUCCESS]', new Date().toISOString(), message);
    }
  }
};

module.exports = logger;