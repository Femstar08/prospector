const BasePlatformAdapter = require('./base-adapter');
const IntentScorer = require('../scoring/intent-scorer');

/**
 * Reddit platform adapter
 * Uses Reddit's official API with OAuth authentication
 */
class RedditAdapter extends BasePlatformAdapter {
  constructor(config = {}) {
    super(config);
    this.platformName = 'reddit';
    this.baseUrl = 'https://www.reddit.com';
    this.oauthUrl = 'https://oauth.reddit.com';
    this.questionSeekingMode = config.questionSeekingMode !== false; // Default true
    this.intentScorer = new IntentScorer();
    
    // API credentials
    this.clientId = config.redditClientId;
    this.clientSecret = config.redditClientSecret;
    this.accessToken = null;
    this.tokenExpiry = null;
    
    // UK-focused subreddits for finance/property questions
    const defaultSubreddits = [
      'UKPersonalFinance',  // Main target - lots of questions!
      'UKProperty',
      'UKInvesting',
      'Accounting',
      'SmallBusiness',
      'Entrepreneur',
      'LegalAdviceUK',
      'AskUK',
      'HousingUK',
      'UKLandlords'
    ];
    
    // Clean subreddit names (remove r/ prefix if present)
    this.targetSubreddits = (config.targetSubreddits || defaultSubreddits).map(sub => 
      sub.startsWith('r/') ? sub.substring(2) : sub
    );
    
    // Rate limiting: Reddit API allows 100 requests per minute with OAuth
    this.requestDelay = 600; // 0.6 seconds between requests
    this.lastRequestTime = 0;
  }

  /**
   * Get OAuth access token
   */
  async getAccessToken() {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      console.log('[Reddit] No API credentials provided, falling back to public API');
      return null;
    }

    console.log('[Reddit] Getting OAuth access token...');

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ProspectMatcherUK/1.0.0 (by /u/prospectmatcher)'
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OAuth failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early
      
