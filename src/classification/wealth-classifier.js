/**
 * Wealth and potential tier classifier
 */
class WealthClassifier {
  /**
   * Classify wealth tier based on profile signals
   */
  classifyWealthTier(profile, roleTags = []) {
    const text = `${profile.headline_or_title} ${profile.bio} ${profile.company} ${profile.company_size_hint}`.toLowerCase();
    
    // High net worth signals
    const highNetWorthSignals = [
      'angel investor',
      'vc',
      'venture capital',
      'fund partner',
      'funded company',
      'exit',
      'acquired',
      'c-suite',
      'ceo',
      'cfo',
      'cto'
    ];
    
    // Check for investor role
    if (roleTags.includes('investor')) {
      return 'high_net_worth';
    }
    
    // Check for high net worth signals
    for (const signal of highNetWorthSignals) {
      if (text.includes(signal)) {
        return 'high_net_worth';
      }
    }
    
    // Check company size hints
    if (profile.company_size_hint) {
      const sizeHint = profile.company_size_hint.toLowerCase();
      if (sizeHint.includes('50+') || sizeHint.includes('100+') || sizeHint.includes('large')) {
        return 'high_net_worth';
      }
    }
    
    // Check follower count (50k+ = personal brand with value)
    if (profile.followers_or_subscribers >= 50000) {
      return 'high_net_worth';
    }

    // Upper mid signals
    const upperMidSignals = [
      'director',
      'senior partner',
      'vp',
      'vice president',
      'head of',
      'multi-location',
      'multiple locations'
    ];
    
    for (const signal of upperMidSignals) {
      if (text.includes(signal)) {
        return 'upper_mid';
      }
    }
    
    // Check for startup with 10-50 staff
    if (profile.company_size_hint) {
      const sizeHint = profile.company_size_hint.toLowerCase();
      if (sizeHint.includes('10-50') || sizeHint.includes('11-50')) {
        return 'upper_mid';
      }
    }

    // Early stage or emerging signals
    const earlyStageSignals = [
      'solo founder',
      'solopreneur',
      'small agency',
      'pre-seed',
      'bootstrapped',
      'side-hustle',
      'side hustle',
      'freelancer',
      'just started'
    ];
    
    for (const signal of earlyStageSignals) {
      if (text.includes(signal)) {
        return 'early_stage_or_emerging';
      }
    }
    
    // Check for small company
    if (profile.company_size_hint) {
      const sizeHint = profile.company_size_hint.toLowerCase();
      if (sizeHint.includes('1-10') || sizeHint.includes('self-employed')) {
        return 'early_stage_or_emerging';
      }
    }

    // Default to unknown
    return 'unknown';
  }

  /**
   * Classify potential tier based on activity and growth signals
   */
  classifyPotentialTier(profile, topics = []) {
    const text = `${profile.bio} ${profile.last_content_sample}`.toLowerCase();
    
    // High potential signals
    const highPotentialSignals = [
      'scaling',
      'growth',
      'building',
      'launching',
      'shipped',
      'released',
      'growing',
      'expanding',
      'hiring',
      'raised',
      'funding'
    ];
    
    let highPotentialScore = 0;
    
    for (const signal of highPotentialSignals) {
      if (text.includes(signal)) {
        highPotentialScore++;
      }
    }
    
    // Check for topic overlap (indicates relevance)
    if (topics.length >= 3) {
      highPotentialScore += 2;
    }
    
    // Check for recent content activity
    if (profile.last_content_date) {
      const contentDate = new Date(profile.last_content_date);
      const now = new Date();
      const daysSinceContent = (now - contentDate) / (1000 * 60 * 60 * 24);
      
      if (daysSinceContent <= 7) {
        highPotentialScore += 2;
      } else if (daysSinceContent <= 30) {
        highPotentialScore += 1;
      }
    }
    
    if (highPotentialScore >= 3) {
      return 'high_potential';
    }

    // Medium potential signals
    const mediumPotentialSignals = [
      'working on',
      'interested in',
      'exploring',
      'learning',
      'experimenting'
    ];
    
    let mediumPotentialScore = 0;
    
    for (const signal of mediumPotentialSignals) {
      if (text.includes(signal)) {
        mediumPotentialScore++;
      }
    }
    
    if (topics.length >= 1) {
      mediumPotentialScore++;
    }
    
    if (mediumPotentialScore >= 2 || highPotentialScore >= 1) {
      return 'medium_potential';
    }

    // Low potential - sparse information or irrelevant
    if (text.length < 100 || topics.length === 0) {
      return 'low_potential';
    }

    return 'medium_potential';
  }
}

module.exports = WealthClassifier;
