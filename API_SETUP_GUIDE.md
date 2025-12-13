# API Setup Guide for ProspectMatcherUK

## Overview

The actor now accepts API credentials through the Apify input configuration. You no longer need to set environment variables - just provide the keys when running the actor.

## How to Configure API Keys in Apify

### Option 1: Through the Apify Console (Recommended)

1. Go to your actor in the Apify Console
2. Click "Run" or "Try it"
3. Scroll down to the input configuration form
4. You'll see new fields for API credentials:

   - **Twitter/X Bearer Token**
   - **YouTube API Key**
   - **Google Custom Search API Key**
   - **Google Search Engine ID**
   - **Reddit Client ID** (recommended)
   - **Reddit Client Secret** (recommended)
   - **Supabase URL** (optional)
   - **Supabase API Key** (optional)

5. Fill in the API keys you want to use
6. Click "Start" to run the actor

### Option 2: Through API/SDK

When calling the actor programmatically, include the credentials in the input:

```javascript
const run = await client.actor("your-actor-id").call({
  keywords: ["property", "real estate"],
  includePlatforms: ["linkedin", "x", "youtube"],
  countryFilter: "United Kingdom",
  maxResults: 300,

  // API Credentials
  twitterBearerToken: "your_twitter_bearer_token",
  youtubeApiKey: "your_youtube_api_key",
  googleSearchApiKey: "your_google_search_api_key",
  googleSearchEngineId: "your_search_engine_id",

  // Reddit API (recommended)
  redditClientId: "your_reddit_client_id",
  redditClientSecret: "your_reddit_client_secret",

  // Optional: Supabase
  supabaseUrl: "https://xxxxx.supabase.co",
  supabaseKey: "your_supabase_key",
});
```

## Getting API Keys

### 1. Twitter/X Bearer Token

- Go to https://developer.twitter.com/
- Sign up for a developer account
- Create a new app/project
- Navigate to "Keys and tokens"
- Generate a **Bearer Token**
- Copy and paste into the actor input

### 2. YouTube API Key

- Go to https://console.cloud.google.com/
- Create a new project (or select existing)
- Enable "YouTube Data API v3"
- Go to "Credentials" → "Create Credentials" → "API Key"
- Copy the API key

### 3. Google Custom Search API

- Go to https://console.cloud.google.com/
- Enable "Custom Search API"
- Create an API key (same as YouTube if using same project)
- Go to https://programmablesearchengine.google.com/
- Create a new search engine
- Configure it to search the entire web
- Copy the **Search Engine ID** (cx parameter)

### 4. Reddit API (Recommended)

- Go to https://www.reddit.com/prefs/apps
- Click "Create App" or "Create Another App"
- Choose "script" as the app type
- Fill in name and description (e.g., "ProspectMatcher")
- Set redirect URI to `http://localhost:8080` (required but not used)
- Copy the **Client ID** (under the app name) and **Client Secret**

### 5. Supabase (Optional)

- Go to https://supabase.com/
- Create a new project
- Go to Project Settings → API
- Copy the **Project URL** and **service_role key**

## Security Notes

- All API keys are marked as `isSecret: true` in the input schema
- Apify will encrypt and securely store these credentials
- Keys are never exposed in logs or output
- Each run can use different credentials if needed

## Testing Without API Keys

The actor will still run without API keys, but will return 0 results with informational messages:

- `[X] Note: Twitter API bearer token not configured`
- `[YouTube] Note: YouTube API key not configured`
- `[Web] Note: Google Custom Search API credentials not configured`
- `[Reddit] No API credentials provided, falling back to public API`

## Platform-Specific Notes

### LinkedIn

- Currently uses public profile URLs only
- No API key required for basic functionality
- Rate limited to 20 requests/minute

### Reddit

- **Recommended**: Use Reddit API credentials for better reliability
- **Fallback**: Public Reddit API (no authentication)
- Get credentials from https://www.reddit.com/prefs/apps

### Medium

- No API key required
- Uses web scraping (no official API)

## Next Steps

1. Get your API keys from the providers above
2. Run your actor on Apify
3. Fill in the API credentials in the input form
4. Start the run and monitor the logs

The actor will now successfully search and return profiles from the configured platforms!
