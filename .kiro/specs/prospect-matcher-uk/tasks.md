# Implementation Plan

- [x] 1. Set up project structure and dependencies

  - Create Apify Actor project structure with src/, .actor/, and test/ directories
  - Initialize package.json with dependencies: apify, crawlee, @supabase/supabase-js, compromise, fast-check, jest
  - Create Dockerfile based on apify/actor-node:18
  - Set up .actor/actor.json with input schema
  - Configure jest.config.js for testing
  - _Requirements: All_

- [x] 2. Implement base adapter architecture

  - Create src/adapters/base-adapter.js with abstract interface
  - Define RawProfile interface and validation methods
  - Implement location normalization utility
  - _Requirements: 1.1, 1.2, 7.1_

- [ ]\* 2.1 Write property test for platform search restriction

  - **Property 1: Platform search restriction**
  - **Validates: Requirements 1.2**

- [x] 3. Create adapter factory and platform routing

  - Implement src/adapters/adapter-factory.js
  - Add platform detection and adapter instantiation logic
  - Create configuration object for adapter settings
  - _Requirements: 1.2, 1.5_

- [x] 4. Implement LinkedIn adapter

  - Create src/adapters/linkedin-adapter.js extending BasePlatformAdapter
  - Implement search() method with keyword and country filtering
  - Implement extractProfile() method for LinkedIn profile pages
  - Add rate limiting (20 requests/minute)
  - _Requirements: 1.1, 1.3, 1.5, 7.1_

- [x] 5. Implement X/Twitter adapter

  - Create src/adapters/x-adapter.js extending BasePlatformAdapter
  - Implement search() using Twitter API v2
  - Extract user profiles and recent tweets
  - _Requirements: 1.1, 1.3, 1.5, 7.1_

- [x] 6. Implement YouTube adapter

  - Create src/adapters/youtube-adapter.js extending BasePlatformAdapter
  - Implement search() using YouTube Data API v3
  - Extract channel information and statistics
  - _Requirements: 1.1, 1.3, 1.5, 7.1_

- [x] 7. Implement Reddit adapter

  - Create src/adapters/reddit-adapter.js extending BasePlatformAdapter
  - Implement search() using Reddit API
  - Extract user profiles from post authors
  - _Requirements: 1.1, 1.3, 1.5, 7.1_

- [x] 8. Implement Medium adapter

  - Create src/adapters/medium-adapter.js extending BasePlatformAdapter
  - Implement web scraping for Medium author pages
  - Extract author information and follower counts
  - _Requirements: 1.1, 1.3, 1.5, 7.1_

- [x] 9. Implement Web adapter

  - Create src/adapters/web-adapter.js extending BasePlatformAdapter
  - Implement search() using Google Custom Search API or SerpAPI
  - Extract information from personal websites and public profiles
  - _Requirements: 1.1, 1.3, 1.5, 7.1_

- [ ]\* 9.1 Write property test for country filtering

  - **Property 2: Country filtering**
  - **Validates: Requirements 1.3**

- [ ]\* 9.2 Write property test for result count limit

  - **Property 3: Result count limit**
  - **Validates: Requirements 1.4**

- [ ]\* 9.3 Write property test for required field extraction

  - **Property 14: Required field extraction**
  - **Validates: Requirements 7.1**

- [x] 10. Implement NLP classification engine

  - Create src/classification/classifier.js
  - Implement classifyRoles() with keyword detection for all role types
  - Implement detectTopics() using compromise library
  - Implement analyzeOpenness() for collaboration signals
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 5.1, 5.2, 5.3, 5.4, 5.5, 7.3, 9.1, 9.2, 9.3_

- [ ]\* 10.1 Write property test for role tag keyword detection

  - **Property 4: Role tag keyword detection**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

- [ ]\* 10.2 Write property test for multiple role tags

  - **Property 5: Multiple role tags allowed**
  - **Validates: Requirements 2.8**

- [ ]\* 10.3 Write property test for openness tag and score consistency

  - **Property 11: Openness tag and score consistency**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ]\* 10.4 Write property test for topic detection from predefined list

  - **Property 16: Topic detection from predefined list**
  - **Validates: Requirements 9.2**

- [ ]\* 10.5 Write property test for topics array type

  - **Property 17: Topics array type**
  - **Validates: Requirements 9.3**

