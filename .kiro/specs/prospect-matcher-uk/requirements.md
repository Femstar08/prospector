# Requirements Document

## Introduction

The ProspectMatcherUK system is an Apify Actor that discovers, classifies, and scores potential business partners and allies across multiple platforms for UK-based entrepreneurs. The system automatically tags profiles with role classifications, relationship potential, wealth indicators, and collaboration openness to enable strategic partnership decisions.

## Glossary

- **Actor**: An Apify automation script that performs web scraping and data processing tasks
- **Profile**: A public user account on a social or professional platform
- **Role Tag**: A classification label indicating the professional persona of a profile (e.g., founder, technical_builder)
- **Relationship Tag**: A classification label indicating strategic partnership potential (e.g., collaborator_candidate, investor_candidate)
- **Wealth Tier**: An estimated classification of financial capacity based on public signals
- **Potential Tier**: An estimated classification of growth trajectory and activity level
- **Openness Score**: A numerical measure (0-100) of a profile's receptiveness to collaboration
- **Overall Score**: A weighted composite score combining multiple sub-scores to rank profiles
- **ICP**: Ideal Customer Profile - the target audience characteristics
- **NLP**: Natural Language Processing - computational analysis of text

## Requirements

### Requirement 1

**User Story:** As an entrepreneur, I want to search for prospects across multiple platforms using keywords, so that I can discover potential partners beyond a single network.

#### Acceptance Criteria

1. WHEN the Actor receives a keywords array input THEN the system SHALL search for profiles matching those keywords across all enabled platforms
2. WHEN the Actor receives an includePlatforms array THEN the system SHALL limit searches to only the specified platforms (linkedin, x, youtube, reddit, medium, web)
3. WHEN the Actor receives a countryFilter input THEN the system SHALL restrict results to profiles from that country using location fields or text-based detection
4. WHEN the Actor receives a maxResults input THEN the system SHALL limit the total number of profiles returned to that value
5. THE Actor SHALL support searches on LinkedIn, X/Twitter, YouTube, Reddit, Medium, and general web sources

### Requirement 2

**User Story:** As an entrepreneur, I want profiles automatically tagged with role classifications, so that I can quickly identify founders, builders, marketers, and investors.

#### Acceptance Criteria

1. WHEN a profile contains job title or bio keywords "founder", "co-founder", "owner", "CEO", "managing director", "principal", "partner", or "entrepreneur" THEN the system SHALL assign the role tag "founder"
2. WHEN a profile mentions "developer", "engineer", "data scientist", "ML", "AI engineer", "full-stack", "CTO", "built X", "open-source", or contains GitHub links THEN the system SHALL assign the role tag "technical_builder"
3. WHEN a profile mentions "content creator", "YouTuber", "newsletter", "audience", "community", "personal brand", "influencer" or has follower counts exceeding a threshold THEN the system SHALL assign the role tag "marketer_with_audience"
4. WHEN a profile mentions "consultant", "freelancer", "coach", "business owner", "side-hustler", "bootstrapped", "agency owner", or "SME" THEN the system SHALL assign the role tag "general_entrepreneur"
5. WHEN a profile contains keywords "angel investor", "VC", "venture partner", "LP", "invests in", "backing founders", or "portfolio" THEN the system SHALL assign the role tag "investor"
6. WHEN a profile contains keywords "COO", "operations", "delivery lead", "service manager", or "product operations" THEN the system SHALL assign the role tag "operator"
7. WHEN a profile contains keywords "community lead", "community manager", "host of meetup", or mentions discord/Slack/FB group ownership THEN the system SHALL assign the role tag "community_builder"
8. THE system SHALL allow profiles to receive multiple role tags simultaneously

### Requirement 3

**User Story:** As an entrepreneur, I want profiles tagged with relationship potential classifications, so that I can identify competitors, collaborators, mentors, and investment opportunities.

#### Acceptance Criteria

