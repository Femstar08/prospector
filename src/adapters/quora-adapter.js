const BasePlatformAdapter = require('./base-adapter');
const IntentScorer = require('../scoring/intent-scorer');

/**
 * Quora platform adapter
 * Uses web scraping since Quora doesn't have a public API
 */
class QuoraAdapter extends BasePlatformAdapter {
  constructor(config = {}) {
    super(config);
    this.platformName = 'quora';
    this.baseUrl = 'https://www.quora.com';
    this.questionSeekingMode = config.questionSeekingMode !== false; // Default true
    this.intentScorer = new IntentScorer();
    
    // UK-focused topics for finance and property questions
    this.targetTopics = [
      'Property-Investment-UK',
      'UK-Personal-Finance',
      'Accounting-and-Bookkeeping',
      'Small-Business-Finance-UK',
      'UK-Property-Market',
      'UK-Tax-Advice',
      'UK-Mortgage-Advice',
      'UK-Investment-Advice'
    ];
    
    // Rate limiting: Be respectful to Quora's servers
    this.requestDelay = 2000; // 2 seconds between requests
    this.lastRequestTime = 0;
  }

  /**
   * Validate Quora URL
   */
  validateUrl(url) {
    return url.includes('quora.com/');
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
   * Make HTTP request with proper headers and rate limiting
   */
  async makeRequest(url) {
    await this.rateLimit();

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Search for Quora profiles asking questions
   */
  async search(keywords, countryFilter, maxResults) {
    const profiles = [];
    
    console.log(`[Quora] Searching for: ${keywords.join(', ')} in ${countryFilter}`);
    console.log(`[Quora] Question-seeking mode: ${this.questionSeekingMode ? 'enabled' : 'disabled'}`);
    console.log(`[Quora] Target topics: ${this.targetTopics.join(', ')}`);
    
    if (!this.questionSeekingMode) {
      console.log(`[Quora] Skipping Quora search - question-seeking mode disabled`);
      return profiles;
    }
    
    try {
      // Search each target topic for questions
      const allQuestions = [];
      
      for (const topic of this.targetTopics) {
        try {
          const questions = await this.searchTopic(topic, keywords, 10);
          allQuestions.push(...questions);
          console.log(`[Quora] Found ${questions.length} questions in topic: ${topic}`);
        } catch (error) {
          console.error(`[Quora] Error searching topic ${topic}:`, error.message);
        }
      }
      
      console.log(`[Quora] Total questions found: ${allQuestions.length}`);
      
      // Filter for UK-specific content
      const ukQuestions = this.filterForUKContent(allQuestions, countryFilter);
      console.log(`[Quora] UK-specific questions: ${ukQuestions.length}`);
      
      // Score questions by intent and recency
      const scoredQuestions = [];
      for (const question of ukQuestions) {
        const intentAnalysis = this.intentScorer.scoreContent(question.text);
        
        if (intentAnalysis.is_question && intentAnalysis.intent_score > 25) {
          scoredQuestions.push({
            ...question,
            intentAnalysis
          });
        }
      }
      
      // Sort by intent score and recency (recent questions get bonus)
      scoredQuestions.sort((a, b) => {
        const scoreA = a.intentAnalysis.intent_score + (a.isRecent ? 10 : 0);
        const scoreB = b.intentAnalysis.intent_score + (b.isRecent ? 10 : 0);
        return scoreB - scoreA;
      });
      
      console.log(`[Quora] High-intent questions: ${scoredQuestions.length}`);
      
      // Extract unique question askers
      const seenUsers = new Set();
      const topQuestions = [];
      
      for (const question of scoredQuestions) {
        if (question.askerUsername && !seenUsers.has(question.askerUsername)) {
          seenUsers.add(question.askerUsername);
          topQuestions.push(question);
          
          if (topQuestions.length >= maxResults) break;
        }
      }
      
      // Get user profiles for question askers
      for (const question of topQuestions) {
        try {
          const userProfile = await this.getUserProfile(question.askerUsername);
          
          if (userProfile) {
            // Add question metadata
            userProfile.question_text = question.text;
            userProfile.question_source = 'quora_question';
            userProfile.question_date = question.date;
            userProfile.question_quality_score = question.intentAnalysis.question_quality_score;
            userProfile.intent_score = question.intentAnalysis.intent_score;
            userProfile.decision_stage_score = question.intentAnalysis.decision_stage_score;
            userProfile.decision_stage = question.intentAnalysis.decision_stage;
            userProfile.help_seeking_score = question.intentAnalysis.help_seeking_score;
            userProfile.question_type = question.intentAnalysis.question_type;
            userProfile.topic_tags = question.topics || [];
            
            profiles.push(userProfile);
          }
        } catch (error) {
          console.error(`[Quora] Error fetching user ${question.askerUsername}:`, error.message);
        }
      }
      
      console.log(`[Quora] Successfully extracted ${profiles.length} question asker profiles`);
      
    } catch (error) {
      console.error(`[Quora] Error searching:`, error.message);
    }
    
    return profiles;
  }

  /**
   * Search a specific Quora topic for questions
   * @param {string} topic - Topic name (e.g., 'Property-Investment-UK')
   * @param {string[]} keywords - Search keywords
   * @param {number} maxQuestions - Max questions to return
   * @returns {array} - Questions
   */
  async searchTopic(topic, keywords, maxQuestions = 10) {
    const questions = [];
    
    try {
      // Build topic URL
      const topicUrl = `${this.baseUrl}/topic/${topic}`;
      
      console.log(`[Quora] Searching topic: ${topicUrl}`);
      
      const html = await this.makeRequest(topicUrl);
      
      // Parse questions from the topic page
      // Note: This is a simplified parser - Quora's actual structure may vary
      const questionMatches = this.extractQuestionsFromHTML(html, keywords);
      
      for (const match of questionMatches.slice(0, maxQuestions)) {
        questions.push({
          text: match.text,
          url: match.url,
          askerUsername: match.askerUsername,
          date: match.date,
          topics: [topic],
          isRecent: this.isRecentQuestion(match.date)
        });
      }
      
    } catch (error) {
      console.error(`[Quora] Error searching topic ${topic}:`, error.message);
    }
    
    return questions;
  }

  /**
   * Extract questions from Quora HTML
   * Note: This is a simplified implementation - real Quora scraping would need more robust parsing
   * @param {string} html - HTML content
   * @param {string[]} keywords - Keywords to filter by
   * @returns {array} - Extracted questions
   */
  extractQuestionsFromHTML(html, keywords) {
    const questions = [];
    
    try {
      // Look for question patterns in the HTML
      // This is a simplified approach - in practice, you'd need a proper HTML parser
      const questionRegex = /<a[^>]*href="([^"]*\/[^"]*)"[^>]*>([^<]*\?[^<]*)</g;
      let match;
      
      while ((match = questionRegex.exec(html)) !== null) {
        const url = match[1];
        const text = match[2].trim();
        
        // Filter by keywords
        const hasKeyword = keywords.some(keyword => 
          text.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (hasKeyword && text.includes('?')) {
          questions.push({
            text: text,
            url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            askerUsername: this.extractUsernameFromUrl(url),
            date: new Date().toISOString() // Placeholder - would need to extract actual date
          });
        }
      }
      
    } catch (error) {
      console.error(`[Quora] Error parsing HTML:`, error.message);
    }
    
    return questions;
  }

  /**
   * Extract username from Quora URL
   * @param {string} url - Quora URL
   * @returns {string} - Username or null
   */
  extractUsernameFromUrl(url) {
    // Simplified username extraction - would need more robust parsing
    const match = url.match(/\/profile\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  /**
   * Check if question is recent (within last 30 days)
   * @param {string} dateStr - Date string
   * @returns {boolean} - Is recent
   */
  isRecentQuestion(dateStr) {
    try {
      const questionDate = new Date(dateStr);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return questionDate > thirtyDaysAgo;
    } catch (error) {
      return false; // If we can't parse the date, assume it's not recent
    }
  }

  /**
   * Filter questions for UK-specific content
   * @param {array} questions - Questions to filter
   * @param {string} countryFilter - Country filter
   * @returns {array} - Filtered questions
   */
  filterForUKContent(questions, countryFilter) {
    if (!countryFilter || countryFilter.toLowerCase() === 'all') {
      return questions;
    }
    
    const ukIndicators = [
      'uk', 'united kingdom', 'britain', 'british', 'england', 'scotland', 'wales',
      'london', 'manchester', 'birmingham', 'glasgow', 'edinburgh',
      '£', 'pound', 'sterling', 'hmrc', 'vat', 'council tax', 'stamp duty'
    ];
    
    return questions.filter(question => {
      const text = question.text.toLowerCase();
      return ukIndicators.some(indicator => text.includes(indicator));
    });
  }

  /**
   * Get user profile from Quora
   * @param {string} username - Quora username
   * @returns {object} - User profile
   */
  async getUserProfile(username) {
    if (!username) return null;
    
    try {
      const profileUrl = `${this.baseUrl}/profile/${username}`;
      
      console.log(`[Quora] Fetching profile: ${username}`);
      
      const html = await this.makeRequest(profileUrl);
      
      return this.parseUserProfile(html, username, profileUrl);
      
    } catch (error) {
      console.error(`[Quora] Error fetching user ${username}:`, error.message);
      return null;
    }
  }

  /**
   * Parse user profile from Quora HTML
   * @param {string} html - HTML content
   * @param {string} username - Username
   * @param {string} profileUrl - Profile URL
   * @returns {object} - Parsed profile
   */
  parseUserProfile(html, username, profileUrl) {
    const profile = this.createEmptyProfile();
    
    profile.profile_url = profileUrl;
    profile.username_or_handle = username;
    profile.display_name = username; // Would extract actual name from HTML
    
    try {
      // Extract bio/description (simplified)
      const bioMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/);
      if (bioMatch) {
        profile.bio = bioMatch[1];
      }
      
      // Extract follower count (simplified)
      const followerMatch = html.match(/(\d+)\s*followers?/i);
      if (followerMatch) {
        profile.follower_count = parseInt(followerMatch[1]);
      }
      
      // Extract answer count as proxy for activity
      const answerMatch = html.match(/(\d+)\s*answers?/i);
      if (answerMatch) {
        profile.post_count = parseInt(answerMatch[1]);
      }
      
    } catch (error) {
      console.error(`[Quora] Error parsing profile for ${username}:`, error.message);
    }
    
    return profile;
  }

  /**
   * Extract profile from Quora URL
   */
  async extractProfile(url) {
    const profile = this.createEmptyProfile();
    profile.profile_url = url;
    
    try {
      // Extract username from URL
      const usernameMatch = url.match(/quora\.com\/profile\/([^\/\?]+)/);
      if (!usernameMatch) {
        console.log(`[Quora] Could not extract username from URL: ${url}`);
        return profile;
      }
      
      const username = usernameMatch[1];
      console.log(`[Quora] Extracting profile: ${username}`);
      
      const userProfile = await this.getUserProfile(username);
      
      if (userProfile) {
        return userProfile;
      }
      
    } catch (error) {
      console.error(`[Quora] Error extracting profile ${url}:`, error.message);
    }
    
    return profile;
  }
}

module.exports = QuoraAdapter;