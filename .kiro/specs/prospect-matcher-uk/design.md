# Design Document

## Overview

The ProspectMatcherUK Actor is a multi-platform web scraping and classification system built on the Apify platform. It discovers potential business partners across LinkedIn, X/Twitter, YouTube, Reddit, Medium, and general web sources, then applies sophisticated NLP-based classification to tag profiles with role types, relationship potential, wealth indicators, and collaboration openness. The system uses a multi-dimensional scoring algorithm to rank prospects and stores results in both Apify datasets and Supabase for UI consumption.

The architecture follows the proven adapter pattern, where each platform has a dedicated adapter implementing a common interface, allowing for isolated platform-specific logic while maintaining consistent output schemas.

## Architecture

### High-Level Architecture

```
User Input → Main Controller → Platform Router → Platform Adapters → Data Extractors
                                                                            ↓
                                                                    Raw Profile Data
                                                                            ↓
                                                            NLP Classification Engine
                                                                            ↓
                                                                Multi-Dimensional Scorer
                                                                            ↓
                                                            Deduplication & Filtering
                                                                            ↓
                                                        Storage Layer (Apify + Supabase)
```

### Component Layers

1. **Input Layer**: Validates and normalizes Actor input configuration
2. **Orchestration Layer**: Coordinates platform searches and manages concurrency
3. **Adapter Layer**: Platform-specific scraping logic (LinkedIn, X, YouTube, Reddit, Medium, Web)
4. **Extraction Layer**: Parses HTML/JSON and extracts structured profile data
5. **Classification Layer**: NLP-based tagging and categorization
6. **Scoring Layer**: Multi-dimensional scoring algorithm
7. **Storage Layer**: Deduplication, filtering, and persistence to Apify/Supabase

### Technology Stack

- **Runtime**: Node.js with Apify SDK
- **Scraping**: Crawlee (CheerioCrawler, PlaywrightCrawler)
- **NLP**: natural (Node.js NLP library) or compromise for topic extraction
- **Database**: Supabase (PostgreSQL)
- **Storage**: Apify Key-Value Store and Dataset

## Components and Interfaces

### 1. Main Controller (`src/main.js`)

Entry point for the Actor. Initializes the Apify SDK, validates input, orchestrates platform searches, and coordinates the classification and storage pipeline.

```javascript
interface ActorInput {
  keywords: string[];
  includePlatforms: ('linkedin' | 'x' | 'youtube' | 'reddit' | 'medium' | 'web')[];
  countryFilter: string;
  maxResults: number;
  minOverallScore: number;
  onlyNewProfiles: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
}

interface MainController {
  async run(input: ActorInput): Promise<void>;
  async validateInput(input: ActorInput): Promise<void>;
  async orchestratePlatformSearches(input: ActorInput): Promise<RawProfile[]>;
}
```

### 2. Platform Adapter Factory (`src/adapters/adapter-factory.js`)

Routes requests to the appropriate platform adapter based on the platform identifier.

```javascript
interface AdapterFactory {
  getAdapter(platform: string, config: AdapterConfig): BasePlatformAdapter;
  getSupportedPlatforms(): string[];
}
```

### 3. Base Platform Adapter (`src/adapters/base-adapter.js`)

Abstract base class defining the interface all platform adapters must implement.

```javascript
interface BasePlatformAdapter {
  platformName: string;

  async search(keywords: string[], countryFilter: string, maxResults: number): Promise<RawProfile[]>;
  async extractProfile(url: string): Promise<RawProfile>;
  validateUrl(url: string): boolean;
  normalizeLocation(location: string): string;
}

interface RawProfile {
  name: string;
  platform: string;
  profile_url: string;
  username_or_handle: string;
  location: string;
  headline_or_title: string;
  bio: string;
  company: string;
  company_size_hint: string;
  followers_or_subscribers: number;
  last_content_sample: string;
  last_content_date: string;
}
```

### 4. Platform-Specific Adapters