1. WHEN a profile has a very similar service mix and overlapping ICP to the user THEN the system SHALL assign the relationship tag "competitor_candidate"
2. WHEN a profile has overlapping domain but complementary skills THEN the system SHALL assign the relationship tag "collaborator_candidate"
3. WHEN a profile is senior or experienced and their content suggests mentoring, teaching, or sharing playbooks THEN the system SHALL assign the relationship tag "helper_expert"
4. WHEN a profile uses partnership-oriented language such as "partner with", "collab", "joint venture", "co-create", or "open to partnerships" THEN the system SHALL assign the relationship tag "ally_candidate"
5. WHEN a profile is tagged as investor and mentions "seed", "pre-seed", "angel", or investment focus areas matching user domains THEN the system SHALL assign the relationship tag "investor_candidate"
6. WHEN a profile is a founder of an early-stage company or solo builder with relevant focus and fewer than 10 employees or "pre-seed/bootstrapped" status THEN the system SHALL assign the relationship tag "investee_candidate"
7. WHEN a profile has a senior role, long experience, and publishes advice content THEN the system SHALL assign the relationship tag "mentor_candidate"
8. WHEN a profile is junior or mid-level but highly active with ambitious language THEN the system SHALL assign the relationship tag "mentee_candidate"

### Requirement 4

**User Story:** As an entrepreneur, I want profiles classified by wealth tier and potential tier, so that I can prioritize high-value partnership opportunities.

#### Acceptance Criteria

1. WHEN a profile is an angel investor, VC, fund partner, founder of a funded company, has large exits, has 50+ staff, or is C-suite at a large firm THEN the system SHALL assign wealth_tier "high_net_worth"
2. WHEN a profile is a director, senior partner, multi-location owner, works at a 10-50 staff startup, or has a personal brand with over 50k followers THEN the system SHALL assign wealth_tier "upper_mid"
3. WHEN a profile is a solo founder, small agency owner, pre-seed stage, or side-hustler THEN the system SHALL assign wealth_tier "early_stage_or_emerging"
4. WHEN a profile has insufficient information for wealth classification THEN the system SHALL assign wealth_tier "unknown"
5. WHEN a profile posts consistently, builds products, discusses scaling or growth, or has strong overlap with user themes THEN the system SHALL assign potential_tier "high_potential"
6. WHEN a profile has some activity in relevant domains but not frequent THEN the system SHALL assign potential_tier "medium_potential"
7. WHEN a profile has sparse information, irrelevant topics, or no clear builder or entrepreneur signals THEN the system SHALL assign potential_tier "low_potential"

### Requirement 5

**User Story:** As an entrepreneur, I want profiles scored on openness to collaboration, so that I can focus outreach on receptive individuals.

#### Acceptance Criteria

1. WHEN a profile bio or pinned posts contain "open to collaboration", "let's connect", "DM me", "looking to partner", or "seeking co-founder" THEN the system SHALL assign openness_tag "open" and openness_score above 70
2. WHEN a profile shows no explicit collaboration signal but is an active networker with podcasts, events, or existing collaborations THEN the system SHALL assign openness_tag "neutral" and openness_score between 40-70
3. WHEN a profile explicitly states not being open or is a corporate employee with no outward-facing activity THEN the system SHALL assign openness_tag "closed" and openness_score below 40
4. WHEN a profile has too little data to determine openness THEN the system SHALL assign openness_tag "unknown"
5. THE system SHALL calculate openness_score as a numerical value from 0 to 100 based on text analysis

### Requirement 6

**User Story:** As an entrepreneur, I want profiles scored across multiple dimensions with a combined overall score, so that I can rank prospects by strategic fit.

#### Acceptance Criteria

1. THE system SHALL calculate business_alignment_score from 0 to 100 based on keyword overlap and service similarity
2. THE system SHALL calculate technical_synergy_score from 0 to 100 based on complementary technical skills
3. THE system SHALL calculate audience_score from 0 to 100 based on follower counts and content reach
4. THE system SHALL calculate wealth_potential_score from 0 to 100 based on wealth_tier classification
5. THE system SHALL calculate overall_score using weighted components: business_alignment_score (25%), technical_synergy_score (20%), audience_score (15%), wealth_potential_score (15%), openness_score (25%)
6. WHEN the Actor receives a minOverallScore input THEN the system SHALL filter out profiles with overall_score below that threshold
7. WHEN a profile is tagged as investor_candidate or helper_expert THEN the system SHALL retain the profile regardless of overall_score

