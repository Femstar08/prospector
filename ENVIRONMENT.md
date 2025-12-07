# Environment Variables Guide

This document explains all environment variables used by the ProspectMatcherUK Actor.

## Quick Start

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Fill in the API keys you need based on which platforms you want to search

3. Run the Actor locally or deploy to Apify

## Required Variables

### Supabase Configuration

These can be provided either as environment variables OR through the Actor input form.

| Variable       | Description                    | Where to Get                                           |
| -------------- | ------------------------------ | ------------------------------------------------------ |
| `SUPABASE_URL` | Your Supabase project URL      | Supabase Dashboard → Settings → API → Project URL      |
| `SUPABASE_KEY` | Your Supabase service role key | Supabase Dashboard → Settings → API → service_role key |

**Note:** If not provided, the Actor will only save to Apify datasets (Supabase storage will be skipped).

## Optional Platform API Keys

### Twitter/X API

| Variable               | Description                 | Where to Get                                               |
| ---------------------- | --------------------------- | ---------------------------------------------------------- |
| `TWITTER_BEARER_TOKEN` | Twitter API v2 Bearer Token | [Twitter Developer Portal](https://developer.twitter.com/) |

**Required for:** X/Twitter profile searches
**Without it:** X/Twitter adapter will be skipped

### YouTube Data API

| Variable          | Description             | Where to Get                                                              |
| ----------------- | ----------------------- | ------------------------------------------------------------------------- |
| `YOUTUBE_API_KEY` | YouTube Data API v3 Key | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |

**Required for:** YouTube channel searches
**Without it:** YouTube adapter will be skipped

### Google Custom Search API

| Variable           | Description                  | Where to Get                                                               |
| ------------------ | ---------------------------- | -------------------------------------------------------------------------- |
| `SEARCH_API_KEY`   | Google Custom Search API Key | [Google Cloud Console](https://console.cloud.google.com/apis/credentials)  |
| `SEARCH_ENGINE_ID` | Custom Search Engine ID      | [Programmable Search Engine](https://programmablesearchengine.google.com/) |

**Required for:** General web searches
**Without it:** Web adapter will be skipped

## Platform-Specific Notes

### LinkedIn

- **No API key required** (uses public profile URLs)
- Rate limited to 20 requests/minute
- Full access requires LinkedIn authentication (not yet implemented)

### Reddit

- **No API key required** (uses public Reddit API)
- Searches relevant subreddits for UK entrepreneurs

### Medium

- **No API key required** (uses web scraping)
- No official API available

## Apify Platform Variables

When running on Apify, these are automatically set:

| Variable                           | Description          | Auto-Set |
| ---------------------------------- | -------------------- | -------- |
| `APIFY_TOKEN`                      | Your Apify API token | ✓        |
| `APIFY_ACTOR_RUN_ID`               | Current run ID       | ✓        |
| `APIFY_DEFAULT_DATASET_ID`         | Default dataset ID   | ✓        |
| `APIFY_DEFAULT_KEY_VALUE_STORE_ID` | Default KV store ID  | ✓        |

## Setting Environment Variables

### Local Development

Create a `.env` file in the project root:

```bash
# .env
TWITTER_BEARER_TOKEN=your_token_here
YOUTUBE_API_KEY=your_key_here
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_service_role_key
```

### Apify Platform

1. Go to your Actor in Apify Console
2. Click "Settings" → "Environment variables"
3. Add each variable as a secret (for API keys) or regular variable

### Docker

Pass environment variables when running:

```bash
docker run -e TWITTER_BEARER_TOKEN=xxx -e YOUTUBE_API_KEY=yyy prospect-matcher-uk
```

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use secrets for API keys** - Mark as secret in Apify Console
3. **Rotate keys regularly** - Especially if exposed
4. **Use service role keys** - For Supabase (not anon keys)
5. **Restrict API key permissions** - Only grant necessary scopes

## Getting API Keys

### Twitter API v2

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new App (or use existing)
3. Go to "Keys and tokens"
4. Generate Bearer Token
5. Copy and save securely

### YouTube Data API v3

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable "YouTube Data API v3"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the API key

### Google Custom Search

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Create a new search engine
3. Configure to search the entire web
4. Copy the Search Engine ID
5. Go to [Google Cloud Console](https://console.cloud.google.com/)
6. Enable "Custom Search API"
7. Create API credentials
8. Copy the API key

### Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (or create new)
3. Go to Settings → API
4. Copy "Project URL" (for `SUPABASE_URL`)
5. Copy "service_role" key (for `SUPABASE_KEY`)
6. Run the SQL script from `scripts/setup-supabase.sql`

## Troubleshooting

### "Platform adapter skipped" messages

**Cause:** Missing API key for that platform
**Solution:** Add the required environment variable or remove platform from `includePlatforms` input

### "Supabase client not initialized"

**Cause:** Missing Supabase credentials
**Solution:** Add `SUPABASE_URL` and `SUPABASE_KEY` or provide via Actor input

### "Rate limit exceeded"

**Cause:** Too many requests to platform API
**Solution:**

- Wait for rate limit to reset
- Reduce `maxResults` in Actor input
- Spread searches across multiple runs

### "Authentication failed"

**Cause:** Invalid or expired API key
**Solution:**

- Verify API key is correct
- Check if key has necessary permissions
- Regenerate key if expired

## Cost Considerations

### Free Tiers

- **Twitter API:** 500,000 tweets/month (Free tier)
- **YouTube API:** 10,000 units/day (Free tier)
- **Google Custom Search:** 100 queries/day (Free tier)
- **Supabase:** 500 MB database, 1 GB bandwidth (Free tier)

### Paid Plans

Consider upgrading if you need:

- More than 100 web searches/day
- More than 10,000 YouTube API calls/day
- Higher Twitter API limits
- Larger Supabase database

## Support

For issues with:

- **Actor functionality:** Open an issue on GitHub
- **API keys:** Contact the respective platform support
- **Apify platform:** Contact Apify support
