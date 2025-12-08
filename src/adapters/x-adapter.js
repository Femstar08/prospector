const BasePlatformAdapter = require('./base-adapter');

/**
 * X/Twitter platform adapter
 */
class XAdapter extends BasePlatformAdapter {
  constructor(config = {}) {
    super(config);
    this.platformName = 'x';
    this.bearerToken = config.twitterBearerToken || process.env.TWITTER_BEARER_TOKEN;
  }

  /**
   * Validate X/Twitter URL
   */
  validateUrl(url) {
    return url.includes('twitter.com/') || url.includes('x.com/');
  }

  /**
   * Search for X/Twitter profiles
   */
  async search(keywords, countryFilter, maxResults) {
    const profiles = [];
    const searchQuery = keywords.join(' OR ');
    
    console.log(`[X] Searching for: ${searchQuery} in ${countryFilter}`);
    console.log(`[X] Bearer token status: ${this.bearerToken ? 'configured' : 'not configured'}`);
    
    if (!this.bearerToken) {
      console.log(`[X] Note: Twitter API bearer token not configured - skipping search`);
      return profiles;
    }
    
    try {
      // Twitter API v2: Search recent tweets, then extract unique users
      // Note: There's no direct "user search" in v2 API, so we search tweets and extract users
      const searchUrl = new URL('https://api.twitter.com/2/tweets/search/recent');
      searchUrl.searchParams.set('query', `${searchQuery} -is:retweet`);
      searchUrl.searchParams.set('max_results', Math.min(maxResults * 2, 100)); // Get more tweets to find unique users
      searchUrl.searchParams.set('tweet.fields', 'author_id,created_at,public_metrics');
      searchUrl.searchParams.set('expansions', 'author_id');
      searchUrl.searchParams.set('user.fields', 'id,name,username,description,location,public_metrics,profile_image_url,verified');
      
      console.log(`[X] Calling Twitter API v2...`);
      const response = await fetch(searchUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'User-Agent': 'ProspectMatcherUK/1.0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Twitter API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`[X] Found ${data.includes?.users?.length || 0} unique users from tweets`);
      
      if (!data.includes?.users || data.includes.users.length === 0) {
        return profiles;
      }
      
      // Filter by country if specified
      let users = data.includes.users;
      if (countryFilter && countryFilter.toLowerCase() !== 'all') {
        users = users.filter(user => {
          if (!user.location) return false;
          return user.location.toLowerCase().includes(countryFilter.toLowerCase());
        });
        console.log(`[X] After country filter: ${users.length} users`);
      }
      
      // Transform to our profile format
      for (const user of users.slice(0, maxResults)) {
        const profile = this.transformUserToProfile(user);
        profiles.push(profile);
      }
      
      console.log(`[X] Successfully extracted ${profiles.length} user profiles`);
      
    } catch (error) {
      console.error(`[X] Error searching:`, error.message);
    }
    
    return profiles;
  }

  /**
   * Transform Twitter user data to our profile format
   */
  transformUserToProfile(user) {
    const profile = this.createEmptyProfile();
    
    profile.profile_url = `https://twitter.com/${user.username}`;
    profile.username_or_handle = user.username;
    profile.display_name = user.name;
    profile.bio = user.description || '';
    profile.location = user.location || '';
    profile.follower_count = user.public_metrics?.followers_count || 0;
    profile.following_count = user.public_metrics?.following_count || 0;
    profile.post_count = user.public_metrics?.tweet_count || 0;
    profile.profile_image_url = user.profile_image_url || '';
    profile.verified = user.verified || false;
    
    return profile;
  }

  /**
   * Extract profile from X/Twitter URL
   */
  async extractProfile(url) {
    const profile = this.createEmptyProfile();
    profile.profile_url = url;
    
    try {
      // Extract username from URL
      const usernameMatch = url.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/);
      if (!usernameMatch) {
        console.log(`[X] Could not extract username from URL: ${url}`);
        return profile;
      }
      
      const username = usernameMatch[1];
      profile.username_or_handle = username;
      
      console.log(`[X] Extracting profile: ${username}`);
      
      if (!this.bearerToken) {
        console.log(`[X] Note: Twitter API bearer token not configured`);
        return profile;
      }
      
      // Twitter API v2: Get user by username
      const userUrl = new URL(`https://api.twitter.com/2/users/by/username/${username}`);
      userUrl.searchParams.set('user.fields', 'id,name,username,description,location,public_metrics,profile_image_url,verified,created_at');
      
      const response = await fetch(userUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'User-Agent': 'ProspectMatcherUK/1.0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Twitter API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.data) {
        return this.transformUserToProfile(data.data);
      } else {
        console.log(`[X] No user found for username: ${username}`);
      }
      
    } catch (error) {
      console.error(`[X] Error extracting profile ${url}:`, error.message);
    }
    
    return profile;
  }
}

module.exports = XAdapter;
