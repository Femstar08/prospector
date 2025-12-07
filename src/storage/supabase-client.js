const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase storage client
 */
class SupabaseClient {
  constructor(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and API key are required');
    }
    
    this.client = createClient(supabaseUrl, supabaseKey);
    this.tableName = 'prospect_profiles';
  }

  /**
   * Check if a profile exists
   */
  async profileExists(platform, profileUrl) {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('id')
        .eq('platform', platform)
        .eq('profile_url', profileUrl)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error checking profile existence:', error.message);
      return false;
    }
  }

  /**
   * Upsert a single profile (insert or update)
   */
  async upsertProfile(profile) {
    try {
      // Prepare profile data for Supabase
      const profileData = {
        name: profile.name,
        platform: profile.platform,
        profile_url: profile.profile_url,
        username_or_handle: profile.username_or_handle,
        location: profile.location,
        country: profile.country,
        headline_or_title: profile.headline_or_title,
        bio: profile.bio,
        company: profile.company,
        company_size_hint: profile.company_size_hint,
        followers_or_subscribers: profile.followers_or_subscribers || 0,
        topics_detected: profile.topics_detected || [],
        role_tags: profile.role_tags || [],
        relationship_tags: profile.relationship_tags || [],
        wealth_tier: profile.wealth_tier,
        potential_tier: profile.potential_tier,
        business_alignment_score: profile.business_alignment_score,
        technical_synergy_score: profile.technical_synergy_score,
        audience_score: profile.audience_score,
        wealth_potential_score: profile.wealth_potential_score,
        openness_score: profile.openness_score,
        overall_score: profile.overall_score,
        openness_tag: profile.openness_tag,
        high_net_worth_flag: profile.wealth_tier === 'high_net_worth',
        high_potential_flag: profile.potential_tier === 'high_potential',
        last_content_sample: profile.last_content_sample,
        last_content_date: profile.last_content_date || null,
        data_source_run_id: profile.data_source_run_id,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.client
        .from(this.tableName)
        .upsert(profileData, {
          onConflict: 'platform,profile_url'
        })
        .select();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Error upserting profile ${profile.profile_url}:`, error.message);
      throw error;
    }
  }

  /**
   * Batch upsert profiles
   */
  async batchUpsert(profiles, batchSize = 50) {
    const results = [];
    
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      
      try {
        const batchResults = await Promise.all(
          batch.map(profile => this.upsertProfile(profile))
        );
        results.push(...batchResults);
        
        console.log(`Upserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} profiles)`);
      } catch (error) {
        console.error(`Error upserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        // Continue with next batch
      }
    }
    
    return results;
  }

  /**
   * Update an existing profile
   */
  async updateProfile(profile) {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .update({
          name: profile.name,
          username_or_handle: profile.username_or_handle,
          location: profile.location,
          country: profile.country,
          headline_or_title: profile.headline_or_title,
          bio: profile.bio,
          company: profile.company,
          company_size_hint: profile.company_size_hint,
          followers_or_subscribers: profile.followers_or_subscribers || 0,
          topics_detected: profile.topics_detected || [],
          role_tags: profile.role_tags || [],
          relationship_tags: profile.relationship_tags || [],
          wealth_tier: profile.wealth_tier,
          potential_tier: profile.potential_tier,
          business_alignment_score: profile.business_alignment_score,
          technical_synergy_score: profile.technical_synergy_score,
          audience_score: profile.audience_score,
          wealth_potential_score: profile.wealth_potential_score,
          openness_score: profile.openness_score,
          overall_score: profile.overall_score,
          openness_tag: profile.openness_tag,
          high_net_worth_flag: profile.wealth_tier === 'high_net_worth',
          high_potential_flag: profile.potential_tier === 'high_potential',
          last_content_sample: profile.last_content_sample,
          last_content_date: profile.last_content_date || null,
          data_source_run_id: profile.data_source_run_id,
          updated_at: new Date().toISOString()
        })
        .eq('platform', profile.platform)
        .eq('profile_url', profile.profile_url)
        .select();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Error updating profile ${profile.profile_url}:`, error.message);
      throw error;
    }
  }
}

module.exports = SupabaseClient;
