/**
 * Relationship tag classifier
 */
class RelationshipClassifier {
  constructor() {
    // Define relationship keywords
    this.relationshipKeywords = {
      ally_candidate: ['partner with', 'collab', 'collaborate', 'joint venture', 'co-create', 'open to partnerships', 'looking for partners'],
      helper_expert: ['mentor', 'teaching', 'sharing', 'playbook', 'guide', 'advice', 'helping', 'consulting'],
      investor_candidate: ['seed', 'pre-seed', 'angel', 'investing', 'investment focus', 'backing', 'funding'],
      mentor_candidate: ['mentor', 'advisor', 'coach', 'guidance', 'years of experience', 'senior', 'veteran'],
      mentee_candidate: ['learning', 'junior', 'early career', 'ambitious', 'growing', 'aspiring']
    };
  }

  /**
   * Classify relationship tags for a profile
   */
  async classifyRelationships(profile, userContext = {}) {
    const relationshipTags = [];
    const text = `${profile.headline_or_title} ${profile.bio} ${profile.last_content_sample}`.toLowerCase();
    const roleTags = profile.role_tags || [];

    // Ally candidate - partnership language
    for (const keyword of this.relationshipKeywords.ally_candidate) {
      if (text.includes(keyword.toLowerCase())) {
        if (!relationshipTags.includes('ally_candidate')) {
          relationshipTags.push('ally_candidate');
        }
        break;
      }
    }

    // Helper/Expert - mentoring and teaching signals
    for (const keyword of this.relationshipKeywords.helper_expert) {
      if (text.includes(keyword.toLowerCase())) {
        if (!relationshipTags.includes('helper_expert')) {
          relationshipTags.push('helper_expert');
        }
        break;
      }
    }

    // Investor candidate - if tagged as investor and mentions investment stages
    if (roleTags.includes('investor')) {
      for (const keyword of this.relationshipKeywords.investor_candidate) {
        if (text.includes(keyword.toLowerCase())) {
          if (!relationshipTags.includes('investor_candidate')) {
            relationshipTags.push('investor_candidate');
          }
          break;
        }
      }
    }

    // Investee candidate - early stage founder
    if (roleTags.includes('founder')) {
      const earlyStageSignals = ['pre-seed', 'bootstrapped', 'solo', 'early stage', 'just started', 'building'];
      for (const signal of earlyStageSignals) {
        if (text.includes(signal)) {
          if (!relationshipTags.includes('investee_candidate')) {
            relationshipTags.push('investee_candidate');
          }
          break;
        }
      }
    }

    // Mentor candidate - senior with advice content
    const senioritySignals = ['senior', 'years of experience', 'veteran', 'expert', 'director', 'vp', 'head of'];
    const adviceSignals = ['advice', 'tips', 'lessons', 'learned', 'mistakes', 'guide'];
    
    let hasSeniority = false;
    let hasAdviceContent = false;
    
    for (const signal of senioritySignals) {
      if (text.includes(signal)) {
        hasSeniority = true;
        break;
      }
    }
    
    for (const signal of adviceSignals) {
      if (text.includes(signal)) {
        hasAdviceContent = true;
        break;
      }
    }
    
    if (hasSeniority && hasAdviceContent) {
      if (!relationshipTags.includes('mentor_candidate')) {
        relationshipTags.push('mentor_candidate');
      }
    }

    // Mentee candidate - junior with ambitious language
    const juniorSignals = ['junior', 'early career', 'learning', 'student', 'graduate', 'entry level'];
    const ambitiousSignals = ['ambitious', 'growing', 'aspiring', 'building', 'hustling', 'grinding'];
    
    let isJunior = false;
    let isAmbitious = false;
    
    for (const signal of juniorSignals) {
      if (text.includes(signal)) {
        isJunior = true;
        break;
      }
    }
    
    for (const signal of ambitiousSignals) {
      if (text.includes(signal)) {
        isAmbitious = true;
        break;
      }
    }
    
    if (isJunior && isAmbitious) {
      if (!relationshipTags.includes('mentee_candidate')) {
        relationshipTags.push('mentee_candidate');
      }
    }

    // Collaborator candidate - complementary skills
    // This requires comparing with user context
    if (userContext.keywords && userContext.keywords.length > 0) {
      const hasOverlap = userContext.keywords.some(keyword => 
        text.includes(keyword.toLowerCase()));
      
      if (hasOverlap && !relationshipTags.includes('competitor_candidate')) {
        // Has domain overlap but different role mix = collaborator
        if (!relationshipTags.includes('collaborator_candidate')) {
          relationshipTags.push('collaborator_candidate');
        }
      }
    }

    // Competitor candidate - very similar service mix
    // This is complex and would need more sophisticated analysis
    // For now, we'll skip this unless we have strong signals

    return relationshipTags;
  }
}

module.exports = RelationshipClassifier;
