# Troubleshooting Guide

## Common Issues and Solutions

### 1. Twitter Rate Limit (429 Error)

**Error:**

```
[X] Error searching: Twitter API error: 429 - {"title":"Too Many Requests"...}
```

**Cause:** Twitter API has rate limits (450 requests per 15 minutes for search)

**Solutions:**

**A) Use Reddit Instead (Recommended!)**
Reddit has no rate limits and better quality prospects:

```json
{
  "includePlatforms": ["reddit"],
  "keywords": ["property", "accounting", "tax advice"]
}
```

**B) Wait and Retry**
The actor now has automatic retry logic:

- Waits 1 minute, then 2 minutes, then 4 minutes
- Retries up to 3 times
- Just re-run the actor after 15 minutes

**C) Reduce Search Frequency**

- Run actor less frequently (once per hour instead of every 15 min)
- Reduce maxResults to get fewer tweets

**D) Use Multiple Platforms**
Spread the load across platforms:

```json
{
  "includePlatforms": ["reddit", "youtube", "x"],
  "maxResults": 100
}
```

### 2. Missing API Credentials

**Error:**

```
API credentials status: {
  twitterBearerToken: '✗ missing',
  youtubeApiKey: '✗ missing'
}
```

**Cause:** API keys not provided in Apify input

**Solution:**

**In Apify Console:**

1. Go to your actor
2. Click "Run" or "Try it"
3. Scroll to input form
4. Fill in API credential fields:
   - Twitter/X Bearer Token
   - YouTube API Key
   - Google Custom Search API Key (optional)
   - Google Search Engine ID (optional)

**Via API/SDK:**

```javascript
{
  "keywords": ["property"],
  "includePlatforms": ["x", "youtube"],
  "twitterBearerToken": "your_token_here",
  "youtubeApiKey": "your_key_here"
}
```

**Note:** Reddit requires NO API key! 🎉

### 3. No Profiles Found

**Error:**

```
Found 0 raw profiles
No profiles found. Exiting.
```

**Possible Causes:**

**A) Rate Limited**

- Check logs for 429 errors
- Solution: Use Reddit or wait 15 minutes

**B) Keywords Too Specific**

- Try broader keywords
- Bad: "property investment tax planning for landlords in Manchester"
- Good: "property", "accounting", "tax advice"

**C) Wrong Country Filter**

- Check spelling: "United Kingdom" not "UK"
- Or use "all" to search globally

**D) No API Keys for Selected Platforms**

- Twitter/YouTube need API keys
- Reddit doesn't!

**Quick Fix:**

```json
{
  "keywords": ["property", "finance", "accounting"],
  "includePlatforms": ["reddit"],
  "countryFilter": "United Kingdom",
  "maxResults": 50
}
```

### 4. Low Quality Results

**Issue:** Getting profiles but they're not relevant

**Solutions:**

**A) Use Question-Seeking Mode** (enabled by default)

```json
{
  "questionSeekingMode": true,
  "includeComments": true
}
```

**B) Increase Minimum Score**

```json
{
  "minOverallScore": 70
}
```

**C) Better Keywords**

```json
{
  "keywords": [
    "property investment",
    "rental property accounting",
    "landlord tax",
    "property portfolio",
    "buy to let"
  ]
}
```

**D) Target Specific Subreddits**

```json
{
  "targetSubreddits": ["UKPersonalFinance", "UKProperty", "UKLandlords"]
}
```

### 5. YouTube Quota Exceeded

**Error:**

```
YouTube API error: 403 - quotaExceeded
```

**Cause:** YouTube API has daily quota (10,000 units/day)

**Solutions:**

**A) Disable Comments** (saves quota)

```json
{
  "includeComments": false
}
```

**B) Use Reddit Instead**
Reddit has unlimited requests and better quality!

**C) Request Quota Increase**

- Go to Google Cloud Console
- Request quota increase for YouTube Data API v3

### 6. Supabase Connection Failed

**Error:**

```
Error saving to Supabase: ...
```