Each platform has a dedicated adapter extending `BasePlatformAdapter`:

- `LinkedInAdapter` (`src/adapters/linkedin-adapter.js`)
- `XAdapter` (`src/adapters/x-adapter.js`)
- `YouTubeAdapter` (`src/adapters/youtube-adapter.js`)
- `RedditAdapter` (`src/adapters/reddit-adapter.js`)
- `MediumAdapter` (`src/adapters/medium-adapter.js`)
- `WebAdapter` (`src/adapters/web-adapter.js`)

### 5. NLP Classification Engine (`src/classification/classifier.js`)

Analyzes profile text (bio, headline, content) to assign role tags, relationship tags, and detect topics.

```javascript
interface Classifier {
  async classifyRoles(profile: RawProfile): Promise<string[]>;
  async classifyRelationships(profile: RawProfile, userContext: UserContext): Promise<string[]>;
  async detectTopics(text: string): Promise<string[]>;
  async analyzeOpenness(profile: RawProfile): Promise<{ tag: string; score: number }>;
}

interface UserContext {
  keywords: string[];
  services: string[];
  targetICP: string;
}
```

### 6. Wealth & Potential Classifier (`src/classification/wealth-classifier.js`)

Determines wealth tier and potential tier based on profile signals.

```javascript
interface WealthClassifier {
  classifyWealthTier(profile: RawProfile, roleTags: string[]): string;
  classifyPotentialTier(profile: RawProfile, topics: string[]): string;
}
```

### 7. Multi-Dimensional Scorer (`src/scoring/scorer.js`)

Calculates sub-scores and overall score for each profile.

```javascript
interface Scorer {
  calculateBusinessAlignment(
    profile: EnrichedProfile,
    keywords: string[]
  ): number;
  calculateTechnicalSynergy(profile: EnrichedProfile): number;
  calculateAudienceScore(profile: EnrichedProfile): number;
  calculateWealthPotentialScore(wealthTier: string): number;
  calculateOverallScore(subScores: SubScores): number;
}

interface SubScores {
  business_alignment_score: number;
  technical_synergy_score: number;
  audience_score: number;
  wealth_potential_score: number;
  openness_score: number;
}
```

### 8. Storage Manager (`src/storage/storage-manager.js`)

Handles deduplication, filtering, and persistence to Apify and Supabase.

```javascript
interface StorageManager {
  async saveToApify(profiles: EnrichedProfile[]): Promise<void>;
  async saveToSupabase(profiles: EnrichedProfile[]): Promise<void>;
  async deduplicateProfiles(profiles: EnrichedProfile[]): Promise<EnrichedProfile[]>;
  async filterByScore(profiles: EnrichedProfile[], minScore: number): Promise<EnrichedProfile[]>;
}
```

### 9. Supabase Client (`src/storage/supabase-client.js`)

Manages connection and operations with Supabase database.

```javascript
interface SupabaseClient {
  async upsertProfile(profile: EnrichedProfile): Promise<void>;
  async profileExists(platform: string, profileUrl: string): Promise<boolean>;
  async updateProfile(profile: EnrichedProfile): Promise<void>;
}
```

## Data Models

### Input Schema

