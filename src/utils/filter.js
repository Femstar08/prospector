/**
 * Filtering and deduplication utilities
 */
class Filter {
  constructor() {
    // Country-specific indicators for content filtering
    this.countryIndicators = {
      'United Kingdom': [
        // Geographic terms
        'uk', 'united kingdom', 'britain', 'british', 'england', 'scotland', 'wales', 'northern ireland',
        'london', 'manchester', 'birmingham', 'glasgow', 'edinburgh', 'cardiff', 'belfast',
        'yorkshire', 'lancashire', 'devon', 'cornwall', 'kent', 'surrey',
        
        // Currency and financial terms
        '£', 'pound', 'sterling', 'pence', 'quid',
        
        // Tax and legal terms
        'hmrc', 'vat', 'council tax', 'stamp duty', 'capital gains tax', 'inheritance tax',
        'companies house', 'limited company', 'ltd', 'plc', 'sole trader',
        'self assessment', 'tax return', 'p60', 'p45', 'national insurance',
        
        // Banking and finance
        'barclays', 'lloyds', 'hsbc uk', 'natwest', 'santander uk', 'halifax',
        'isa', 'sipp', 'pension', 'help to buy', 'right to buy',
        
        // Property terms
        'freehold', 'leasehold', 'ground rent', 'service charge', 'conveyancing',
        'mortgage advisor', 'building society', 'rightmove', 'zoopla',
        
        // Business terms
        'cis scheme', 'ir35', 'dividend tax', 'corporation tax',
        'business rates', 'apprenticeship levy'
      ],
      
      'United States': [
        // Geographic terms
        'usa', 'united states', 'america', 'american', 'us',
        'california', 'new york', 'texas', 'florida', 'illinois',
        
        // Currency and financial terms
        '$', 'dollar', 'usd', 'cents',
        
        // Tax and legal terms
        'irs', 'federal tax', 'state tax', '401k', 'roth ira',
        'llc', 'corporation', 'inc', 's-corp', 'c-corp',
        'social security', 'medicare', 'w2', '1099'
      ],
      
      'Canada': [
        // Geographic terms
        'canada', 'canadian', 'ontario', 'quebec', 'british columbia',
        'toronto', 'vancouver', 'montreal', 'calgary',
        
        // Currency and financial terms
        'cad', 'canadian dollar',
        
        // Tax and legal terms
        'cra', 'gst', 'hst', 'rrsp', 'tfsa'
      ],
      
      'Australia': [
        // Geographic terms
        'australia', 'australian', 'sydney', 'melbourne', 'brisbane',
        
        // Currency and financial terms
        'aud', 'australian dollar',
        
        // Tax and legal terms
        'ato', 'gst', 'superannuation', 'abn'
      ]
    };
  }
  /**
   * Filter profiles by minimum overall score with quality gates
   * High-value exceptions: investor_candidate, helper_expert with quality thresholds
   * Question askers: must meet minimum intent and quality requirements
   */
  filterByScore(profiles, minOverallScore, options = {}) {
    const {
      minIntentScore = 60,           // Minimum intent for question askers
      minQuestionQuality = 50,       // Minimum question quality
      minWealthScore = 40,           // Minimum wealth potential
      allowLowScoreInvestors = true  // Keep low-scoring investors
    } = options;

    return profiles.filter(profile => {
      const relationshipTags = profile.relationship_tags || [];
      const intentScore = profile.intent_score || 0;
      const questionQuality = profile.question_quality_score || 0;
      const wealthScore = profile.wealth_potential_score || 0;
      
      // High-value exception: investors (but still check wealth potential)
      if (relationshipTags.includes('investor_candidate')) {
        if (allowLowScoreInvestors) return true;
        return wealthScore >= minWealthScore;
      }
      
      // High-value exception: helper experts (domain experts)
      if (relationshipTags.includes('helper_expert')) {
        return profile.overall_score >= Math.max(minOverallScore - 10, 30);
      }
      
      // Question askers: must meet quality thresholds
      if (profile.question_text && intentScore > 0) {
        // High intent questions can have slightly lower overall scores
        if (intentScore >= 80 && questionQuality >= 60) {
          return profile.overall_score >= Math.max(minOverallScore - 15, 35);
        }
        
        // Medium intent questions need good quality
        if (intentScore >= minIntentScore && questionQuality >= minQuestionQuality) {
          return profile.overall_score >= Math.max(minOverallScore - 10, 40);
        }
        
        // Low intent questions must meet full threshold
        return profile.overall_score >= minOverallScore;
      }
      
      // Standard filtering for everyone else
      return profile.overall_score >= minOverallScore;
    });
  }

