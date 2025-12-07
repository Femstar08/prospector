const BasePlatformAdapter = require('./base-adapter');
const { CheerioCrawler } = require('crawlee');

/**
 * Medium platform adapter
 */
class MediumAdapter extends BasePlatformAdapter {
  constructor(config = {}) {
    super(config);
    this.platformName = 'medium';
    this.baseUrl = 'https://medium.com';
  }

  /**
   * Validate Medium URL
   */
  validateUrl(url) {
    return url.includes('medium.com/@') || url.includes('medium.com/');
  }

  /**
   * Search for Medium authors
   */
  async search(keywords, countryFilter, maxResults) {
    const profiles = [];
    const searchQuery = keywords.join(' ');
    
    console.log(`[Medium] Searching for: ${searchQuery} in ${countryFilter}`);
    
    try {
      // Medium doesn't have a public API
      // Would need to scrape search results or use tags
      
      // Search by tags related to keywords
      // https://medium.com/tag/{tag}
      
      console.log(`[Medium] Note: Medium requires web scraping (no public API)`);
      
    } catch (error) {
      console.error(`[Medium] Error searching:`, error.message);
    }
    
    return profiles;
  }

  /**
   * Extract author profile from Medium
   */
  async extractProfile(url) {
    const profile = this.createEmptyProfile();
    profile.profile_url = url;
    
    try {
      // Extract username from URL
      const usernameMatch = url.match(/medium\.com\/@([^\/\?]+)/);
      if (usernameMatch) {
        profile.username_or_handle = usernameMatch[1];
      }
      
      console.log(`[Medium] Extracting author: ${url}`);
      
      // In production, would scrape Medium profile page
      // Extract: name, bio, follower count, recent articles
      
    } catch (error) {
      console.error(`[Medium] Error extracting profile ${url}:`, error.message);
    }
    
    return profile;
  }
}

module.exports = MediumAdapter;
