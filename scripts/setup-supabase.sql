-- ProspectMatcherUK Supabase Table Setup
-- Run this script in your Supabase SQL Editor to create the prospect_profiles table

-- Create the prospect_profiles table
CREATE TABLE IF NOT EXISTS prospect_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity fields
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  username_or_handle TEXT,
  location TEXT,
  country TEXT,
  headline_or_title TEXT,
  bio TEXT,
  company TEXT,
  company_size_hint TEXT,
  followers_or_subscribers INTEGER DEFAULT 0,

  -- Classification fields
  topics_detected JSONB DEFAULT '[]'::jsonb,
  role_tags JSONB DEFAULT '[]'::jsonb,
  relationship_tags JSONB DEFAULT '[]'::jsonb,
  wealth_tier TEXT,
  potential_tier TEXT,

  -- Scoring fields (0-100)
  business_alignment_score INTEGER CHECK (business_alignment_score >= 0 AND business_alignment_score <= 100),
  technical_synergy_score INTEGER CHECK (technical_synergy_score >= 0 AND technical_synergy_score <= 100),
  audience_score INTEGER CHECK (audience_score >= 0 AND audience_score <= 100),
  wealth_potential_score INTEGER CHECK (wealth_potential_score >= 0 AND wealth_potential_score <= 100),
  openness_score INTEGER CHECK (openness_score >= 0 AND openness_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Flags
  openness_tag TEXT CHECK (openness_tag IN ('open', 'neutral', 'closed', 'unknown')),
  high_net_worth_flag BOOLEAN DEFAULT FALSE,
  high_potential_flag BOOLEAN DEFAULT FALSE,

  -- Content context
  last_content_sample TEXT,
  last_content_date TIMESTAMPTZ,

  -- Metadata
  data_source_run_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint to prevent duplicates
  UNIQUE(platform, profile_url)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prospect_profiles_overall_score 
  ON prospect_profiles(overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_prospect_profiles_role_tags 
  ON prospect_profiles USING GIN(role_tags);

CREATE INDEX IF NOT EXISTS idx_prospect_profiles_relationship_tags 
  ON prospect_profiles USING GIN(relationship_tags);

CREATE INDEX IF NOT EXISTS idx_prospect_profiles_country 
  ON prospect_profiles(country);

CREATE INDEX IF NOT EXISTS idx_prospect_profiles_wealth_tier 
  ON prospect_profiles(wealth_tier);

CREATE INDEX IF NOT EXISTS idx_prospect_profiles_platform 
  ON prospect_profiles(platform);

CREATE INDEX IF NOT EXISTS idx_prospect_profiles_created_at 
  ON prospect_profiles(created_at DESC);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_prospect_profiles_updated_at ON prospect_profiles;
CREATE TRIGGER update_prospect_profiles_updated_at
  BEFORE UPDATE ON prospect_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE prospect_profiles IS 'Stores prospect profiles discovered and classified by ProspectMatcherUK Actor';
COMMENT ON COLUMN prospect_profiles.overall_score IS 'Weighted composite score: business_alignment (25%) + technical_synergy (20%) + audience (15%) + wealth_potential (15%) + openness (25%)';
COMMENT ON COLUMN prospect_profiles.role_tags IS 'Array of role classifications: founder, technical_builder, marketer_with_audience, general_entrepreneur, investor, operator, community_builder';
COMMENT ON COLUMN prospect_profiles.relationship_tags IS 'Array of relationship potential tags: competitor_candidate, collaborator_candidate, helper_expert, ally_candidate, investor_candidate, investee_candidate, mentor_candidate, mentee_candidate';
COMMENT ON COLUMN prospect_profiles.wealth_tier IS 'Wealth classification: high_net_worth, upper_mid, early_stage_or_emerging, unknown';
COMMENT ON COLUMN prospect_profiles.potential_tier IS 'Growth potential: high_potential, medium_potential, low_potential';

-- Grant permissions (adjust as needed for your setup)
-- ALTER TABLE prospect_profiles ENABLE ROW LEVEL SECURITY;

-- Example: Allow authenticated users to read
-- CREATE POLICY "Allow authenticated read access" ON prospect_profiles
--   FOR SELECT
--   TO authenticated
--   USING (true);

-- Example: Allow service role to insert/update
-- CREATE POLICY "Allow service role full access" ON prospect_profiles
--   FOR ALL
--   TO service_role
--   USING (true);