```json
{
  "title": "ProspectMatcherUK Input",
  "type": "object",
  "schemaVersion": 1,
  "properties": {
    "keywords": {
      "title": "Search Keywords",
      "type": "array",
      "description": "Keywords to search for across platforms",
      "editor": "stringList",
      "default": ["AI automation", "Supabase", "consulting"]
    },
    "includePlatforms": {
      "title": "Platforms to Search",
      "type": "array",
      "description": "Which platforms to include in the search",
      "editor": "select",
      "enum": ["linkedin", "x", "youtube", "reddit", "medium", "web"],
      "default": ["linkedin", "x", "youtube"]
    },
    "countryFilter": {
      "title": "Country Filter",
      "type": "string",
      "description": "Restrict results to this country",
      "editor": "textfield",
      "default": "United Kingdom"
    },
    "maxResults": {
      "title": "Maximum Results",
      "type": "integer",
      "description": "Maximum number of profiles to return",
      "default": 300,
      "minimum": 1
    },
    "minOverallScore": {
      "title": "Minimum Overall Score",
      "type": "integer",
      "description": "Filter out profiles below this score (0-100)",
      "default": 50,
      "minimum": 0,
      "maximum": 100
    },
    "onlyNewProfiles": {
      "title": "Only New Profiles",
      "type": "boolean",
      "description": "Update existing profiles instead of creating duplicates",
      "default": true
    },
    "supabaseUrl": {
      "title": "Supabase URL",
      "type": "string",
      "description": "Your Supabase project URL",
      "editor": "textfield",
      "isSecret": false
    },
    "supabaseKey": {
      "title": "Supabase API Key",
      "type": "string",
      "description": "Your Supabase service role key",
      "editor": "textfield",
      "isSecret": true
    }
  },
  "required": ["keywords", "includePlatforms"]
}
```

### Output Schema (EnrichedProfile)

```typescript
interface EnrichedProfile {
  // Identity fields
  id: string;
  name: string;
  platform: string;
  profile_url: string;
  username_or_handle: string;
  location: string;
  country: string;
  headline_or_title: string;
  bio: string;
  company: string;
  company_size_hint: string;
  followers_or_subscribers: number;

  // Analysis fields
  topics_detected: string[];
  role_tags: string[];
  relationship_tags: string[];
  wealth_tier: string;
  potential_tier: string;

  // Scoring fields
  business_alignment_score: number;
  technical_synergy_score: number;
  audience_score: number;
  wealth_potential_score: number;
  openness_score: number;
  overall_score: number;

  // Flags
  openness_tag: string;
  high_net_worth_flag: boolean;
  high_potential_flag: boolean;

  // Content context
  last_content_sample: string;
  last_content_date: string;

  // Metadata
  data_source_run_id: string;
  created_at: string;
  updated_at: string;
}
```

### Supabase Table Schema