### Requirement 7

**User Story:** As an entrepreneur, I want comprehensive profile data extracted from each platform, so that I have context for partnership decisions.

#### Acceptance Criteria

1. THE system SHALL extract name, profile URL, username or handle, location, headline or title, bio, company name, company size hints, and follower or subscriber counts for each profile
2. THE system SHALL extract a recent content sample with date when available
3. THE system SHALL detect and store topics such as AI, automation, Supabase, Firebase, app building, consulting, accounting, property, personal branding, content creation, coaching, and career support
4. THE system SHALL store the data source run ID for traceability
5. THE system SHALL record created_at and updated_at timestamps for each profile

### Requirement 8

**User Story:** As an entrepreneur, I want profiles deduplicated and stored in Supabase, so that I have a clean dataset for my UI.

#### Acceptance Criteria

1. THE system SHALL deduplicate profiles by platform and profile_url before saving
2. WHEN onlyNewProfiles input is true THEN the system SHALL update existing records instead of creating duplicates matched on platform and profile_url
3. THE system SHALL save all profile data to an Apify dataset
4. THE system SHALL save all profile data to a Supabase table named prospect_profiles
5. THE system SHALL maintain idempotency when updating existing profiles

### Requirement 9

**User Story:** As an entrepreneur, I want the Actor to use NLP for topic extraction, so that profiles are accurately categorized by domain expertise.

#### Acceptance Criteria

1. THE system SHALL use natural language processing to analyze profile bios and content samples
2. THE system SHALL extract topics from a predefined list of relevant domains
3. THE system SHALL store detected topics in a topics_detected array field
4. THE system SHALL use topic detection to inform business_alignment_score calculation
5. THE system SHALL handle text in English language for NLP processing

### Requirement 10

**User Story:** As an entrepreneur, I want to find people actively asking questions about property, finance, accounting, and budgeting, so that I can identify high-intent prospects seeking professional help.

#### Acceptance Criteria

1. WHEN searching Twitter/X THEN the system SHALL prioritize tweets containing question patterns such as "how do I", "how to", "need help with", "can anyone recommend", "advice on", "looking for", "should I"
2. WHEN searching Reddit THEN the system SHALL target UK-focused subreddits including r/UKPersonalFinance, r/UKProperty, r/UKInvesting, r/Accounting, r/SmallBusiness, r/Entrepreneur, r/LegalAdviceUK, r/AskUK, r/HousingUK
3. WHEN searching Reddit THEN the system SHALL prioritize posts with question flairs or question marks in titles
4. WHEN searching YouTube THEN the system SHALL analyze comments on finance and property videos for questions and extract commenter profiles
5. WHEN analyzing content THEN the system SHALL detect question indicators including question marks, question words (how, what, where, when, why, should, can, could, would), and help-seeking phrases (need help, looking for, can anyone, advice on, recommend, suggestion, tips, guidance)
6. THE system SHALL support searching Quora for UK-specific finance and property questions
7. THE system SHALL support searching Facebook Groups for UK property investment and finance questions where API access permits

### Requirement 11

**User Story:** As an entrepreneur, I want prospects scored by question quality and intent, so that I can prioritize people ready to engage professional services.

#### Acceptance Criteria

1. THE system SHALL calculate question_quality_score from 0 to 100 based on question specificity, detail length, and clarity
2. WHEN content contains urgency indicators such as "urgent", "ASAP", "soon", "quickly", "this week", "this month" THEN the system SHALL increase intent_score by 20 points
3. WHEN content mentions budget amounts, "budget", "afford", "willing to pay", or "looking to spend" THEN the system SHALL increase intent_score by 15 points
4. WHEN content mentions specific timelines such as "by next month", "in Q1", "before tax year" THEN the system SHALL increase intent_score by 15 points
5. WHEN content contains professional-seeking language such as "hire", "looking for", "need a", "recommend a", "find an accountant", "find a financial advisor" THEN the system SHALL increase intent_score by 25 points
6. WHEN content is longer than 100 characters and contains a question mark THEN the system SHALL increase intent_score by 15 points
7. THE system SHALL calculate decision_stage_score with values: research phase (30), comparison phase (60), ready to act (90), actively seeking professional (100)
8. THE system SHALL calculate help_seeking_score from 0 to 100 based on frequency of asking questions, engagement with answers, follow-up questions, and mentions of failed attempts

