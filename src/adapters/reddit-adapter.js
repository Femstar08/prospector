const BasePlatformAdapter = require('./base-adapter');

/**
 * Reddit platform adapter
 */
class RedditAdapter extends BasePlatformAdapter {
  constructor(config = {}) {
    super(config);
    this.platformName = 'reddit';
    this.baseUrl = 'https://www.reddit.com';
  }

  /**
   * Validate Reddit URL
   */
  validateUrl(url) {
    return url.includes('reddit.com/user/') || url.includes('reddit.com/u/');
  }

  /**
   * Search for Reddit users
   */
  async search(keywords, countryFilter, maxResults) {
    const profiles = [];
    const searchQuery = keywords.join(' ');
    
    console.log(`[Reddit] Searching for: ${searchQuery} in ${countryFilter}`);
    
    try {
      // Reddit API allows public access without authentication
      // Search in relevant subreddits for posts/comments
      // Extract unique authors from results
      
      // Relevant subreddits for UK entrepreneurs:
      const subreddits = [
        'UKPersonalFinance',
        'UKEntrepreneur', 
        'startups',
        'Entrepreneur',
        'SaaS',
        'smallbusiness'
      ];
      
      console.log(`[Reddit] Searching in subreddits: ${subreddits.join(', ')}`);
      
      // In production, would use Reddit API:
      // GET /r/{subreddit}/search.json?q={query}&restrict_sr=1
      
    } catch (error) {
      console.error(`[Reddit] Error searching:`, error.message);
    }
    
    return profiles;
  }

  /**
   * Extract user profile from Reddit
   */
  async extractProfile(url) {
    const profile = this.createEmptyProfile();
    profile.profile_url = url;
    
    try {
      // Extract username from URL
      const usernameMatch = url.match(/reddit\.com\/(?:user|u)\/([^\/\?]+)/);
      if (usernameMatch) {
        profile.username_or_handle = usernameMatch[1];
      }
      
      console.log(`[Reddit] Extracting user: ${url}`);
      
      // Reddit API allows public access
      // GET /user/{username}/about.json
      // GET /user/{username}/submitted.json (for recent posts)
      
      // In production, would fetch user data and recent posts
      
    } catch (error) {
      console.error(`[Reddit] Error extracting profile ${url}:`, error.message);
    }
    
    return profile;
  }
}

module.exports = RedditAdapter;
