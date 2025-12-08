const BasePlatformAdapter = require('./base-adapter');
const IntentScorer = require('../scoring/intent-scorer');

/**
 * X/Twitter platform adapter
 */
class XAdapter extends BasePlatformAdapter {
  constructor(config = {}) {
    super(config);
    this.platformName = 'x';
    this.bearerToken = config.twitterBearerToken || process.env.TWITTER_BEARER_TOKEN;
    this.questionSeekingMode = config.questionSeekingMode !== false; // Default true
    this.intentScorer = new IntentScorer();
  }

  /**
   * Build question-focused search query
   * @param {string[]} keywords - Base keywords
   * @returns {string} - Enhanced query with question patterns
   */
  buildQuestionQuery(keywords) {
    const questionPatterns = [
      '"how do I"',
      '"how to"',
      '"need help with"',
      '"can anyone recommend"',
      '"advice on"',
      '"looking for"',
      '"should I"',
      '"what\'s the best way to"'
    ];
    
    // Combine keywords with question patterns
    const keywordQuery = keywords.join(' OR ');
    const questionQuery = questionPatterns.slice(0, 3).join(' OR '); // Use top 3 to stay within query limits
    
    return `(${questionQuery}) (${keywordQuery})`;
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
    
    // Build query based on mode
    const searchQuery = this.questionSeekingMode 
      ? this.buildQuestionQuery(keywords)
      : keywords.join(' OR ');
    
    console.log(`[X] Searching for: ${searchQuery} in ${countryFilter}`);
    console.log(`[X] Question-seeking mode: ${this.questionSeekingMode ? 'enabled' : 'disabled'}`);
    console.log(`[X] Bearer token status: ${this.bearerToken ? 'configured' : 'not configured'}`);
    
    if (!this.bearerToken) {
      console.log(`[X] Note: Twitter API bearer token not configured - skipping search`);
      return profiles;
    }
    
    try {
      // Twitter API v2: Search recent tweets, then extract unique users
      const searchUrl = new URL('https://api.twitter.com/2/tweets/search/recent');
      searchUrl.searchParams.set('query', `${searchQuery} ? -is:retweet`); // Add ? to find questions
      searchUrl.searchParams.set('max_results', Math.min(maxResults * 2, 100));
      searchUrl.searchParams.set('tweet.fields', 'author_id,created_at,public_metrics,text');
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
      console.log(`[X] Found ${data.data?.length || 0} tweets`);
      console.log(`[X] Found ${data.includes?.users?.length || 0} unique users from tweets`);
      
      if (!data.includes?.users || data.includes.users.length === 0) {
        return profiles;
      }
      
      // Create a map of tweets by author for question extraction
      const tweetsByAuthor = new Map();
      if (data.data) {
        for (const tweet of data.data) {
          if (!tweetsByAuthor.has(tweet.author_id)) {
            tweetsByAuthor.set(tweet.author_id, []);
          }
          tweetsByAuthor.get(tweet.author_id).push(tweet);
        }
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
      
      // Transform to our profile format with question analysis
      for (const user of users.slice(0, maxResults)) {
        const userTweets = tweetsByAuthor.get(user.id) || [];
        const profile = this.transformUserToProfile(user, userTweets);
        profiles.push(profile);
      }
      
      console.log(`[X] Successfully extracted ${profiles.length} user profiles`);
      
      // Log question stats if in question-seeking mode
      if (this.questionSeekingMode) {
        const questionsFound = profiles.filter(p => p.question_text).length;
        console.log(`[X] Found ${questionsFound} profiles with questions`);
      }
      
    } catch (error) {
      console.error(`[X] Error searching:`, error.message);
    }
    
    return profiles;
  }

  /**
   * Transform Twitter user data to our profile format
   * @param {object} user - Twitter user object
   * @param {array} tweets - User's tweets (optional, for question extraction)
   */
  transformUserToProfile(user, tweets = []) {
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
    
    // Extract question from tweets if in question-seeking mode
    if (this.questionSeekingMode && tweets.length > 0) {
      // Find the best question tweet
      let bestQuestion = null;
      let bestScore = 0;
      
      for (const tweet of tweets) {
        const intentAnalysis = this.intentScorer.scoreContent(tweet.text);
        
        if (intentAnalysis.is_question && intentAnalysis.intent_score > bestScore) {
          bestQuestion = tweet;
          bestScore = intentAnalysis.intent_score;
        }
      }
      
      if (bestQuestion) {
        const intentAnalysis = this.intentScorer.scoreContent(bestQuestion.text);
        
        profile.question_text = bestQuestion.text;
        profile.question_source = 'twitter';
        profile.question_date = bestQuestion.created_at;
        profile.question_quality_score = intentAnalysis.question_quality_score;
        profile.intent_score = intentAnalysis.intent_score;
        profile.decision_stage_score = intentAnalysis.decision_stage_score;
        profile.decision_stage = intentAnalysis.decision_stage;
        profile.help_seeking_score = intentAnalysis.help_seeking_score;
        profile.question_type = intentAnalysis.question_type;
        
        // Store the tweet as last content sample
        profile.last_content_sample = bestQuestion.text;
        profile.last_content_date = bestQuestion.created_at;
      }
    }
    
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