      console.log('[Reddit] OAuth token obtained successfully');
      return this.accessToken;
      
    } catch (error) {
      console.error('[Reddit] OAuth failed:', error.message);
      console.log('[Reddit] Falling back to public API');
      return null;
    }
  }

  /**
   * Rate limiting helper
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.requestDelay) {
      await new Promise(resolve => setTimeout(resolve, this.requestDelay - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Make authenticated API request
   */
  async makeApiRequest(url, useOAuth = true) {
    await this.rateLimit();

    let headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/html, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'DNT': '1'
    };

    // Try OAuth first if credentials are available
    if (useOAuth) {
      const token = await this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        // Use OAuth endpoint
        url = url.replace('https://www.reddit.com', this.oauthUrl);
      }
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      let errorText = '';
      
      // Check if response is HTML (error page) or JSON
      if (contentType.includes('text/html')) {
        errorText = `HTML error page (likely 403 Forbidden - Reddit blocking request)`;
      } else {
        errorText = await response.text();
      }
      
      throw new Error(`Reddit API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      if (text.includes('<html') || text.includes('<!DOCTYPE')) {
        throw new Error(`Reddit returned HTML instead of JSON (likely 403 Forbidden). Response preview: ${text.substring(0, 200)}`);
      }
    }

    return response.json();
  }

  /**
   * Validate Reddit URL
   */
  validateUrl(url) {
    return url.includes('reddit.com/user/') || url.includes('reddit.com/u/');
  }

  /**
   * Search for Reddit users asking questions
   */
  async search(keywords, countryFilter, maxResults) {
    const profiles = [];
    
    console.log(`[Reddit] Searching for: ${keywords.join(', ')} in ${countryFilter}`);
    console.log(`[Reddit] Question-seeking mode: ${this.questionSeekingMode ? 'enabled' : 'disabled'}`);
    console.log(`[Reddit] Target subreddits: ${this.targetSubreddits.join(', ')}`);
    
    try {
      if (this.questionSeekingMode) {
        // Find question posts in target subreddits
        const questionPosts = await this.findQuestionPosts(keywords, maxResults);
        console.log(`[Reddit] Found ${questionPosts.length} question posts`);
        
        // Extract unique authors
        const seenAuthors = new Set();
        const topQuestions = [];
        
        for (const post of questionPosts) {
          if (post.author && post.author !== '[deleted]' && !seenAuthors.has(post.author)) {
            seenAuthors.add(post.author);
            topQuestions.push(post);
            
            if (topQuestions.length >= maxResults) break;
          }
        }
        
        // Fetch user profiles for question askers
        for (const post of topQuestions) {
          try {
            const userProfile = await this.getUserProfile(post.author);
            
            if (userProfile) {
              // Add question metadata
              userProfile.question_text = post.title + (post.selftext ? '\n\n' + post.selftext : '');
              userProfile.question_source = 'reddit_post';
              userProfile.question_date = new Date(post.created_utc * 1000).toISOString();
              userProfile.question_quality_score = post.intentAnalysis.question_quality_score;
              userProfile.intent_score = post.intentAnalysis.intent_score;
              userProfile.decision_stage_score = post.intentAnalysis.decision_stage_score;
              userProfile.decision_stage = post.intentAnalysis.decision_stage;
              userProfile.help_seeking_score = post.intentAnalysis.help_seeking_score;
              userProfile.question_type = post.intentAnalysis.question_type;
              userProfile.subreddit = post.subreddit;
              userProfile.post_score = post.score;
              userProfile.comment_count = post.num_comments;
              
              profiles.push(userProfile);
            }
          } catch (error) {
            console.error(`[Reddit] Error fetching user ${post.author}:`, error.message);
          }
        }
        
        console.log(`[Reddit] Successfully extracted ${profiles.length} question asker profiles`);
      }
      
    } catch (error) {
      console.error(`[Reddit] Error searching:`, error.message);
    }
    
    return profiles;
  }

  /**
   * Find question posts in target subreddits
   * @param {string[]} keywords - Search keywords
   * @param {number} maxResults - Max posts to return
   * @returns {array} - Question posts with intent analysis
   */
  async findQuestionPosts(keywords, maxResults) {
    const allPosts = [];
    const searchQuery = keywords.join(' OR ');
    
    // Search each subreddit
    for (const subreddit of this.targetSubreddits) {
      try {
        await this.rateLimit();
        
        let posts = [];
        
        // Try search API first
        try {
          posts = await this.searchSubreddit(subreddit, searchQuery, 25);
          console.log(`[Reddit] Search API worked for r/${subreddit}: ${posts.length} posts`);
        } catch (searchError) {
          console.log(`[Reddit] Search failed for r/${subreddit} (${searchError.message}), trying direct feed...`);
          // Fallback: get recent posts from subreddit and filter by keywords
          try {
            posts = await this.getSubredditPosts(subreddit, 50);
            posts = this.filterPostsByKeywords(posts, keywords);
            console.log(`[Reddit] Fallback worked for r/${subreddit}: ${posts.length} posts after filtering`);
          } catch (fallbackError) {
            console.log(`[Reddit] Fallback also failed for r/${subreddit}: ${fallbackError.message}`);
            posts = []; // Continue with empty array
          }
        }
        
        allPosts.push(...posts);
        
        console.log(`[Reddit] r/${subreddit}: found ${posts.length} posts`);
        
      } catch (error) {
        console.error(`[Reddit] Error searching r/${subreddit}:`, error.message);
      }
    }
    
    // Filter for questions and score them
    const questionPosts = [];
    
    for (const post of allPosts) {
      const fullText = post.title + ' ' + (post.selftext || '');
      const intentAnalysis = this.intentScorer.scoreContent(fullText);
      
      // Only keep posts that are questions with some intent
      if (intentAnalysis.is_question && intentAnalysis.intent_score > 20) {
        questionPosts.push({
          ...post,
          intentAnalysis
        });
      }
    }
    
    // Sort by intent score (highest first)
    questionPosts.sort((a, b) => b.intentAnalysis.intent_score - a.intentAnalysis.intent_score);
    
    return questionPosts.slice(0, maxResults);
  }

  /**
   * Search a specific subreddit
   * @param {string} subreddit - Subreddit name
   * @param {string} query - Search query
   * @param {number} limit - Max results
   * @returns {array} - Posts
   */
  async searchSubreddit(subreddit, query, limit = 25) {
    // Try search endpoint first
    const searchUrl = `${this.baseUrl}/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=new&limit=${limit}`;
    
    console.log(`[Reddit] Searching r/${subreddit} with OAuth API...`);
    
    try {
      const data = await this.makeApiRequest(searchUrl, true);
      const posts = (data.data?.children || []).map(child => child.data);
      console.log(`[Reddit] OAuth API worked for r/${subreddit}: ${posts.length} posts`);
      return posts;
    } catch (error) {
      console.log(`[Reddit] OAuth search failed for r/${subreddit} (${error.message}), trying public API...`);
      
      // Fallback to public API without OAuth
      try {
        const data = await this.makeApiRequest(searchUrl, false);
        const posts = (data.data?.children || []).map(child => child.data);
        console.log(`[Reddit] Public API worked for r/${subreddit}: ${posts.length} posts`);
        return posts;
      } catch (fallbackError) {
        // If search fails, try getting recent posts and filtering client-side
        console.log(`[Reddit] Search API failed, trying recent posts fallback for r/${subreddit}...`);
        try {
          const recentUrl = `${this.baseUrl}/r/${subreddit}/new.json?limit=${Math.min(limit * 3, 100)}`;
          const data = await this.makeApiRequest(recentUrl, false);
          const allPosts = (data.data?.children || []).map(child => child.data);
          // Filter posts by keywords client-side
          const queryLower = query.toLowerCase();
          const keywords = query.split(' OR ').map(k => k.trim().toLowerCase());
          const filtered = allPosts.filter(post => {
            const text = (post.title + ' ' + (post.selftext || '')).toLowerCase();
            return keywords.some(keyword => text.includes(keyword));
          });
          console.log(`[Reddit] Recent posts fallback for r/${subreddit}: ${filtered.length} posts after filtering`);
          return filtered.slice(0, limit);
        } catch (recentError) {
          console.log(`[Reddit] All methods failed for r/${subreddit}: ${recentError.message}`);
          return []; // Return empty array instead of throwing
        }
      }
    }
  }

  /**
   * Get recent posts from a subreddit (fallback method)
   * @param {string} subreddit - Subreddit name
   * @param {number} limit - Max results
   * @returns {array} - Posts
   */
  async getSubredditPosts(subreddit, limit = 50) {
    const url = `${this.baseUrl}/r/${subreddit}/new.json?limit=${limit}`;
    
    try {
      const data = await this.makeApiRequest(url, true);
      return (data.data?.children || []).map(child => child.data);
    } catch (error) {
      console.log(`[Reddit] OAuth failed for r/${subreddit} posts, trying public API...`);
      try {
        const data = await this.makeApiRequest(url, false);
        return (data.data?.children || []).map(child => child.data);
      } catch (fallbackError) {
        console.log(`[Reddit] Failed to get posts for r/${subreddit}: ${fallbackError.message}`);
        return []; // Return empty array instead of throwing
      }
    }
  }

  /**
   * Filter posts by keywords (fallback method)
   * @param {array} posts - Posts to filter
   * @param {string[]} keywords - Keywords to match
   * @returns {array} - Filtered posts
   */
  filterPostsByKeywords(posts, keywords) {
    return posts.filter(post => {
      const text = (post.title + ' ' + (post.selftext || '')).toLowerCase();
      return keywords.some(keyword => text.includes(keyword.toLowerCase()));
    });
  }

  /**
   * Get user profile from Reddit
   * @param {string} username - Reddit username
   * @returns {object} - User profile
   */
  async getUserProfile(username) {
    const url = `${this.baseUrl}/user/${username}/about.json`;
    
    try {
      const data = await this.makeApiRequest(url, true);
      
      if (data.data) {
        return this.transformUserToProfile(data.data);
      }
      
    } catch (error) {
      console.log(`[Reddit] OAuth failed for user ${username}, trying public API...`);
      
      try {
        const data = await this.makeApiRequest(url, false);
        
        if (data.data) {
          return this.transformUserToProfile(data.data);
        }
        
      } catch (fallbackError) {
        console.error(`[Reddit] Error fetching user ${username}:`, fallbackError.message);
      }
    }
    
    return null;
  }

  /**
   * Transform Reddit user data to our profile format
   * @param {object} user - Reddit user object
   * @returns {object} - Profile
   */
  transformUserToProfile(user) {
    const profile = this.createEmptyProfile();
    
    profile.profile_url = `https://www.reddit.com/user/${user.name}`;
    profile.username_or_handle = user.name;
    profile.display_name = user.name;
    profile.bio = user.subreddit?.public_description || '';
    profile.location = ''; // Reddit doesn't expose location
    profile.follower_count = user.subreddit?.subscribers || 0;
    profile.following_count = 0; // Reddit doesn't expose this
    profile.post_count = user.link_karma + user.comment_karma; // Use karma as proxy
    profile.profile_image_url = user.icon_img || user.snoovatar_img || '';
    profile.verified = user.verified || false;
    
    // Account age (in days)
    const accountAge = Math.floor((Date.now() - user.created_utc * 1000) / (1000 * 60 * 60 * 24));
    profile.account_age_days = accountAge;
    
    return profile;
  }

  /**
   * Extract user profile from Reddit URL
   */
  async extractProfile(url) {
    const profile = this.createEmptyProfile();
    profile.profile_url = url;
    
    try {
      // Extract username from URL
      const usernameMatch = url.match(/reddit\.com\/(?:user|u)\/([^\/\?]+)/);
      if (!usernameMatch) {
        console.log(`[Reddit] Could not extract username from URL: ${url}`);
        return profile;
      }
      
      const username = usernameMatch[1];
      console.log(`[Reddit] Extracting user: ${username}`);
      
      // Get user profile
      const userProfile = await this.getUserProfile(username);
      
      if (userProfile) {
        return userProfile;
      }
      
    } catch (error) {
      console.error(`[Reddit] Error extracting profile ${url}:`, error.message);
    }
    
    return profile;
  }
}

module.exports = RedditAdapter;