```sql
CREATE TABLE prospect_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

  topics_detected JSONB DEFAULT '[]'::jsonb,
  role_tags JSONB DEFAULT '[]'::jsonb,
  relationship_tags JSONB DEFAULT '[]'::jsonb,
  wealth_tier TEXT,
  potential_tier TEXT,

  business_alignment_score INTEGER CHECK (business_alignment_score >= 0 AND business_alignment_score <= 100),
  technical_synergy_score INTEGER CHECK (technical_synergy_score >= 0 AND technical_synergy_score <= 100),
  audience_score INTEGER CHECK (audience_score >= 0 AND audience_score <= 100),
  wealth_potential_score INTEGER CHECK (wealth_potential_score >= 0 AND wealth_potential_score <= 100),
  openness_score INTEGER CHECK (openness_score >= 0 AND openness_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

  openness_tag TEXT CHECK (openness_tag IN ('open', 'neutral', 'closed', 'unknown')),
  high_net_worth_flag BOOLEAN DEFAULT FALSE,
  high_potential_flag BOOLEAN DEFAULT FALSE,

  last_content_sample TEXT,
  last_content_date TIMESTAMPTZ,

  data_source_run_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(platform, profile_url)
);

CREATE INDEX idx_prospect_profiles_overall_score ON prospect_profiles(overall_score DESC);
CREATE INDEX idx_prospect_profiles_role_tags ON prospect_profiles USING GIN(role_tags);
CREATE INDEX idx_prospect_profiles_relationship_tags ON prospect_profiles USING GIN(relationship_tags);
CREATE INDEX idx_prospect_profiles_country ON prospect_profiles(country);
CREATE INDEX idx_prospect_profiles_wealth_tier ON prospect_profiles(wealth_tier);
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to reduce redundancy:

- Role tagging properties (2.1-2.7) all follow the same pattern: keyword detection → tag assignment. These can be combined into a single comprehensive role tagging property.
- Relationship tagging properties (3.1-3.8) similarly follow a pattern and can be consolidated.
- Score range properties (6.1-6.4) all verify 0-100 bounds and can be combined.
- Wealth and potential tier properties (4.1-4.7) follow classification patterns that can be grouped.

### Core Properties

**Property 1: Platform search restriction**
_For any_ includePlatforms array input, the system should only invoke search operations on the specified platforms and no others.
**Validates: Requirements 1.2**

**Property 2: Country filtering**
_For any_ countryFilter input and any profile in the results, the profile's location or country field should match the specified country.
**Validates: Requirements 1.3**

**Property 3: Result count limit**
_For any_ maxResults input value, the total number of profiles returned should never exceed that value.
**Validates: Requirements 1.4**

**Property 4: Role tag keyword detection**
_For any_ profile containing role-specific keywords (founder, developer, investor, etc.) in bio or title, the system should assign the corresponding role tag(s) from the predefined set.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

**Property 5: Multiple role tags allowed**
_For any_ profile containing keywords from multiple role categories, the system should assign all applicable role tags simultaneously.
**Validates: Requirements 2.8**

**Property 6: Relationship tag assignment**
_For any_ profile with partnership-oriented language, complementary skills, or mentoring signals, the system should assign appropriate relationship tags based on the detected characteristics.
**Validates: Requirements 3.3, 3.4, 3.7, 3.8**

**Property 7: Investor exception to score filtering**
_For any_ profile tagged as investor_candidate or helper_expert, the profile should be retained in results regardless of its overall_score value, even if below minOverallScore.
**Validates: Requirements 6.7**

**Property 8: Score range constraints**
_For any_ profile, all calculated scores (business_alignment_score, technical_synergy_score, audience_score, wealth_potential_score, openness_score, overall_score) should be within the range 0-100 inclusive.
**Validates: Requirements 5.5, 6.1, 6.2, 6.3, 6.4**

**Property 9: Overall score calculation**
_For any_ profile with calculated sub-scores, the overall_score should equal the weighted sum: (business_alignment × 0.25) + (technical_synergy × 0.20) + (audience × 0.15) + (wealth_potential × 0.15) + (openness × 0.25).
**Validates: Requirements 6.5**

**Property 10: Minimum score filtering**
_For any_ minOverallScore input and any non-investor/non-helper profile in results, the profile's overall_score should be greater than or equal to minOverallScore.
**Validates: Requirements 6.6**

**Property 11: Openness tag and score consistency**
_For any_ profile with openness_tag "open", the openness_score should be above 70; for "neutral", between 40-70; for "closed", below 40.
**Validates: Requirements 5.1, 5.2, 5.3**

**Property 12: Profile deduplication**
_For any_ set of profiles with duplicate (platform, profile_url) pairs, only one profile per unique pair should appear in the final saved results.
**Validates: Requirements 8.1**

**Property 13: Idempotent updates**
_For any_ profile, running the Actor twice with onlyNewProfiles=true should result in the same profile data in storage (update, not duplicate).
**Validates: Requirements 8.2, 8.5**

**Property 14: Required field extraction**
_For any_ extracted profile, the output should contain all required fields: name, profile_url, platform, username_or_handle, location, headline_or_title, bio, company, followers_or_subscribers.
**Validates: Requirements 7.1**

**Property 15: Metadata presence**
_For any_ profile, the output should contain data_source_run_id, created_at, and updated_at fields with valid values.
**Validates: Requirements 7.4, 7.5**

**Property 16: Topic detection from predefined list**
_For any_ profile, all topics in the topics_detected array should be from the predefined list of valid topics (AI, automation, Supabase, Firebase, etc.).
**Validates: Requirements 9.2**

**Property 17: Topics array type**
_For any_ profile, the topics_detected field should be an array (possibly empty, but always an array type).
**Validates: Requirements 9.3**

**Property 18: Dual storage persistence**
_For any_ processed profile, the profile should appear in both the Apify dataset and the Supabase prospect_profiles table.
**Validates: Requirements 8.3, 8.4**

## Error Handling

### Input Validation Errors

- **Invalid keywords**: Empty keywords array → throw ValidationError with message "At least one keyword is required"
- **Invalid platforms**: Unknown platform in includePlatforms → throw ValidationError listing valid platforms
- **Invalid score range**: minOverallScore outside 0-100 → throw ValidationError with valid range
- **Missing Supabase credentials**: If Supabase URL/key missing → log warning and skip Supabase storage (continue with Apify only)

### Platform Adapter Errors

- **Rate limiting**: If platform returns 429 → implement exponential backoff (1s, 2s, 4s, 8s) with max 5 retries
- **Authentication failure**: If platform requires auth and fails → log error, skip platform, continue with others
- **Network timeout**: If request exceeds 30s → retry up to 3 times, then skip profile
- **Invalid HTML/JSON**: If parsing fails → log warning with profile URL, skip profile, continue processing

### Classification Errors

- **NLP library failure**: If natural/compromise throws error → log error, assign empty arrays for tags/topics, continue
- **Missing required fields**: If profile lacks bio/headline → use empty string, continue classification with available data
- **Invalid follower count**: If non-numeric → default to 0, log warning

### Storage Errors

- **Apify dataset failure**: If pushData fails → retry 3 times, then throw error (critical failure)
- **Supabase connection failure**: If connection fails → log error, continue with Apify storage only
- **Supabase upsert failure**: If individual upsert fails → log error with profile URL, continue with next profile
- **Duplicate key violation**: If unique constraint violated despite deduplication → log warning, update existing record

### Error Recovery Strategy

1. **Graceful degradation**: Platform failures should not stop the entire Actor
2. **Partial results**: Return successfully processed profiles even if some platforms fail
3. **Detailed logging**: Log all errors with context (profile URL, platform, error message)
4. **Retry logic**: Implement retries for transient failures (network, rate limits)
5. **Fail-fast for critical errors**: Stop execution only for input validation or Apify storage failures

## Testing Strategy

### Unit Testing

The system will use **Jest** as the testing framework for unit tests.

**Unit test coverage areas**:

1. **Input validation**: Test validateInput with valid/invalid inputs
2. **Adapter factory**: Test getAdapter returns correct adapter for each platform
3. **URL validation**: Test each adapter's validateUrl with valid/invalid URLs
4. **Location normalization**: Test normalizeLocation with various location formats
5. **Keyword detection**: Test role/relationship classification with specific keyword examples
6. **Score calculation**: Test individual scoring functions with known inputs
7. **Deduplication logic**: Test deduplicateProfiles with duplicate and unique profiles
8. **Supabase client**: Test upsert operations with mocked Supabase connection

### Property-Based Testing

The system will use **fast-check** as the property-based testing library for JavaScript.

**Configuration**: Each property-based test will run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Property test tagging**: Each property-based test will include a comment explicitly referencing the correctness property from this design document using the format: `// Feature: prospect-matcher-uk, Property {number}: {property_text}`

