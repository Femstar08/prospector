const { Actor } = require('apify');
const SupabaseClient = require('./supabase-client');

/**
 * Storage manager for dual persistence (Apify + Supabase)
 */
class StorageManager {
  constructor(config = {}) {
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseKey = config.supabaseKey;
    this.supabaseClient = null;
    
    // Initialize Supabase client if credentials provided
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        this.supabaseClient = new SupabaseClient(this.supabaseUrl, this.supabaseKey);
        console.log('Supabase client initialized');
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error.message);
      }
    } else {
      console.log('Supabase credentials not provided, will only save to Apify dataset');
    }
  }

  /**
   * Save profiles to Apify dataset
   */
  async saveToApify(profiles) {
    try {
      await Actor.pushData(profiles);
      console.log(`Saved ${profiles.length} profiles to Apify dataset`);
    } catch (error) {
      console.error('Error saving to Apify dataset:', error.message);
      throw error; // Critical failure
    }
  }

  /**
   * Save profiles to Supabase
   */
  async saveToSupabase(profiles) {
    if (!this.supabaseClient) {
      console.log('Supabase client not initialized, skipping Supabase storage');
      return;
    }

    try {
      await this.supabaseClient.batchUpsert(profiles);
      console.log(`Saved ${profiles.length} profiles to Supabase`);
    } catch (error) {
      console.error('Error saving to Supabase:', error.message);
      // Non-critical failure, continue
    }
  }

  /**
   * Save profiles to both Apify and Supabase
   */
  async saveProfiles(profiles) {
    if (!profiles || profiles.length === 0) {
      console.log('No profiles to save');
      return;
    }

    console.log(`Saving ${profiles.length} profiles...`);

    // Save to Apify (critical)
    await this.saveToApify(profiles);

    // Save to Supabase (non-critical)
    await this.saveToSupabase(profiles);

    console.log('Storage complete');
  }

  /**
   * Deduplicate profiles (moved from Filter for convenience)
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
   * Filter profiles by score with exceptions
   */
  filterByScore(profiles, minScore) {
    return profiles.filter(profile => {
      const relationshipTags = profile.relationship_tags || [];
      
      // Exception: always keep investors and helpers
      if (relationshipTags.includes('investor_candidate') || 
          relationshipTags.includes('helper_expert')) {
        return true;
      }
      
      return profile.overall_score >= minScore;
    });
  }
}

module.exports = StorageManager;