- [x] 11. Implement relationship tag classifier

  - Create src/classification/relationship-classifier.js
  - Implement classifyRelationships() for all relationship tag types
  - Add logic for competitor, collaborator, helper, ally, investor, investee, mentor, mentee detection
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ]\* 11.1 Write property test for relationship tag assignment

  - **Property 6: Relationship tag assignment**
  - **Validates: Requirements 3.3, 3.4, 3.7, 3.8**

- [x] 12. Implement wealth and potential classifier

  - Create src/classification/wealth-classifier.js
  - Implement classifyWealthTier() with heuristics for high_net_worth, upper_mid, early_stage_or_emerging, unknown
  - Implement classifyPotentialTier() with heuristics for high_potential, medium_potential, low_potential
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 13. Implement multi-dimensional scoring system

  - Create src/scoring/scorer.js
  - Implement calculateBusinessAlignment() based on keyword overlap
  - Implement calculateTechnicalSynergy() based on complementary skills
  - Implement calculateAudienceScore() based on follower counts
  - Implement calculateWealthPotentialScore() based on wealth_tier
  - Implement calculateOverallScore() with weighted formula (25/20/15/15/25)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]\* 13.1 Write property test for score range constraints

  - **Property 8: Score range constraints**
  - **Validates: Requirements 5.5, 6.1, 6.2, 6.3, 6.4**

- [ ]\* 13.2 Write property test for overall score calculation

  - **Property 9: Overall score calculation**
  - **Validates: Requirements 6.5**

- [x] 14. Implement filtering and deduplication logic

  - Create src/utils/filter.js
  - Implement filterByScore() with minOverallScore threshold
  - Add exception logic for investor_candidate and helper_expert tags
  - Implement deduplicateProfiles() by platform and profile_url
  - _Requirements: 6.6, 6.7, 8.1_

- [ ]\* 14.1 Write property test for minimum score filtering

  - **Property 10: Minimum score filtering**
  - **Validates: Requirements 6.6**

- [ ]\* 14.2 Write property test for investor exception to score filtering

  - **Property 7: Investor exception to score filtering**
  - **Validates: Requirements 6.7**

- [ ]\* 14.3 Write property test for profile deduplication

  - **Property 12: Profile deduplication**
  - **Validates: Requirements 8.1**

- [x] 15. Implement Supabase storage client

  - Create src/storage/supabase-client.js
  - Implement connection initialization with URL and API key
  - Implement upsertProfile() with conflict resolution on (platform, profile_url)
  - Implement profileExists() check
  - Add batch upsert functionality (50 profiles per batch)
  - _Requirements: 8.2, 8.4, 8.5_

- [ ]\* 15.1 Write property test for idempotent updates

  - **Property 13: Idempotent updates**
  - **Validates: Requirements 8.2, 8.5**

- [x] 16. Implement storage manager

  - Create src/storage/storage-manager.js
  - Implement saveToApify() using Actor.pushData()
  - Implement saveToSupabase() with error handling
  - Coordinate dual storage persistence
  - _Requirements: 8.3, 8.4_

- [ ]\* 16.1 Write property test for dual storage persistence

  - **Property 18: Dual storage persistence**
  - **Validates: Requirements 8.3, 8.4**

- [ ]\* 16.2 Write property test for metadata presence

  - **Property 15: Metadata presence**
  - **Validates: Requirements 7.4, 7.5**

- [x] 17. Implement main controller and orchestration

  - Create src/main.js with Actor.main() wrapper
  - Implement validateInput() for input schema validation
  - Implement orchestratePlatformSearches() with parallel execution
  - Wire together: adapters → classification → scoring → filtering → storage
  - Add comprehensive error handling and logging
  - _Requirements: All_

- [x] 18. Implement error handling and retry logic

  - Add exponential backoff for rate limiting (1s, 2s, 4s, 8s, max 5 retries)
  - Add network timeout handling (30s timeout, 3 retries)
  - Add graceful degradation for platform failures
  - Add detailed error logging with context
  - _Requirements: All_

- [x] 19. Create input schema definition

  - Create .actor/INPUT_SCHEMA.json with all input fields
  - Define keywords, includePlatforms, countryFilter, maxResults, minOverallScore, onlyNewProfiles
  - Add Supabase configuration fields
  - Set appropriate defaults and validation rules
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.6, 8.2_

- [x] 20. Create Actor documentation

  - Create README.md with Actor description and usage instructions
  - Document all input parameters with examples
  - Document output schema with field descriptions
  - Add setup instructions for Supabase integration
  - Include example runs and use cases
  - _Requirements: All_