**Property test coverage**:

1. **Property 1 test**: Generate random platform subsets, verify only those platforms are searched
2. **Property 2 test**: Generate random country filters, verify all results match the country
3. **Property 3 test**: Generate random maxResults values, verify output length ≤ maxResults
4. **Property 4 test**: Generate profiles with random role keywords, verify correct tags assigned
5. **Property 5 test**: Generate profiles with multiple role keywords, verify multiple tags assigned
6. **Property 8 test**: Generate random profiles, verify all scores are in [0, 100]
7. **Property 9 test**: Generate random sub-scores, verify overall_score matches weighted formula
8. **Property 10 test**: Generate random minOverallScore and profiles, verify filtering works
9. **Property 11 test**: Generate profiles with openness keywords, verify tag/score consistency
10. **Property 12 test**: Generate duplicate profiles, verify deduplication works
11. **Property 13 test**: Run Actor twice with same profile, verify idempotency
12. **Property 14 test**: Generate random profiles, verify all required fields present
13. **Property 15 test**: Generate random profiles, verify metadata fields present
14. **Property 16 test**: Generate profiles, verify topics are from predefined list
15. **Property 17 test**: Generate random profiles, verify topics_detected is always an array
16. **Property 18 test**: Process profiles, verify presence in both Apify and Supabase