**Cause:** Invalid Supabase credentials or network issue

**Solutions:**

**A) Check Credentials**

- Verify Supabase URL format: `https://xxxxx.supabase.co`
- Use service_role key, not anon key

**B) Skip Supabase** (data still saved to Apify dataset)

```json
{
  "supabaseUrl": null,
  "supabaseKey": null
}
```

**C) Check Supabase Table**
Run the setup script:

```sql
-- See scripts/setup-supabase.sql
```

### 7. Actor Timeout

**Error:**

```
Actor run timed out after 3600 seconds
```

**Cause:** Too many results or slow API responses

**Solutions:**

**A) Reduce maxResults**

```json
{
  "maxResults": 50
}
```

**B) Use Fewer Platforms**

```json
{
  "includePlatforms": ["reddit"]
}
```

**C) Increase Timeout** (in Apify settings)

- Go to actor settings
- Increase timeout to 7200 seconds (2 hours)

## Best Practices

### For Best Results:

1. **Start with Reddit**

   ```json
   {
     "includePlatforms": ["reddit"],
     "keywords": ["property", "accounting"],
     "maxResults": 100
   }
   ```

2. **Use Specific Keywords**

   - Good: "property investment", "rental accounting", "landlord tax"
   - Bad: "business", "money", "help"

3. **Enable Question-Seeking**

   ```json
   {
     "questionSeekingMode": true
   }
   ```

4. **Set Reasonable Limits**

   ```json
   {
     "maxResults": 50,
     "minOverallScore": 60
   }
   ```

5. **Run Regularly**
   - Schedule: Once per day
   - Time: Off-peak hours (avoid rate limits)

### Platform Recommendations:

**Best:** Reddit (r/UKPersonalFinance)

- No API key required
- High-quality questions
- Detailed posts with budgets/timelines
- No rate limits

**Good:** YouTube Comments

- Engaged audience
- Specific questions
- Requires API key
- Has quota limits

**Okay:** Twitter/X

- Real-time questions
- High urgency
- Requires API key
- Rate limited (429 errors common)

## Getting Help

### Check Logs:

1. Look for specific error messages
2. Check API credential status
3. Verify platform-specific errors

### Debug Mode:

Add more logging:

```javascript
console.log("Debug info:", {
  keywords,
  platforms,
  apiKeys: {
    twitter: !!twitterBearerToken,
    youtube: !!youtubeApiKey,
  },
});
```

### Contact Support:

- GitHub Issues: [your-repo]/issues
- Email: [your-email]
- Include: Error logs, input configuration, platform used

## Quick Fixes Cheat Sheet

| Issue              | Quick Fix                      |
| ------------------ | ------------------------------ |
| Rate limited (429) | Use Reddit instead             |
| No API keys        | Use Reddit (no key needed)     |
| No results         | Broader keywords + Reddit      |
| Low quality        | Increase minOverallScore to 70 |
| Timeout            | Reduce maxResults to 50        |
| YouTube quota      | Disable comments or use Reddit |
| Supabase error     | Set supabaseUrl to null        |

## Recommended Configuration

For best results with minimal issues:

```json
{
  "keywords": [
    "property investment",
    "rental property",
    "landlord",
    "accounting",
    "tax advice"
  ],
  "includePlatforms": ["reddit"],
  "countryFilter": "United Kingdom",
  "maxResults": 100,
  "minOverallScore": 60,
  "onlyNewProfiles": true,
  "questionSeekingMode": true,
  "targetSubreddits": ["UKPersonalFinance", "UKProperty", "UKLandlords"]
}
```

## Quick Test Configuration

For immediate testing without API keys:

```json
{
  "keywords": ["cashflow", "property", "accounting"],
  "includePlatforms": ["reddit"],
  "countryFilter": "United Kingdom",
  "maxResults": 50,
  "questionSeekingMode": true
}
```

This configuration:

- ✅ No API keys required
- ✅ No rate limits
- ✅ High-quality prospects
- ✅ Fast execution
- ✅ Reliable results
