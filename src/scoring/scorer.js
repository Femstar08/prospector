/**
 * Multi-dimensional scoring system
 */
class Scorer {
  /**
   * Calculate business alignment score (0-100)
   */
  calculateBusinessAlignment(profile, keywords = []) {
    if (keywords.length === 0) return 50;

    const text = `${profile.headline_or_title} ${profile.bio} ${profile.last_content_sample}`.toLowerCase();
    const topics = profile.topics_detected || [];
    
    // Count matching keywords
    let matchingKeywords = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matchingKeywords++;
      }
    }
    
    const keywordScore = (matchingKeywords / keywords.length) * 100;
    
    // Topic overlap score
    let topicScore = 0;
    if (topics.length > 0) {
      topicScore = Math.min(topics.length * 20, 100);
    }
    
    // Average the two scores
    const score = (keywordScore + topicScore) / 2;
    
    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  /**
   * Calculate technical synergy score (0-100)
   */
  calculateTechnicalSynergy(profile) {
    const roleTags = profile.role_tags || [];
    const topics = profile.topics_detected || [];
    
    // Technical roles get higher scores
    const technicalRoles = ['technical_builder', 'operator'];
    let score = 0;
    
    for (const role of technicalRoles) {
      if (roleTags.includes(role)) {
        score += 40;
      }
    }
    
    // Technical topics boost score
    const technicalTopics = ['AI', 'automation', 'web development', 'mobile development', 'data science', 'machine learning', 'SaaS'];
    for (const topic of topics) {
      if (technicalTopics.includes(topic)) {
        score += 10;
      }
    }
    
    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  /**
   * Calculate audience score based on follower count (0-100)
   */
  calculateAudienceScore(profile) {
    const followers = profile.followers_or_subscribers || 0;
    
    if (followers < 1000) {
      return 20;
    } else if (followers < 10000) {
      return 40;
    } else if (followers < 50000) {
      return 60;
    } else if (followers < 100000) {
      return 80;
    } else {
      return 100;
    }
  }

  /**
   * Calculate wealth potential score based on wealth tier (0-100)
   */
  calculateWealthPotentialScore(wealthTier) {
    const tierScores = {
      'high_net_worth': 100,
      'upper_mid': 70,
      'early_stage_or_emerging': 40,
      'unknown': 20
    };
    
    return tierScores[wealthTier] || 20;
  }

  /**
   * Calculate overall score using weighted formula (0-100)
   * Weights: business_alignment (25%), technical_synergy (20%), 
   *          audience (15%), wealth_potential (15%), openness (25%)
   */
  calculateOverallScore(subScores) {
    const {
      business_alignment_score = 0,
      technical_synergy_score = 0,
      audience_score = 0,
      wealth_potential_score = 0,
      openness_score = 0
    } = subScores;
    
    const score = 
      (business_alignment_score * 0.25) +
      (technical_synergy_score * 0.20) +
      (audience_score * 0.15) +
      (wealth_potential_score * 0.15) +
      (openness_score * 0.25);
    
    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  /**
   * Calculate all scores for a profile
   */
  calculateAllScores(profile, keywords = []) {
    const business_alignment_score = this.calculateBusinessAlignment(profile, keywords);
    const technical_synergy_score = this.calculateTechnicalSynergy(profile);
    const audience_score = this.calculateAudienceScore(profile);
    const wealth_potential_score = this.calculateWealthPotentialScore(profile.wealth_tier);
    const openness_score = profile.openness_score || 50;
    
    const overall_score = this.calculateOverallScore({
      business_alignment_score,
      technical_synergy_score,
      audience_score,
      wealth_potential_score,
      openness_score
    });
    
    return {
      business_alignment_score,
      technical_synergy_score,
      audience_score,
      wealth_potential_score,
      openness_score,
      overall_score
    };
  }
}

module.exports = Scorer;
