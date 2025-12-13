const BasePlatformAdapter = require('./base-adapter');

/**
 * Factory for creating platform-specific adapters
 */
class AdapterFactory {
  constructor(config = {}) {
    this.adapters = new Map();
    this.supportedPlatforms = ['linkedin', 'x', 'youtube', 'reddit', 'medium', 'web', 'quora'];
    this.config = config; // Store API credentials
  }

  /**
   * Get an adapter for a specific platform
   * @param {string} platform - Platform identifier
   * @param {object} config - Configuration for the adapter
   * @returns {BasePlatformAdapter}
   */
  getAdapter(platform, config = {}) {
    const platformLower = platform.toLowerCase();
    
    if (!this.supportedPlatforms.includes(platformLower)) {
      throw new Error(`Unsupported platform: ${platform}. Supported platforms: ${this.supportedPlatforms.join(', ')}`);
    }

    // Lazy load adapters
    if (!this.adapters.has(platformLower)) {
      let AdapterClass;
      
      try {
        switch (platformLower) {
          case 'linkedin':
            AdapterClass = require('./linkedin-adapter');
            break;
          case 'x':
            AdapterClass = require('./x-adapter');
            break;
          case 'youtube':
            AdapterClass = require('./youtube-adapter');
            break;
          case 'reddit':
            AdapterClass = require('./reddit-adapter');
            break;
          case 'medium':
            AdapterClass = require('./medium-adapter');
            break;
          case 'web':
            AdapterClass = require('./web-adapter');
            break;
          case 'quora':
            AdapterClass = require('./quora-adapter');
            break;
          default:
            throw new Error(`No adapter implementation for platform: ${platform}`);
        }
        
        // Merge factory config with adapter-specific config
        const adapterConfig = { ...this.config, ...config };
        this.adapters.set(platformLower, new AdapterClass(adapterConfig));
      } catch (error) {
        throw new Error(`Failed to load adapter for ${platform}: ${error.message}`);
      }
    }

    return this.adapters.get(platformLower);
  }

  /**
   * Get list of supported platforms
   * @returns {string[]}
   */
  getSupportedPlatforms() {
    return [...this.supportedPlatforms];
  }

  /**
   * Check if a platform is supported
   * @param {string} platform - Platform to check
   * @returns {boolean}
   */
  isPlatformSupported(platform) {
    return this.supportedPlatforms.includes(platform.toLowerCase());
  }
}

module.exports = AdapterFactory;