- [x] 21. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 22. Create Supabase table setup script

  - Create scripts/setup-supabase.sql with table creation DDL
  - Add indexes for performance (overall_score, role_tags, relationship_tags, country, wealth_tier)
  - Add unique constraint on (platform, profile_url)
  - Document setup instructions in README
  - _Requirements: 8.4_

- [ ]\* 23. Write integration tests for end-to-end Actor execution

  - Test full Actor run with small input (5 profiles max)
  - Test multi-platform coordination
  - Test Supabase integration with test instance
  - _Requirements: All_

- [x] 24. Final checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Question-Seeking Enhancement

- [ ] 25. Implement question detection utility

  - Create src/utils/question-detector.js
  - Implement isQuestion() with regex patterns for question indicators
  - Implement extractQuestionType() to classify question types (how-to, recommendation, advice, help)
  - Implement detectUrgency() to find urgency indicators (urgent, ASAP, soon, quickly)
  - Implement detectBudget() to find budget mentions (£, budget, afford, willing to pay)
  - Implement detectTimeline() to find timeline mentions (this month, by Q1, before tax year)
  - Implement detectProfessionalSeeking() to find hiring intent (hire, looking for, need a, recommend a)
  - _Requirements: 10.5, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ]\* 25.1 Write property test for question detection patterns

  - **Property 19: Question detection patterns**
  - **Validates: Requirements 10.5**

- [ ]\* 25.2 Write property test for urgency detection

  - **Property 20: Urgency detection**
  - **Validates: Requirements 11.2**

- [ ] 26. Implement intent scoring engine

  - Create src/scoring/intent-scorer.js
  - Implement calculateQuestionQualityScore() based on specificity and detail
  - Implement calculateIntentScore() with urgency, budget, timeline, and professional-seeking factors
  - Implement calculateDecisionStageScore() to classify research/comparison/ready/seeking stages
  - Implement calculateHelpSeekingScore() based on question frequency and engagement
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [ ]\* 26.1 Write property test for intent score calculation

  - **Property 21: Intent score calculation**
  - **Validates: Requirements 11.2, 11.3, 11.4, 11.5, 11.6**

- [ ]\* 26.2 Write property test for decision stage classification

  - **Property 22: Decision stage classification**
  - **Validates: Requirements 11.7**

- [ ] 27. Enhance Twitter/X adapter with question search

  - Update src/adapters/x-adapter.js search() method
  - Implement buildQuestionQuery() to construct question-focused search queries
  - Add question pattern keywords: "how do I", "how to", "need help with", "can anyone recommend", "advice on", "looking for", "should I"
  - Filter tweets for question marks and question patterns
  - Extract question text and store in profile metadata
  - _Requirements: 10.1, 10.5_

- [ ]\* 27.1 Write property test for Twitter question query building

  - **Property 23: Twitter question query building**
  - **Validates: Requirements 10.1**

- [ ] 28. Enhance Reddit adapter with subreddit targeting

  - Update src/adapters/reddit-adapter.js search() method
  - Add UK-focused subreddit list: r/UKPersonalFinance, r/UKProperty, r/UKInvesting, r/Accounting, r/SmallBusiness, r/Entrepreneur, r/LegalAdviceUK, r/AskUK, r/HousingUK
  - Implement searchSubreddit() to query individual subreddits
  - Filter for posts with question flairs or question marks in titles
  - Prioritize posts with low comment counts (unanswered questions)
  - Extract post title, body, author, subreddit, score, comment count, creation date
  - Implement rate limiting (60 requests per minute)
  - _Requirements: 10.2, 10.3, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ]\* 28.1 Write property test for Reddit subreddit targeting

  - **Property 24: Reddit subreddit targeting**
  - **Validates: Requirements 10.2, 12.2**

- [ ]\* 28.2 Write property test for Reddit question detection

  - **Property 25: Reddit question detection**
  - **Validates: Requirements 10.3, 12.4**

- [ ] 29. Implement YouTube comment analysis

  - Update src/adapters/youtube-adapter.js with comment extraction
  - Implement findRelevantChannels() to identify UK finance/property channels
  - Implement extractComments() using YouTube Data API v3 commentThreads endpoint
  - Filter comments for question patterns
  - Extract commenter channel profiles
  - Implement getCommenterProfile() to fetch channel details
  - Track commenters who ask multiple questions
  - Respect YouTube API quota limits
  - _Requirements: 10.4, 10.5, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [ ]\* 29.1 Write property test for YouTube comment question detection

  - **Property 26: YouTube comment question detection**
  - **Validates: Requirements 10.4, 13.3**