**Test generators**:

- `arbitraryProfile()`: Generates random profile objects with realistic data
- `arbitraryKeywords()`: Generates random keyword arrays
- `arbitraryPlatformSubset()`: Generates random subsets of valid platforms
- `arbitraryScores()`: Generates random score objects with values in [0, 100]
- `arbitraryRoleKeywords()`: Generates profiles with specific role keywords
- `arbitraryCountry()`: Generates random country names

### Integration Testing

1. **End-to-end Actor run**: Test full Actor execution with small input (5 profiles max)
2. **Platform adapter integration**: Test each adapter against real platform (or mocked responses)
3. **Supabase integration**: Test actual database operations against test Supabase instance
4. **Multi-platform coordination**: Test that multiple platforms can be searched in parallel

### Test Execution Order

1. Run unit tests first (fast feedback)
2. Run property-based tests (comprehensive coverage)
3. Run integration tests last (slower, requires external services)

## Implementation Notes

### Platform-Specific Considerations

**LinkedIn**:

- Requires careful rate limiting (max 20 requests/minute)
- May require authentication for full profile access
- Use public profile URLs when possible

**X/Twitter**:

- Use Twitter API v2 with bearer token
- Search by keywords + location filter
- Extract from user objects and recent tweets

**YouTube**:

- Use YouTube Data API v3
- Search for channels by keywords
- Extract from channel snippets and statistics

**Reddit**:

- Use Reddit API (no auth required for public data)
- Search posts/comments by keywords in relevant subreddits
- Extract user profiles from post authors

**Medium**:

- Scrape public Medium pages (no official API)
- Search by tags and keywords
- Extract from author profile pages

**Web**:

- Use Google Custom Search API or SerpAPI
- Search for "founder + [keyword] + UK"
- Extract from personal websites and LinkedIn public profiles

### NLP Library Choice

Use **compromise** (lightweight, fast) for:

- Topic extraction
- Keyword matching
- Basic text analysis

Fallback to **natural** if more sophisticated NLP needed for:

- Sentiment analysis (for openness detection)
- Entity extraction (for company names)

### Scoring Algorithm Details

**Business Alignment Score**:

```javascript
score = (matchingKeywords / totalKeywords) × 100
+ (topicOverlap / totalTopics) × 100
/ 2
```

**Technical Synergy Score**:

```javascript
score = (complementarySkills / totalSkills) × 100
```

**Audience Score**:

```javascript
if (followers < 1000) score = 20;
else if (followers < 10000) score = 40;
else if (followers < 50000) score = 60;
else if (followers < 100000) score = 80;
else score = 100;
```

**Wealth Potential Score**:

```javascript
if (wealth_tier === "high_net_worth") score = 100;
else if (wealth_tier === "upper_mid") score = 70;
else if (wealth_tier === "early_stage_or_emerging") score = 40;
else score = 20;
```

### Performance Considerations

- **Parallel platform searches**: Use Promise.all() to search platforms concurrently
- **Batch Supabase operations**: Upsert profiles in batches of 50 to reduce round trips
- **Caching**: Cache NLP models and topic lists in memory
- **Streaming**: Process profiles as they're discovered rather than waiting for all platforms
- **Rate limiting**: Implement per-platform rate limiters to avoid bans

### Deployment Configuration

**Dockerfile**:

```dockerfile
FROM apify/actor-node:18

COPY package*.json ./
RUN npm install --production

COPY . ./

CMD npm start
```

**Memory**: 2048 MB (for NLP processing)
**Timeout**: 3600 seconds (1 hour for large searches)
