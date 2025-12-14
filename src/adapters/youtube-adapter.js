const BasePlatformAdapter = require('./base-adapter');
const IntentScorer = require('../scoring/intent-scorer');

/**
 * YouTube platform adapter
 */
class YouTubeAdapter extends BasePlatformAdapter {
  constructor(config = {}) {
    super(config);
    this.platformName = 'youtube';
    this.apiKey = config.youtubeApiKey || process.env.YOUTUBE_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
    this.questionSeekingMode = config.questionSeekingMode !== false; // Default true
    this.includeComments = config.includeComments !== false; // Default true
    this.intentScorer = new IntentScorer();
    
    // UK finance/property channels to analyze for comments
    this.targetChannels = [
      'UCvTe2COJVj8jEZvkaJ_g3Sg', // Example: Property investment channel
      // Add more channel IDs as discovered
    ];
  }

  /**
   * Validate YouTube URL
   */
  validateUrl(url) {
    return url.includes('youtube.com/') || url.includes('youtu.be/');
  }

  /**
   * Search for YouTube channels
   */
  async search(keywords, countryFilter, maxResults) {
    const profiles = [];
    const searchQuery = keywords.join(' ');
    
    console.log(`[YouTube] Searching for: ${searchQuery} in ${countryFilter}`);
    console.log(`[YouTube] Question-seeking mode: ${this.questionSeekingMode ? 'enabled' : 'disabled'}`);
    console.log(`[YouTube] Include comments: ${this.includeComments ? 'yes' : 'no'}`);
    console.log(`[YouTube] API key status: ${this.apiKey ? 'configured' : 'not configured'}`);
    
    if (!this.apiKey) {
      console.log(`[YouTube] Note: YouTube API key not configured - skipping search`);
      return profiles;
    }
    
    try {
      // If in question-seeking mode with comments enabled, find question askers
      if (this.questionSeekingMode && this.includeComments) {
        const questionAskers = await this.findQuestionAskers(keywords, countryFilter, maxResults);
        profiles.push(...questionAskers);
        
        if (profiles.length >= maxResults) {
          return profiles.slice(0, maxResults);
        }
      }
      
      // Also search for channels (content creators)
      const remainingResults = maxResults - profiles.length;
      if (remainingResults > 0) {
        const channelProfiles = await this.searchChannels(keywords, countryFilter, remainingResults);
        profiles.push(...channelProfiles);
      }
      
      console.log(`[YouTube] Total profiles extracted: ${profiles.length}`);
      
    } catch (error) {
      console.error(`[YouTube] Error searching:`, error.message);
    }
    
    return profiles;
  }

  /**
   * Search for YouTube channels (original functionality)
   */
  async searchChannels(keywords, countryFilter, maxResults) {
    const profiles = [];
    const searchQuery = keywords.join(' ');
    const regionCode = this.getRegionCode(countryFilter);
    
    try {
      // Step 1: Search for channels
      const searchUrl = new URL(`${this.baseUrl}/search`);
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('q', searchQuery);
      searchUrl.searchParams.set('type', 'channel');
      searchUrl.searchParams.set('maxResults', Math.min(maxResults, 50));
      if (regionCode) {
        searchUrl.searchParams.set('regionCode', regionCode);
      }
      searchUrl.searchParams.set('key', this.apiKey);
      
      console.log(`[YouTube] Searching for channels...`);
      const searchResponse = await fetch(searchUrl.toString());
      
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        throw new Error(`YouTube API error: ${searchResponse.status} - ${errorText}`);
      }
      
      const searchData = await searchResponse.json();
      console.log(`[YouTube] Found ${searchData.items?.length || 0} channels`);
      
      if (!searchData.items || searchData.items.length === 0) {
        return profiles;
      }
      
      // Step 2: Get detailed channel information
      const channelIds = searchData.items.map(item => item.id.channelId).filter(Boolean);
      
      if (channelIds.length === 0) {
        return profiles;
      }
      
      const channelsUrl = new URL(`${this.baseUrl}/channels`);
      channelsUrl.searchParams.set('part', 'snippet,statistics,contentDetails');
      channelsUrl.searchParams.set('id', channelIds.join(','));
      channelsUrl.searchParams.set('key', this.apiKey);
      
      const channelsResponse = await fetch(channelsUrl.toString());
      
      if (!channelsResponse.ok) {
        const errorText = await channelsResponse.text();
        throw new Error(`YouTube Channels API error: ${channelsResponse.status} - ${errorText}`);
      }
      
      const channelsData = await channelsResponse.json();
      
      // Step 3: Transform to our profile format
      for (const channel of channelsData.items || []) {
        const profile = this.transformChannelToProfile(channel);
        profiles.push(profile);
      }
      
      console.log(`[YouTube] Successfully extracted ${profiles.length} channel profiles`);
      
    } catch (error) {
      console.error(`[YouTube] Error searching channels:`, error.message);
    }
    
