/**
 * Filtering and deduplication utilities
 */
class Filter {
  /**
   * Filter profiles by minimum overall score
   * Exception: investor_candidate and helper_expert are always retained
   */
  filterByScore(profiles, minOverallScore) {
    return profiles.filter(profile => {
      const relationshipTags = profile.relationship_tags || [];
      
      // Exception: always keep investors and helpers
      if (relationshipTags.includes('investor_candidate') || 
          relationshipTags.includes('helper_expert')) {
        return true;
      }
      
      // Otherwise, filter by score
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
   * Apply all filters in sequence
   */
  applyFilters(profiles, options = {}) {
    let filtered = profiles;
    
    // Deduplicate first
    filtered = this.deduplicateProfiles(filtered);
    
    // Filter by score
    if (options.minOverallScore !== undefined) {
      filtered = this.filterByScore(filtered, options.minOverallScore);
    }
    
    // Limit results
    if (options.maxResults !== undefined) {
      filtered = this.limitResults(filtered, options.maxResults);
    }
    
    return filtered;
  }
}

module.exports = Filter;
