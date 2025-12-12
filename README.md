# ProspectMatcherUK - Question-Seeking Lead Finder

An Apify Actor that finds high-intent prospects actively asking questions about property, finance, accounting, and budgeting across multiple platforms. Perfect for accountants, financial advisors, and property consultants looking for clients ready to hire.

## 🎯 Key Features

- **Question-Seeking Mode**: Finds people actively asking "how do I", "need help with", "can anyone recommend" questions
- **Intent Scoring**: Scores prospects by intent, decision stage, and help-seeking behavior (0-100)
- **Multi-Platform Search**: Searches across X/Twitter, YouTube comments, Reddit, LinkedIn, Medium, and web
- **Reddit Integration**: No API key required! Searches 10 UK-focused subreddits including r/UKPersonalFinance
- **Intelligent Classification**: Automatically tags profiles with role types and relationship potential
- **Multi-Dimensional Scoring**: Ranks prospects using business alignment, technical synergy, audience, wealth potential, openness, question quality, intent, and decision stage
- **Dual Storage**: Saves results to both Apify datasets and Supabase for easy UI integration
- **Smart Filtering**: Prioritizes question askers and high-intent prospects

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

- **questionSeekingMode** (boolean): Enable question-seeking mode to find people actively asking questions

  - Default: `true`
  - Recommended for high-intent prospects

- **includeComments** (boolean): Extract and analyze YouTube comments for questions

  - Default: `true`
  - Uses more API quota but finds engaged prospects

- **targetSubreddits** (array): Specific subreddits to search (Reddit only)

  - Default: UK-focused list (UKPersonalFinance, UKProperty, etc.)
  - Leave empty to use default list

- **supabaseUrl** (string): Your Supabase project URL

  - Example: `https://xxxxx.supabase.co`
  - Leave empty to only save to Apify dataset

- **supabaseKey** (string): Your Supabase service role key

  - Required if `supabaseUrl` is provided

- **twitterBearerToken** (string): Twitter API v2 Bearer Token

  - Get from https://developer.twitter.com/
  - Optional (Reddit requires no API key!)

- **youtubeApiKey** (string): YouTube Data API v3 key

  - Get from https://console.cloud.google.com/apis/credentials
  - Optional

- **googleSearchApiKey** (string): Google Custom Search API key

  - Get from https://console.cloud.google.com/apis/credentials
  - Optional (for web adapter)

- **googleSearchEngineId** (string): Custom Search Engine ID
  - Get from https://programmablesearchengine.google.com/
  - Optional (for web adapter)

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
- `question_quality_score`: Quality of question asked (if any)
- `intent_score`: Purchase/hiring intent level
- `decision_stage_score`: How close to making a decision
- `help_seeking_score`: Actively seeking professional help
- `overall_score`: Weighted composite score
  - Formula: (business_alignment × 20%) + (technical_synergy × 15%) + (audience × 10%) + (wealth_potential × 10%) + (openness × 20%) + (question_quality × 10%) + (intent × 15%) + (decision_stage × 10%)
  - Boosts: +10 for high intent (>80), +15 for actively seeking professional

### Question Metadata (when questionSeekingMode enabled)

- `question_text`: The actual question asked
- `question_source`: Where the question was found (twitter, youtube_comment, reddit_post)
- `question_date`: When the question was posted
- `question_type`: Type of question (advice, recommendation, how_to, comparison)
- `decision_stage`: Decision stage (research, comparison, ready, actively_seeking_professional)
- `urgency_indicators`: Array of urgency signals found (e.g., "ASAP", "urgent", "soon")
- `budget_indicators`: Array of budget mentions (e.g., "£500", "budget around")
- `professional_seeking_indicators`: Array of professional-seeking phrases (e.g., "hire accountant", "looking for")

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

### Question-Seeking Mode (Recommended!)

Find people actively asking questions about property, finance, and accounting:

```json
{
  "keywords": ["property", "accounting", "tax advice", "finance", "budgeting"],
  "includePlatforms": ["reddit"],
  "countryFilter": "United Kingdom",
  "maxResults": 100,
  "minOverallScore": 50,
  "questionSeekingMode": true
}
```

**Why Reddit?** No API key required, high-quality questions, detailed posts with budgets/timelines, no rate limits!

### Multi-Platform Search

```json
{
  "keywords": ["property investment", "rental property", "landlord"],
  "includePlatforms": ["x", "youtube", "reddit"],
  "countryFilter": "United Kingdom",
  "maxResults": 200,
  "minOverallScore": 60,
  "questionSeekingMode": true,
  "includeComments": true,
  "twitterBearerToken": "your_twitter_token",
  "youtubeApiKey": "your_youtube_key"
}
```

### With Supabase Integration

```json
{
  "keywords": ["property accounting", "landlord tax", "rental property"],
  "includePlatforms": ["reddit"],
  "countryFilter": "United Kingdom",
  "maxResults": 100,
  "minOverallScore": 50,
  "questionSeekingMode": true,
  "supabaseUrl": "https://xxxxx.supabase.co",
  "supabaseKey": "your-service-role-key"
}
```

## Use Cases

### For Accountants & Financial Advisors

1. **Find Property Investors**: People asking about rental property accounting, landlord tax
2. **Identify New Business Owners**: Entrepreneurs asking about business accounting, VAT registration
3. **Discover High-Intent Prospects**: People actively seeking professional help (decision_stage = "actively_seeking_professional")

### For Property Consultants

1. **First-Time Landlords**: People asking "how do I" questions about rental properties
2. **Property Portfolio Builders**: Investors asking about scaling, tax planning
3. **Buy-to-Let Investors**: Questions about financing, property management

### General Use Cases

1. **Find Potential Co-Founders**: Search for technical builders or complementary entrepreneurs
2. **Identify Investors**: Discover angel investors and VCs interested in your domain
3. **Build Partnerships**: Find collaborators with complementary skills
4. **Seek Mentorship**: Identify experienced founders willing to help
5. **Discover Talent**: Find potential hires or contractors

## Platform Notes

### Reddit ⭐ (BEST for Question-Seeking!)

- **No API key required!** Uses public JSON API
- Searches 10 UK-focused subreddits: r/UKPersonalFinance, r/UKProperty, r/UKInvesting, etc.
- High-quality, detailed questions with budgets and timelines
- No rate limits (60 requests/minute with 1-second delay)
- **Typical intent score: 80-95**

### X/Twitter

- Requires Twitter API v2 bearer token (get from https://developer.twitter.com/)
- Question-focused search queries
- Real-time questions with high urgency
- Rate limited (450 requests per 15 minutes)
- Automatic retry with exponential backoff (1min, 2min, 4min)
- **Typical intent score: 60-80**

### YouTube

- Requires YouTube Data API v3 key (get from Google Cloud Console)
- Analyzes video comments for questions
- Engaged audience asking specific questions
- Daily quota limit (10,000 units/day)
- Set `includeComments: false` to save quota
- **Typical intent score: 70-85**

### LinkedIn

- Requires LinkedIn API credentials for full functionality
- Rate limited to 20 requests/minute
- Good for professional networking

### Medium

- Web scraping (no official API)
- May be rate limited
- Good for content creators

### Web

- Requires Google Custom Search API
- General web search across domains

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
