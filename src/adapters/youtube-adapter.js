const BasePlatformAdapter = require('./base-adapter');

/**
 * YouTube platform adapter
 */
class YouTubeAdapter extends BasePlatformAdapter {
  constructor(config = {}) {
    super(config);
    this.platformName = 'youtube';
    this.apiKey = config.youtubeApiKey || process.env.YOUTUBE_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
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
    console.log(`[YouTube] API key status: ${this.apiKey ? 'configured' : 'not configured'}`);
    
    if (!this.apiKey) {
      console.log(`[YouTube] Note: YouTube API key not configured - skipping search`);
      return profiles;
    }
    
    try {
      // Map country name to ISO 3166-1 alpha-2 code
      const regionCode = this.getRegionCode(countryFilter);
      
      // Step 1: Search for channels
      const searchUrl = new URL(`${this.baseUrl}/search`);
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('q', searchQuery);
      searchUrl.searchParams.set('type', 'channel');
      searchUrl.searchParams.set('maxResults', Math.min(maxResults, 50)); // API limit is 50
      if (regionCode) {
        searchUrl.searchParams.set('regionCode', regionCode);
      }
      searchUrl.searchParams.set('key', this.apiKey);
      
      console.log(`[YouTube] Calling YouTube Data API v3...`);
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
      console.error(`[YouTube] Error searching:`, error.message);
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
