const fs = require('fs');
const path = require('path');

class Config {
  constructor() {
    this.settingsPath = path.join(__dirname, '../../config/settings.json');
    this.settings = this.loadSettings();
  }

  loadSettings() {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const loaded = JSON.parse(fs.readFileSync(this.settingsPath, 'utf8'));
        // Ensure all required properties exist
        return {
          prefix: loaded.prefix || '>s',
          logChannels: loaded.logChannels || {},
          imageScanner: loaded.imageScanner || {}
        };
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
    
    // Default settings
    return {
      prefix: '>s',
      logChannels: {}, // { guildId: channelId }
      imageScanner: {} // { guildId: { timeout, threshold, excludedRoles } }
    };
  }

  saveSettings() {
    try {
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  }

  setLogChannel(guildId, channelId) {
    this.settings.logChannels[guildId] = channelId;
    this.saveSettings();
  }

  getLogChannel(guildId) {
    return this.settings.logChannels[guildId];
  }

  getPrefix() {
    return this.settings.prefix;
  }

  // Image scanner configuration
  getImageScannerConfig(guildId) {
    // Ensure imageScanner object exists
    if (!this.settings.imageScanner) {
      this.settings.imageScanner = {};
    }
    
    if (!this.settings.imageScanner[guildId]) {
      this.settings.imageScanner[guildId] = {
        timeout: 60 * 60 * 1000, // Default: 1 hour
        threshold: 4, // Default: exactly 4 images
        thresholdType: 'exact', // 'exact' or 'greater'
        excludedRoles: []
      };
    }
    return this.settings.imageScanner[guildId];
  }

  setImageTimeout(guildId, duration) {
    const config = this.getImageScannerConfig(guildId);
    config.timeout = duration;
    this.saveSettings();
  }

  setImageThreshold(guildId, threshold, type = 'exact') {
    const config = this.getImageScannerConfig(guildId);
    config.threshold = threshold;
    config.thresholdType = type;
    this.saveSettings();
  }

  addExcludedRole(guildId, roleId) {
    const config = this.getImageScannerConfig(guildId);
    if (!config.excludedRoles.includes(roleId)) {
      config.excludedRoles.push(roleId);
      this.saveSettings();
    }
  }

  removeExcludedRole(guildId, roleId) {
    const config = this.getImageScannerConfig(guildId);
    const index = config.excludedRoles.indexOf(roleId);
    if (index > -1) {
      config.excludedRoles.splice(index, 1);
      this.saveSettings();
    }
  }
}

module.exports = new Config();