- [ ] 30. Implement Quora adapter

  - Create src/adapters/quora-adapter.js extending BasePlatformAdapter
  - Implement search() for Quora topics: "Property Investment UK", "UK Personal Finance", "Accounting and Bookkeeping", "Small Business Finance UK"
  - Implement web scraping for Quora question pages
  - Extract question askers (not answerers)
  - Filter for UK-specific content using location and topic tags
  - Prioritize recent questions
  - Respect robots.txt and rate limiting
  - _Requirements: 10.6, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

- [ ]\* 30.1 Write property test for Quora question asker extraction

  - **Property 27: Quora question asker extraction**
  - **Validates: Requirements 14.3**

- [ ] 31. Add Facebook Groups adapter (optional)

  - Create src/adapters/facebook-adapter.js extending BasePlatformAdapter
  - Implement search() for UK property investment and finance groups
  - Extract question posts from public groups
  - Filter for question patterns
  - Handle Facebook API authentication and permissions
  - _Requirements: 10.7_

- [ ] 32. Update scoring system with question metrics

  - Update src/scoring/scorer.js calculateOverallScore() method
  - Add question_quality_score (10% weight)
  - Add intent_score (15% weight)
  - Add decision_stage_score (10% weight)
  - Adjust existing weights: business_alignment_score (20%), technical_synergy_score (15%), audience_score (10%), wealth_potential_score (10%), openness_score (20%)
  - Implement score boost for high intent (intent_score > 80: +10 points)
  - Implement score boost for actively seeking professional (decision_stage_score = 100: +15 points)
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ]\* 32.1 Write property test for updated overall score calculation

  - **Property 28: Updated overall score calculation**
  - **Validates: Requirements 15.1, 15.2**

- [ ]\* 32.2 Write property test for intent score boost

  - **Property 29: Intent score boost**
  - **Validates: Requirements 15.3, 15.4**

- [ ] 33. Update filtering logic for question askers

  - Update src/utils/filter.js filterByScore() method
  - Add question_asker to retention rule alongside investor_candidate and helper_expert
  - Ensure question_asker profiles are retained regardless of overall_score
  - _Requirements: 15.6, 15.7_

- [ ]\* 33.1 Write property test for question asker retention

  - **Property 30: Question asker retention**
  - **Validates: Requirements 15.7**

- [ ] 34. Update input schema for question-seeking mode

  - Update .actor/INPUT_SCHEMA.json
  - Add questionSeekingMode boolean field (default: true)
  - Add targetSubreddits array field for custom Reddit subreddit list
  - Add includeComments boolean field for YouTube comment analysis
  - Add includeQuora boolean field for Quora integration
  - _Requirements: 10.1, 10.2, 10.4, 10.6_

- [ ] 35. Update storage schema for question metadata

  - Update scripts/setup-supabase.sql
  - Add question_text text field
  - Add question_quality_score integer field
  - Add intent_score integer field
  - Add decision_stage_score integer field
  - Add help_seeking_score integer field
  - Add question_source text field (tweet, reddit_post, youtube_comment, quora_question)
  - Add question_date timestamp field
  - Add indexes for new score fields
  - _Requirements: 11.1, 11.7, 11.8_

- [ ] 36. Update documentation for question-seeking features

  - Update README.md with question-seeking strategy explanation
  - Document new input parameters
  - Add examples of question-seeking searches
  - Document new output fields
  - Add troubleshooting guide for Reddit/Quora/YouTube comment access
  - _Requirements: All Phase 2_

- [ ] 37. Checkpoint - Test question-seeking features

  - Test Twitter question search with sample queries
  - Test Reddit integration with r/UKPersonalFinance
  - Test YouTube comment extraction
  - Test Quora integration
  - Test intent scoring with sample questions
  - Verify question asker retention in filtering
  - Ensure all tests pass, ask the user if questions arise.

- [ ]\* 38. Write integration tests for question-seeking workflow

  - Test end-to-end question detection and scoring
  - Test multi-platform question search
  - Test intent score calculation with real examples
  - Test question asker profile retention
  - _Requirements: All Phase 2_

- [ ] 39. Final checkpoint - Phase 2 complete

  - Ensure all Phase 2 tests pass
  - Verify question-seeking features work across all platforms
  - Confirm high-intent prospects are properly prioritized
  - Ask the user if questions arise.
