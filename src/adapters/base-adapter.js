const RetryHelper = require('../utils/retry');

/**
 * Base adapter interface that all platform adapters must implement
 */
class BasePlatformAdapter {
  constructor(config = {}) {
    this.config = config;
    this.platformName = 'base';
    this.retryHelper = RetryHelper;
  }

  /**
   * Search for profiles on the platform
   * @param {string[]} keywords - Keywords to search for
   * @param {string} countryFilter - Country to filter by
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<RawProfile[]>}
   */
  async search(keywords, countryFilter, maxResults) {
    throw new Error('search() must be implemented by subclass');
  }

  /**
   * Extract a single profile from a URL
   * @param {string} url - Profile URL
   * @returns {Promise<RawProfile>}
   */
  async extractProfile(url) {
    throw new Error('extractProfile() must be implemented by subclass');
  }

  /**
   * Validate if a URL belongs to this platform
   * @param {string} url - URL to validate
   * @returns {boolean}
   */
  validateUrl(url) {
    throw new Error('validateUrl() must be implemented by subclass');
  }

  /**
   * Normalize location string to extract country
   * @param {string} location - Raw location string
   * @returns {string} - Normalized country name
   */
  normalizeLocation(location) {
    if (!location) return '';
    
    const locationLower = location.toLowerCase();
    
    // UK variations
    if (locationLower.includes('united kingdom') || 
        locationLower.includes('uk') || 
        locationLower.includes('england') || 
        locationLower.includes('scotland') || 
        locationLower.includes('wales') || 
        locationLower.includes('northern ireland') ||
        locationLower.includes('london') ||
        locationLower.includes('manchester') ||
        locationLower.includes('birmingham') ||
        locationLower.includes('edinburgh') ||
        locationLower.includes('glasgow')) {
      return 'United Kingdom';
    }
    
    // Add more country mappings as needed
    if (locationLower.includes('united states') || locationLower.includes('usa') || locationLower.includes('us')) {
      return 'United States';
    }
    
    if (locationLower.includes('canada')) {
      return 'Canada';
    }
    
    if (locationLower.includes('australia')) {
      return 'Australia';
    }
    
    if (locationLower.includes('germany')) {
      return 'Germany';
    }
    
    if (locationLower.includes('france')) {
      return 'France';
    }
    
    // Return original if no match
    return location;
  }

  /**
   * Validate a raw profile object
   * @param {RawProfile} profile - Profile to validate
   * @returns {boolean}
   */
  validateProfile(profile) {
    const requiredFields = [
      'name',
      'platform',
      'profile_url',
      'username_or_handle',
      'location',
      'headline_or_title',
      'bio'
    ];
    
    for (const field of requiredFields) {
      if (profile[field] === undefined) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Create an empty raw profile template
   * @returns {RawProfile}
   */
  createEmptyProfile() {
    return {
      name: '',
      platform: this.platformName,
      profile_url: '',
      username_or_handle: '',
      location: '',
      headline_or_title: '',
      bio: '',
      company: '',
      company_size_hint: '',
      followers_or_subscribers: 0,
      last_content_sample: '',
      last_content_date: ''
    };
  }
}

module.exports = BasePlatformAdapter;