    return profiles;
  }

  /**
   * Transform YouTube channel data to our profile format
   */
  transformChannelToProfile(channel) {
    const profile = this.createEmptyProfile();
    
    profile.profile_url = `https://www.youtube.com/channel/${channel.id}`;
    profile.username_or_handle = channel.snippet.customUrl || channel.snippet.title;
    profile.display_name = channel.snippet.title;
    profile.bio = channel.snippet.description || '';
    profile.location = channel.snippet.country || '';
    profile.follower_count = parseInt(channel.statistics.subscriberCount) || 0;
    profile.following_count = 0; // YouTube doesn't expose this
    profile.post_count = parseInt(channel.statistics.videoCount) || 0;
    profile.profile_image_url = channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url || '';
    
    // Extract topics from description
    profile.last_content_sample = channel.snippet.description?.substring(0, 500) || '';
    
    return profile;
  }

  /**
   * Map country name to ISO 3166-1 alpha-2 region code
   */
  getRegionCode(countryName) {
    const countryMap = {
      'united kingdom': 'GB',
      'uk': 'GB',
      'united states': 'US',
      'usa': 'US',
      'canada': 'CA',
      'australia': 'AU',
      'germany': 'DE',
      'france': 'FR',
      'spain': 'ES',
      'italy': 'IT',
      'netherlands': 'NL',
      'belgium': 'BE',
      'ireland': 'IE',
      'india': 'IN',
      'japan': 'JP',
      'china': 'CN',
      'brazil': 'BR',
      'mexico': 'MX'
    };
    
    return countryMap[countryName.toLowerCase()] || null;
  }

  /**
   * Search for videos matching keywords
   * @param {string[]} keywords - Search keywords
   * @param {string} regionCode - Region code
   * @param {number} maxResults - Max videos to return
   * @returns {array} - Video IDs
   */
  async searchVideos(keywords, regionCode, maxResults = 10) {
    const searchQuery = keywords.join(' ');
    const searchUrl = new URL(`${this.baseUrl}/search`);
    searchUrl.searchParams.set('part', 'id');
    searchUrl.searchParams.set('q', searchQuery);
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('maxResults', Math.min(maxResults, 50));
    if (regionCode) {
      searchUrl.searchParams.set('regionCode', regionCode);
    }
    searchUrl.searchParams.set('key', this.apiKey);
    
    const response = await fetch(searchUrl.toString());
    
    if (!response.ok) {
      throw new Error(`YouTube video search error: ${response.status}`);
    }
    
    const data = await response.json();
    return (data.items || []).map(item => item.id.videoId).filter(Boolean);
  }

  /**
   * Extract comments from a video
   * @param {string} videoId - YouTube video ID
   * @param {number} maxComments - Max comments to fetch
   * @returns {array} - Comments with author info
   */
  async extractCommentsFromVideo(videoId, maxComments = 100) {
    const comments = [];
    
    try {
      const commentsUrl = new URL(`${this.baseUrl}/commentThreads`);
      commentsUrl.searchParams.set('part', 'snippet');
      commentsUrl.searchParams.set('videoId', videoId);
      commentsUrl.searchParams.set('maxResults', Math.min(maxComments, 100));
      commentsUrl.searchParams.set('order', 'relevance'); // Get most relevant comments
      commentsUrl.searchParams.set('textFormat', 'plainText');
      commentsUrl.searchParams.set('key', this.apiKey);
      
      const response = await fetch(commentsUrl.toString());
      
      if (!response.ok) {
        // Video might have comments disabled
        return comments;
      }
      
      const data = await response.json();
      
      for (const item of data.items || []) {
        const comment = item.snippet.topLevelComment.snippet;
        comments.push({
          text: comment.textDisplay,
          authorChannelId: comment.authorChannelId?.value,
          authorDisplayName: comment.authorDisplayName,
          likeCount: comment.likeCount,
          publishedAt: comment.publishedAt
        });
      }
    } catch (error) {
      console.error(`[YouTube] Error fetching comments for video ${videoId}:`, error.message);
    }
    
    return comments;
  }

  /**
   * Find commenters asking questions
   * @param {string[]} keywords - Search keywords
   * @param {string} countryFilter - Country filter
   * @param {number} maxResults - Max profiles to return
   * @returns {array} - Profiles of question askers
   */
  async findQuestionAskers(keywords, countryFilter, maxResults) {
    const profiles = [];
    const regionCode = this.getRegionCode(countryFilter);
    
    console.log(`[YouTube] Searching for question askers in video comments...`);
    
    try {
      // Step 1: Find relevant videos
      const videoIds = await this.searchVideos(keywords, regionCode, 5); // Check 5 videos
      console.log(`[YouTube] Found ${videoIds.length} relevant videos`);
      
      if (videoIds.length === 0) {
        return profiles;
      }
      
      // Step 2: Extract comments from videos
      const allComments = [];
      for (const videoId of videoIds) {
        const comments = await this.extractCommentsFromVideo(videoId, 50);
        allComments.push(...comments);
      }
      
      console.log(`[YouTube] Extracted ${allComments.length} total comments`);
      
      // Step 3: Filter for questions and score them
      const questionComments = [];
      for (const comment of allComments) {
        const intentAnalysis = this.intentScorer.scoreContent(comment.text);
        
        if (intentAnalysis.is_question && intentAnalysis.intent_score > 30) {
          questionComments.push({
            ...comment,
            intentAnalysis
          });
        }
      }
      
      console.log(`[YouTube] Found ${questionComments.length} question comments`);
      
      // Step 4: Sort by intent score and get unique channel IDs
      questionComments.sort((a, b) => b.intentAnalysis.intent_score - a.intentAnalysis.intent_score);
      
      const seenChannels = new Set();
      const topQuestions = [];
      
      for (const comment of questionComments) {
        if (comment.authorChannelId && !seenChannels.has(comment.authorChannelId)) {
          seenChannels.add(comment.authorChannelId);
          topQuestions.push(comment);
          
          if (topQuestions.length >= maxResults) break;
        }
      }
      
      // Step 5: Fetch channel details for question askers
      for (const question of topQuestions) {
        try {
          const channelProfile = await this.getChannelById(question.authorChannelId);
          
          if (channelProfile) {
            // Calculate comment age
            const commentDate = new Date(question.publishedAt);
            const now = new Date();
            const ageInDays = Math.floor((now - commentDate) / (1000 * 60 * 60 * 24));
            const ageInHours = Math.floor((now - commentDate) / (1000 * 60 * 60));
            
            // Format age display
            let ageDisplay;
            if (ageInDays > 0) {
              ageDisplay = `${ageInDays} day${ageInDays > 1 ? 's' : ''} ago`;
            } else if (ageInHours > 0) {
              ageDisplay = `${ageInHours} hour${ageInHours > 1 ? 's' : ''} ago`;
            } else {
              const ageInMinutes = Math.floor((now - commentDate) / (1000 * 60));
              ageDisplay = `${ageInMinutes} minute${ageInMinutes > 1 ? 's' : ''} ago`;
            }
            
            // Add question metadata
            channelProfile.question_text = question.text;
            channelProfile.question_source = 'youtube_comment';
            channelProfile.question_date = question.publishedAt;
            channelProfile.question_age_days = ageInDays;
            channelProfile.question_age_display = ageDisplay;
            channelProfile.video_url = question.videoUrl;
            channelProfile.video_title = question.videoTitle;
            channelProfile.comment_id = question.id;
            channelProfile.question_quality_score = question.intentAnalysis.question_quality_score;
            channelProfile.intent_score = question.intentAnalysis.intent_score;
            channelProfile.decision_stage_score = question.intentAnalysis.decision_stage_score;
            channelProfile.decision_stage = question.intentAnalysis.decision_stage;
            channelProfile.help_seeking_score = question.intentAnalysis.help_seeking_score;
            channelProfile.question_type = question.intentAnalysis.question_type;
            
            profiles.push(channelProfile);
          }
        } catch (error) {
          console.error(`[YouTube] Error fetching channel ${question.authorChannelId}:`, error.message);
        }
      }
      
      console.log(`[YouTube] Successfully extracted ${profiles.length} question asker profiles`);
      
    } catch (error) {
      console.error(`[YouTube] Error in findQuestionAskers:`, error.message);
    }
    
    return profiles;
  }

  /**
   * Get channel by ID
   * @param {string} channelId - YouTube channel ID
   * @returns {object} - Channel profile
   */
  async getChannelById(channelId) {
    const channelsUrl = new URL(`${this.baseUrl}/channels`);
    channelsUrl.searchParams.set('part', 'snippet,statistics,contentDetails');
    channelsUrl.searchParams.set('id', channelId);
    channelsUrl.searchParams.set('key', this.apiKey);
    
    const response = await fetch(channelsUrl.toString());
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return this.transformChannelToProfile(data.items[0]);
    }
    
    return null;
  }

  /**
   * Extract channel information from YouTube URL
   */
  async extractProfile(url) {
    const profile = this.createEmptyProfile();
    profile.profile_url = url;
    
    try {
      console.log(`[YouTube] Extracting channel: ${url}`);
      
      if (!this.apiKey) {
        console.log(`[YouTube] Note: YouTube API key not configured`);
        return profile;
      }
      
      // Extract channel ID or username from URL
      let channelId = null;
      let username = null;
      
      const channelIdMatch = url.match(/youtube\.com\/channel\/([^\/\?]+)/);
      const usernameMatch = url.match(/youtube\.com\/(?:@|c\/|user\/)([^\/\?]+)/);
      
      if (channelIdMatch) {
        channelId = channelIdMatch[1];
      } else if (usernameMatch) {
        username = usernameMatch[1];
      }
      
      if (!channelId && !username) {
        console.log(`[YouTube] Could not extract channel ID or username from URL`);
        return profile;
      }
      
      // Build API request
      const channelsUrl = new URL(`${this.baseUrl}/channels`);
      channelsUrl.searchParams.set('part', 'snippet,statistics,contentDetails');
      
      if (channelId) {
        channelsUrl.searchParams.set('id', channelId);
      } else {
        channelsUrl.searchParams.set('forUsername', username);
      }
      
      channelsUrl.searchParams.set('key', this.apiKey);
      
      const response = await fetch(channelsUrl.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`YouTube API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return this.transformChannelToProfile(data.items[0]);
      } else {
        console.log(`[YouTube] No channel found for URL: ${url}`);
      }
      
    } catch (error) {
      console.error(`[YouTube] Error extracting channel ${url}:`, error.message);
    }
    
    return profile;
  }
}

module.exports = YouTubeAdapter;
