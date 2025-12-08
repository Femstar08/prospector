# Implementation Notes - API Integrations

## What Was Implemented

### YouTube Data API v3 Integration ✅

**Search Functionality:**

- Searches for channels matching keywords
- Supports region-based filtering (UK = GB, US, CA, etc.)
- Returns up to 50 channels per search (API limit)
- Fetches detailed channel statistics

**Data Extracted:**

- Channel name and custom URL
- Subscriber count
- Video count
- Channel description (bio)
- Profile image
- Country/location
- Channel creation date

**API Endpoints Used:**

- `GET /youtube/v3/search` - Search for channels
- `GET /youtube/v3/channels` - Get detailed channel info

### Twitter/X API v2 Integration ✅

**Search Functionality:**

- Searches recent tweets matching keywords
- Extracts unique users from tweet results
- Filters by location/country
- Returns user profiles with engagement metrics

**Data Extracted:**

- Username and display name
- Bio/description
- Location
- Follower count
- Following count
- Tweet count
- Profile image
- Verified status

**API Endpoints Used:**

- `GET /2/tweets/search/recent` - Search tweets and expand users
- `GET /2/users/by/username/:username` - Get user by username

## How It Works

### Flow:

1. **User provides API keys** through Apify input form
2. **Main.js extracts credentials** and passes to AdapterFactory
3. **AdapterFactory initializes adapters** with credentials
4. **Adapters make real API calls** to YouTube/Twitter
5. **Data is transformed** to unified profile format
6. **Profiles are classified and scored** by existing logic
7. **Results saved** to Apify dataset (and optionally Supabase)

### Example Profile Output:

```javascript
{
  platform: 'youtube',
  profile_url: 'https://www.youtube.com/channel/UC...',
  username_or_handle: '@channelname',
  display_name: 'Channel Name',
  bio: 'Channel description...',
  location: 'GB',
  follower_count: 50000,
  post_count: 250,
  profile_image_url: 'https://...',
  // ... plus classification and scoring fields
}
```

## API Rate Limits & Quotas

### YouTube Data API v3

- **Quota:** 10,000 units per day (default)
- **Search cost:** 100 units per request
- **Channels cost:** 1 unit per request
- **Estimated searches per day:** ~50-100 searches

### Twitter API v2

- **Free tier:** 500,000 tweets/month
- **Rate limit:** 450 requests per 15 minutes
- **Search limit:** 100 tweets per request
- **User lookup:** 900 requests per 15 minutes

## Testing Your Implementation

### 1. Add API Keys in Apify Console

Go to your actor → Input → Fill in:

- `youtubeApiKey`: Your YouTube Data API v3 key
- `twitterBearerToken`: Your Twitter Bearer Token

### 2. Run with Test Keywords

```json
{
  "keywords": ["property", "real estate"],
  "includePlatforms": ["youtube", "x"],
  "countryFilter": "United Kingdom",
  "maxResults": 20
}
```

### 3. Check Logs

You should see:

```
[YouTube] API key status: configured
[YouTube] Calling YouTube Data API v3...
[YouTube] Found 15 channels
[YouTube] Successfully extracted 15 channel profiles

[X] Bearer token status: configured
[X] Calling Twitter API v2...
[X] Found 25 unique users from tweets
[X] After country filter: 18 users
[X] Successfully extracted 18 user profiles
```

## Error Handling

Both adapters include:

- ✅ API key validation before making requests
- ✅ HTTP error handling with descriptive messages
- ✅ Graceful fallback (returns empty array on error)
- ✅ Detailed error logging
- ✅ Continue processing other platforms if one fails

## Next Steps

### Recommended Enhancements:

1. **LinkedIn Adapter** - Implement LinkedIn API (requires OAuth)
2. **Web/Google Search** - Implement Custom Search API
3. **Rate Limiting** - Add retry logic with exponential backoff
4. **Caching** - Cache API responses to reduce quota usage
5. **Pagination** - Support fetching more than API limits
6. **Recent Content** - Fetch latest tweets/videos for better classification

### Optional Improvements:

- Add request timeout handling
- Implement request queuing for rate limit management
- Add metrics tracking (API calls, quota usage)
- Support multiple API keys for rotation
- Add webhook notifications for quota warnings

## Troubleshooting

### "API key not configured"

- Ensure you're entering the key in the Apify input form
- Check that the key field name matches exactly
- Verify the key isn't expired

### "API error: 403"

- YouTube: Check API is enabled in Google Cloud Console
- Twitter: Verify Bearer Token has correct permissions
- Check quota hasn't been exceeded

### "Found 0 profiles"

- Try broader keywords
- Check country filter isn't too restrictive
- Verify API keys are valid and have quota remaining

### "API error: 401"

- API key is invalid or expired
- Regenerate key from provider console
- Ensure no extra spaces in the key

## Resources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [Twitter API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [Apify Actor Documentation](https://docs.apify.com/actors)
