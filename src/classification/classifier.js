const compromise = require('compromise');

/**
 * NLP-based classification engine for profiles
 */
class Classifier {
  constructor() {
    // Define role keywords
    this.roleKeywords = {
      founder: ['founder', 'co-founder', 'cofounder', 'owner', 'ceo', 'managing director', 'principal', 'partner', 'entrepreneur'],
      technical_builder: ['developer', 'engineer', 'data scientist', 'ml', 'ai engineer', 'full-stack', 'fullstack', 'cto', 'built', 'open-source', 'opensource', 'github'],
      marketer_with_audience: ['content creator', 'youtuber', 'newsletter', 'audience', 'community', 'personal brand', 'influencer'],
      general_entrepreneur: ['consultant', 'freelancer', 'coach', 'business owner', 'side-hustler', 'bootstrapped', 'agency owner', 'sme'],
      investor: ['angel investor', 'vc', 'venture partner', 'lp', 'invests in', 'backing founders', 'portfolio'],
      operator: ['coo', 'operations', 'delivery lead', 'service manager', 'product operations'],
      community_builder: ['community lead', 'community manager', 'host of meetup', 'discord', 'slack', 'fb group']
    };

    // Define openness keywords
    this.opennessKeywords = {
      open: ['open to collaboration', 'let\'s connect', 'dm me', 'looking to partner', 'seeking co-founder', 'open to partnerships', 'let\'s work together', 'reach out'],
      closed: ['not accepting', 'not open to', 'no solicitations', 'do not contact']
    };

    // Define predefined topics
    this.validTopics = [
      'AI',
      'automation',
      'Supabase',
      'Firebase',
      'app building',
      'consulting',
      'accounting',
      'property',
      'personal branding',
      'content creation',
      'coaching',
      'career support',
      'SaaS',
      'web development',
      'mobile development',
      'data science',
      'machine learning',
      'startups',
      'entrepreneurship'
    ];
  }

  /**
   * Classify role tags for a profile
   */
  async classifyRoles(profile) {
    const roleTags = [];
    const text = `${profile.headline_or_title} ${profile.bio} ${profile.company}`.toLowerCase();

    // Check for each role type
    for (const [role, keywords] of Object.entries(this.roleKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          if (!roleTags.includes(role)) {
            roleTags.push(role);
          }
          break;
        }
      }
    }

    // Special check for marketer_with_audience based on follower count
    if (profile.followers_or_subscribers > 10000) {
      if (!roleTags.includes('marketer_with_audience')) {
        roleTags.push('marketer_with_audience');
      }
    }

    return roleTags;
  }

  /**
   * Detect topics from text
   */
  async detectTopics(text) {
    if (!text) return [];

    const detectedTopics = [];
    const textLower = text.toLowerCase();

    // Simple keyword matching for topics
    for (const topic of this.validTopics) {
      if (textLower.includes(topic.toLowerCase())) {
        detectedTopics.push(topic);
      }
    }

    // Use compromise for additional entity extraction
    try {
      const doc = compromise(text);
      
      // Extract organizations that might be tech companies
      const orgs = doc.organizations().out('array');
      for (const org of orgs) {
        if (['supabase', 'firebase', 'aws', 'google', 'microsoft'].some(tech => 
          org.toLowerCase().includes(tech))) {
          const matchedTopic = this.validTopics.find(t => 
            org.toLowerCase().includes(t.toLowerCase()));
          if (matchedTopic && !detectedTopics.includes(matchedTopic)) {
            detectedTopics.push(matchedTopic);
          }
        }
      }
    } catch (error) {
      console.error('Error in NLP topic extraction:', error.message);
    }

    return detectedTopics;
  }

  /**
   * Analyze openness to collaboration
   */
  async analyzeOpenness(profile) {
    const text = `${profile.bio} ${profile.last_content_sample}`.toLowerCase();
    
    // Check for explicit openness signals
    for (const keyword of this.opennessKeywords.open) {
      if (text.includes(keyword.toLowerCase())) {
        return { tag: 'open', score: 80 };
      }
    }

    // Check for closed signals
    for (const keyword of this.opennessKeywords.closed) {
      if (text.includes(keyword.toLowerCase())) {
        return { tag: 'closed', score: 20 };
      }
    }

    // Check for networking activity indicators
    const networkingIndicators = ['podcast', 'event', 'collaboration', 'partnership', 'network'];
    let networkingScore = 0;
    for (const indicator of networkingIndicators) {
      if (text.includes(indicator)) {
        networkingScore += 10;
      }
    }

    if (networkingScore >= 20) {
      return { tag: 'neutral', score: 55 };
    }

    // Default to unknown if insufficient data
    if (text.length < 50) {
      return { tag: 'unknown', score: 50 };
    }

    // Default neutral
    return { tag: 'neutral', score: 50 };
  }
}

module.exports = Classifier;