### Requirement 12

**User Story:** As an entrepreneur, I want enhanced Reddit integration, so that I can discover prospects in UK finance and property communities.

#### Acceptance Criteria

1. THE system SHALL search Reddit using the public Reddit API without requiring authentication for public data
2. WHEN searching Reddit THEN the system SHALL query multiple UK-focused subreddits in parallel
3. WHEN extracting Reddit posts THEN the system SHALL capture post title, post body, author username, subreddit, post score, comment count, and post creation date
4. WHEN a Reddit post contains question patterns THEN the system SHALL extract the author's profile information
5. THE system SHALL prioritize Reddit posts with low comment counts indicating unanswered questions
6. THE system SHALL extract Reddit user profiles including username, karma score, account age, and recent post history when available
7. THE system SHALL rate-limit Reddit API requests to comply with Reddit's public API guidelines (maximum 60 requests per minute)

### Requirement 13

**User Story:** As an entrepreneur, I want YouTube comment analysis, so that I can find people asking questions on finance and property videos.

#### Acceptance Criteria

1. WHEN searching YouTube THEN the system SHALL identify popular UK finance, property investment, accounting, and budgeting channels
2. THE system SHALL extract comments from relevant videos using YouTube Data API v3
3. WHEN analyzing comments THEN the system SHALL detect question patterns and help-seeking language
4. WHEN a comment contains a question THEN the system SHALL extract the commenter's channel profile
5. THE system SHALL prioritize commenters who ask multiple questions across different videos
6. THE system SHALL respect YouTube API quota limits and implement appropriate rate limiting
7. THE system SHALL extract comment text, commenter name, commenter channel ID, comment likes, and comment date

### Requirement 14

**User Story:** As an entrepreneur, I want Quora integration, so that I can find people asking UK-specific finance and property questions.

#### Acceptance Criteria

1. THE system SHALL search Quora topics including "Property Investment UK", "UK Personal Finance", "Accounting and Bookkeeping", "Small Business Finance UK"
2. WHEN searching Quora THEN the system SHALL prioritize recent questions over older questions
3. THE system SHALL extract question askers (not answerers) as primary prospects
4. WHEN extracting Quora profiles THEN the system SHALL capture username, profile URL, question text, question date, and topic tags
5. THE system SHALL filter Quora results for UK-specific content using location indicators and topic tags
6. THE system SHALL implement web scraping for Quora if no official API access is available
7. THE system SHALL respect Quora's robots.txt and rate limiting guidelines

### Requirement 15

**User Story:** As an entrepreneur, I want enhanced overall scoring that incorporates question quality and intent, so that high-intent prospects are prioritized.

#### Acceptance Criteria

1. THE system SHALL update overall_score calculation to include question_quality_score (10%), intent_score (15%), and decision_stage_score (10%)
2. THE system SHALL adjust existing score weights: business_alignment_score (20%), technical_synergy_score (15%), audience_score (10%), wealth_potential_score (10%), openness_score (20%)
3. WHEN a profile has intent_score above 80 THEN the system SHALL boost overall_score by 10 points
4. WHEN a profile has decision_stage_score of 100 (actively seeking professional) THEN the system SHALL boost overall_score by 15 points
5. WHEN a profile asks questions but has low engagement THEN the system SHALL not penalize overall_score
6. THE system SHALL maintain the rule that investor_candidate and helper_expert profiles are retained regardless of overall_score
7. THE system SHALL add question_asker profiles to the retention rule alongside investor_candidate and helper_expert
