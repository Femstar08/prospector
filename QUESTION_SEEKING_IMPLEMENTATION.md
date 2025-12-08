# Question-Seeking Implementation - Complete

## ✅ What's Been Implemented

### 1. Question Detection System

**File:** `src/utils/question-detector.js`

Detects and analyzes questions in text:

- Question patterns (how, what, should, can, etc.)
- Help-seeking phrases (need help, looking for, advice on)
- Urgency indicators (urgent, ASAP, soon, this week)
- Budget mentions (£, budget, afford, willing to pay)
- Timeline indicators (this month, by Q1, before tax year)
- Professional-seeking language (hire, looking for, need an accountant)

### 2. Intent Scoring Engine

**File:** `src/scoring/intent-scorer.js`

Calculates four key scores:

- **Question Quality Score (0-100)** - Based on specificity, detail, and clarity
- **Intent Score (0-100)** - Urgency + budget + timeline + professional-seeking
- **Decision Stage Score (0-100)** - Research (30) → Comparison (60) → Ready (90) → Actively Seeking (100)
- **Help-Seeking Score (0-100)** - Frequency, engagement, failed attempts

### 3. Enhanced Twitter/X Adapter

**File:** `src/adapters/x-adapter.js`

Question-focused search:

- Builds queries with question patterns: "how do I", "need help with", "can anyone recommend"
- Adds `?` to search to find questions
- Extracts questions from tweets
- Scores each question for intent
- Adds question metadata to profiles

**New Profile Fields:**

```javascript
{
  question_text: "Looking for an accountant...",
  question_source: "twitter",
  question_date: "2025-12-08T10:00:00Z",
  question_quality_score: 85,
  intent_score: 90,
  decision_stage_score: 100,
  decision_stage: "actively_seeking_professional",
  help_seeking_score: 75,
  question_type: "recommendation"
}
```

### 4. Enhanced YouTube Adapter

**File:** `src/adapters/youtube-adapter.js`

Comment analysis features:

- Searches for relevant finance/property videos
- Extracts comments from videos
- Filters comments for questions
- Scores questions by intent
- Fetches channel profiles for question askers
- Supports both channel search and comment analysis

**Methods Added:**

- `searchVideos()` - Find relevant videos
- `extractCommentsFromVideo()` - Get comments from a video
- `findQuestionAskers()` - Find people asking questions in comments
- `getChannelById()` - Fetch channel details

### 5. Updated Overall Scoring

**File:** `src/scoring/scorer.js`

**New Weights:**

- Business Alignment: 20% (was 25%)
- Technical Synergy: 15% (was 20%)
- Audience: 10% (was 15%)
- Wealth Potential: 10% (was 15%)
- Openness: 20% (was 25%)
- **Question Quality: 10%** (new)
- **Intent: 15%** (new)
- **Decision Stage: 10%** (new)

**Score Boosts:**

- High intent (intent_score > 80): +10 points
- Actively seeking professional (decision_stage_score = 100): +15 points

### 6. Updated Filtering

**File:** `src/utils/filter.js`

**Retention Rules:**

- Investor candidates (always retained)
- Helper experts (always retained)
- **Question askers with intent_score > 0** (new - always retained)

## 🎯 How It Works

### Twitter/X Flow:

1. Build question-focused search query
2. Search recent tweets with question patterns
3. Extract unique users from tweets
4. Find best question from each user's tweets
5. Score question for intent
6. Add question metadata to profile

### YouTube Flow:

1. Search for relevant videos (property, finance, accounting)
2. Extract comments from top videos
3. Filter comments for questions
4. Score each question for intent
5. Get unique commenters (question askers)
6. Fetch channel profiles for top question askers
7. Add question metadata to profiles

### Scoring Flow:

1. Calculate traditional scores (business alignment, technical synergy, etc.)
2. Add question-seeking scores (question quality, intent, decision stage)
3. Calculate weighted overall score
4. Apply boosts for high-intent prospects
5. Filter and retain question askers regardless of score

## 📊 Example Output

