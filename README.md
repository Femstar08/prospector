# ProspectMatcherUK - Multi-Platform Partner Discovery

An Apify Actor that discovers, classifies, and scores potential business partners across multiple platforms for UK-based entrepreneurs.

## Features

- **Multi-Platform Search**: Searches across LinkedIn, X/Twitter, YouTube, Reddit, Medium, and general web sources
- **Intelligent Classification**: Automatically tags profiles with role types (founder, technical_builder, investor, etc.)
- **Relationship Tagging**: Identifies potential collaborators, mentors, investors, and allies
- **Multi-Dimensional Scoring**: Ranks prospects using business alignment, technical synergy, audience size, wealth potential, and openness scores
- **Dual Storage**: Saves results to both Apify datasets and Supabase for easy UI integration
- **Smart Filtering**: Deduplicates profiles and filters by score (with exceptions for high-value profiles)

## Input Parameters

### Required Parameters

- **keywords** (array): Keywords to search for across platforms

  - Example: `["AI automation", "Supabase", "consulting"]`
  - At least one keyword is required

- **includePlatforms** (array): Which platforms to search
  - Options: `linkedin`, `x`, `youtube`, `reddit`, `medium`, `web`
  - Default: `["linkedin", "x", "youtube"]`

### Optional Parameters

- **countryFilter** (string): Restrict results to a specific country

  - Default: `"United Kingdom"`

- **maxResults** (integer): Maximum number of profiles to return

  - Default: `300`
  - Range: 1-10000

- **minOverallScore** (integer): Filter out profiles below this score

  - Default: `50`
  - Range: 0-100
  - Note: Profiles tagged as `investor_candidate` or `helper_expert` are always retained

- **onlyNewProfiles** (boolean): Update existing profiles instead of creating duplicates

  - Default: `true`

- **supabaseUrl** (string): Your Supabase project URL

  - Example: `https://xxxxx.supabase.co`
  - Leave empty to only save to Apify dataset

- **supabaseKey** (string): Your Supabase service role key
  - Required if `supabaseUrl` is provided

## Output Schema

Each profile in the output contains:

### Identity Fields

- `name`: Profile name
- `platform`: Source platform (linkedin, x, youtube, etc.)
- `profile_url`: Direct link to profile
- `username_or_handle`: Username or handle
- `location`: Raw location string
- `country`: Normalized country name
- `headline_or_title`: Profile headline or title
- `bio`: Profile bio/description
- `company`: Company name
- `company_size_hint`: Company size indicator
- `followers_or_subscribers`: Follower/subscriber count

### Classification Fields

- `role_tags`: Array of role classifications
  - Options: `founder`, `technical_builder`, `marketer_with_audience`, `general_entrepreneur`, `investor`, `operator`, `community_builder`
- `relationship_tags`: Array of relationship potential tags
  - Options: `competitor_candidate`, `collaborator_candidate`, `helper_expert`, `ally_candidate`, `investor_candidate`, `investee_candidate`, `mentor_candidate`, `mentee_candidate`
- `topics_detected`: Array of detected topics
- `wealth_tier`: Wealth classification
  - Options: `high_net_worth`, `upper_mid`, `early_stage_or_emerging`, `unknown`
- `potential_tier`: Growth potential classification
  - Options: `high_potential`, `medium_potential`, `low_potential`

### Scoring Fields (0-100)

- `business_alignment_score`: Keyword and topic overlap
- `technical_synergy_score`: Technical skills alignment
- `audience_score`: Follower/subscriber count score
- `wealth_potential_score`: Based on wealth tier
- `openness_score`: Receptiveness to collaboration
- `overall_score`: Weighted composite score
  - Formula: (business_alignment × 25%) + (technical_synergy × 20%) + (audience × 15%) + (wealth_potential × 15%) + (openness × 25%)

### Flags

- `openness_tag`: Collaboration openness indicator
  - Options: `open`, `neutral`, `closed`, `unknown`
- `high_net_worth_flag`: Boolean flag for high net worth
- `high_potential_flag`: Boolean flag for high potential

### Content & Metadata

- `last_content_sample`: Recent content snippet
- `last_content_date`: Date of last content
- `data_source_run_id`: Apify run ID for traceability
- `created_at`: Profile creation timestamp
- `updated_at`: Profile update timestamp

## Supabase Setup

If you want to save results to Supabase, follow these steps:

### 1. Create the Database Table

Run the SQL script in `scripts/setup-supabase.sql` in your Supabase SQL editor:

```sql
CREATE TABLE prospect_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  -- ... (see scripts/setup-supabase.sql for full schema)
  UNIQUE(platform, profile_url)
);
```

### 2. Get Your Credentials

- **Supabase URL**: Found in Project Settings → API → Project URL
- **Supabase Key**: Found in Project Settings → API → service_role key (keep this secret!)

### 3. Configure the Actor

Add your Supabase credentials to the Actor input:

- `supabaseUrl`: Your project URL
- `supabaseKey`: Your service role key

## Example Usage

### Basic Search

```json
{
  "keywords": ["AI automation", "Supabase"],
  "includePlatforms": ["linkedin", "x", "youtube"],
  "countryFilter": "United Kingdom",
  "maxResults": 100,
  "minOverallScore": 60
}
```

### With Supabase Integration

```json
{
  "keywords": ["SaaS", "bootstrapped", "founder"],
  "includePlatforms": ["x", "reddit", "medium"],
  "countryFilter": "United Kingdom",
  "maxResults": 200,
  "minOverallScore": 50,
  "supabaseUrl": "https://xxxxx.supabase.co",
  "supabaseKey": "your-service-role-key"
}
```

## Use Cases

1. **Find Potential Co-Founders**: Search for technical builders or complementary entrepreneurs
2. **Identify Investors**: Discover angel investors and VCs interested in your domain
3. **Build Partnerships**: Find collaborators with complementary skills
4. **Seek Mentorship**: Identify experienced founders willing to help
5. **Discover Talent**: Find potential hires or contractors

## Platform Notes

### LinkedIn

- Requires LinkedIn API credentials for full functionality
- Rate limited to 20 requests/minute

### X/Twitter

- Requires Twitter API v2 bearer token
- Set via `TWITTER_BEARER_TOKEN` environment variable

### YouTube

- Requires YouTube Data API v3 key
- Set via `YOUTUBE_API_KEY` environment variable

### Reddit

- Uses public Reddit API (no authentication required)
- Searches relevant subreddits

### Medium

- Web scraping (no official API)
- May be rate limited

### Web

- Requires Google Custom Search API or SerpAPI
- Set via `SEARCH_API_KEY` and `SEARCH_ENGINE_ID` environment variables

## Performance

- **Memory**: 2048 MB recommended
- **Timeout**: 3600 seconds (1 hour) for large searches
- **Concurrency**: Searches platforms in parallel for faster results

## Error Handling

- **Graceful Degradation**: Platform failures don't stop the entire Actor
- **Retry Logic**: Automatic retries with exponential backoff for transient failures
- **Partial Results**: Returns successfully processed profiles even if some platforms fail

## Support

For issues or questions, please contact the Actor maintainer.

## License

ISC
