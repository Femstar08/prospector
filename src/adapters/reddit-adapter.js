const BasePlatformAdapter = require('./base-adapter');
const IntentScorer = require('../scoring/intent-scorer');

/**
 * Reddit platform adapter
 * Uses Reddit's public JSON API (no authentication required)
 */
class RedditAdapter extends BasePlatformAdapter {
  constructor(config = {}) {
    super(config);
    this.platformName = 'reddit';
    this.baseUrl = 'https://www.reddit.com';
    this.questionSeekingMode = config.questionSeekingMode !== false; // Default true
    this.intentScorer = new IntentScorer();
    
    // UK-focused subreddits for finance/property questions
    this.targetSubreddits = config.targetSubreddits || [
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
    
    // Rate limiting: Reddit allows 60 requests per minute
    this.requestDelay = 1000; // 1 second between requests
    this.lastRequestTime = 0;
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
        
        const posts = await this.searchSubreddit(subreddit, searchQuery, 25); // Get 25 per subreddit
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
    const url = `${this.baseUrl}/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=new&limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ProspectMatcherUK/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return (data.data?.children || []).map(child => child.data);
  }

  /**
   * Get user profile from Reddit
   * @param {string} username - Reddit username
   * @returns {object} - User profile
   */
  async getUserProfile(username) {
    await this.rateLimit();
    
    const url = `${this.baseUrl}/user/${username}/about.json`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ProspectMatcherUK/1.0'
        }
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      if (data.data) {
        return this.transformUserToProfile(data.data);
      }
      
    } catch (error) {
      console.error(`[Reddit] Error fetching user ${username}:`, error.message);
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