  /**
   * Deduplicate profiles by platform and profile_url
   */
  deduplicateProfiles(profiles) {
    const seen = new Map();
    const deduplicated = [];
    
    for (const profile of profiles) {
      const key = `${profile.platform}:${profile.profile_url}`;
      
      if (!seen.has(key)) {
        seen.set(key, true);
        deduplicated.push(profile);
      }
    }
    
    return deduplicated;
  }

  /**
   * Limit total number of profiles
   */
  limitResults(profiles, maxResults) {
    if (profiles.length <= maxResults) {
      return profiles;
    }
    
    // Sort by overall_score descending and take top N
    const sorted = [...profiles].sort((a, b) => b.overall_score - a.overall_score);
    return sorted.slice(0, maxResults);
  }

  /**
   * Filter profiles by content country (based on post/question content)
   * @param {array} profiles - Profiles to filter
   * @param {string} countryFilter - Target country
   * @returns {array} - Filtered profiles
   */
  filterByContentCountry(profiles, countryFilter) {
    if (!countryFilter || countryFilter.toLowerCase() === 'all') {
      return profiles;
    }
    
    const indicators = this.countryIndicators[countryFilter];
    if (!indicators) {
      console.log(`[Filter] No indicators defined for country: ${countryFilter}`);
      return profiles;
    }
    
    return profiles.filter(profile => {
      // Check question text for country indicators
      if (profile.question_text) {
        const text = profile.question_text.toLowerCase();
        const hasCountryIndicator = indicators.some(indicator => 
          text.includes(indicator.toLowerCase())
        );
        
        if (hasCountryIndicator) {
          console.log(`[Filter] Content match for ${countryFilter}: ${profile.username_or_handle}`);
          return true;
        }
      }
      
      // Check bio and content for country indicators
      const contentToCheck = [
        profile.bio,
        profile.last_content_sample,
        profile.location,
        profile.headline_or_title
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (contentToCheck) {
        const hasCountryIndicator = indicators.some(indicator => 
          contentToCheck.includes(indicator.toLowerCase())
        );
        
        if (hasCountryIndicator) {
          console.log(`[Filter] Profile match for ${countryFilter}: ${profile.username_or_handle}`);
          return true;
        }
      }
      
      return false;
    });
  }

  /**
   * Apply all filters in sequence with enhanced quality controls
   */
  applyFilters(profiles, options = {}) {
    let filtered = profiles;
    
    // Deduplicate first
    filtered = this.deduplicateProfiles(filtered);
    
    // Filter by content country (new)
    if (options.countryFilter) {
      const beforeCount = filtered.length;
      filtered = this.filterByContentCountry(filtered, options.countryFilter);
      console.log(`[Filter] Country filter (${options.countryFilter}): ${beforeCount} → ${filtered.length} profiles`);
    }
    
    // Filter by score with quality gates
    if (options.minOverallScore !== undefined) {
      filtered = this.filterByScore(filtered, options.minOverallScore, {
        minIntentScore: options.minIntentScore,
        minQuestionQuality: options.minQuestionQuality,
        minWealthScore: options.minWealthScore,
        allowLowScoreInvestors: options.allowLowScoreInvestors
      });
    }
    
    // Additional quality filter: remove very low engagement profiles
    if (options.removeVeryLowEngagement !== false) {
      filtered = filtered.filter(profile => {
        // Keep if has good intent or is high-value relationship
        if (profile.intent_score >= 60) return true;
        if ((profile.relationship_tags || []).some(tag => 
          ['investor_candidate', 'helper_expert'].includes(tag))) return true;
        
        // Otherwise check engagement indicators
        const followers = profile.followers_or_subscribers || 0;
        const hasRecentContent = profile.last_content_sample && profile.last_content_sample.length > 50;
        
        return followers >= 100 || hasRecentContent;
      });
    }
    
    // Limit results
    if (options.maxResults !== undefined) {
      filtered = this.limitResults(filtered, options.maxResults);
    }
    
    return filtered;
  }
}

module.exports = Filter;