```json
{
  "name": "John Smith",
  "platform": "twitter",
  "profile_url": "https://twitter.com/johnsmith",
  "location": "London, UK",
  "bio": "Property investor, looking to expand portfolio",

  "question_text": "Looking for an accountant who specializes in property investment. Any recommendations in London? Need help with tax planning for my rental properties.",
  "question_source": "twitter",
  "question_date": "2025-12-08T09:45:00Z",
  "question_type": "recommendation",
  "decision_stage": "actively_seeking_professional",

  "scores": {
    "question_quality_score": 85,
    "intent_score": 90,
    "decision_stage_score": 100,
    "help_seeking_score": 75,
    "business_alignment_score": 80,
    "technical_synergy_score": 40,
    "audience_score": 50,
    "wealth_potential_score": 70,
    "openness_score": 85,
    "overall_score": 95
  },

  "classification": {
    "role_tags": ["general_entrepreneur", "investor"],
    "relationship_tags": ["investee_candidate"],
    "wealth_tier": "upper_mid",
    "potential_tier": "high_potential"
  }
}
```

## 🚀 Usage

### Enable Question-Seeking Mode:

```javascript
const adapterFactory = new AdapterFactory({
  twitterBearerToken: "your_token",
  youtubeApiKey: "your_key",
  questionSeekingMode: true, // Enable question-focused search
  includeComments: true, // Enable YouTube comment analysis
});
```

### Run Actor:

```json
{
  "keywords": ["property", "accounting", "tax advice", "finance"],
  "includePlatforms": ["x", "youtube"],
  "countryFilter": "United Kingdom",
  "maxResults": 100,
  "minOverallScore": 50
}
```

## 📈 Expected Results

### Before (Generic Search):

- Content creators talking about property
- General finance influencers
- Mixed intent levels
- Hard to prioritize

### After (Question-Seeking):

- **People actively asking questions** about property/finance
- **High-intent prospects** seeking professional help
- **Clear decision stage** (research vs ready to hire)
- **Easy to prioritize** by intent score

## 🎯 High-Value Prospects

The system now identifies:

1. **Actively Seeking Professional** (decision_stage_score = 100)

   - "Looking for an accountant..."
   - "Need to hire a financial advisor..."
   - "Can anyone recommend a property specialist..."

2. **High Intent** (intent_score > 80)

   - Mentions budget
   - Has timeline
   - Shows urgency
   - Specific problem described

3. **Ready to Act** (decision_stage_score = 90)
   - "Ready to start..."
   - "Going to buy property next month..."
   - "Need help before tax year ends..."

## 🔄 Next Steps

### Immediate:

1. ✅ Test with Twitter API key
2. ✅ Test with YouTube API key
3. ✅ Verify question detection works
4. ✅ Check intent scoring accuracy

### Phase 2 (Later):

1. ⏳ Reddit integration (r/UKPersonalFinance)
2. ⏳ Quora integration
3. ⏳ LinkedIn question posts
4. ⏳ Facebook Groups (if API access available)

### Enhancements:

1. ⏳ Historical question tracking
2. ⏳ Response rate analysis
3. ⏳ Competitor mention detection
4. ⏳ Engagement history analysis

## 🐛 Testing

### Test Twitter Search:

```bash
# Should find people asking questions about property/finance
keywords: ["property", "accounting"]
questionSeekingMode: true
```

### Test YouTube Comments:

```bash
# Should find people asking questions in video comments
keywords: ["property investment", "tax advice"]
includeComments: true
```

### Verify Scoring:

- Check that question askers get high overall scores
- Verify boosts are applied correctly
- Confirm retention rules work

## 📝 Notes

- Question-seeking mode is **enabled by default**
- YouTube comment analysis is **enabled by default**
- Question askers are **always retained** regardless of overall_score
- Intent score > 80 gets +10 boost
- Decision stage = 100 gets +15 boost

## 🎉 Impact

This implementation transforms the actor from finding generic content creators to finding **high-intent prospects actively seeking professional services** - exactly what you need for Beacon & Ledger CRM!
