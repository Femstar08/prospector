// Development runner for ProspectMatcherUK
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Load .env file

// Mock Apify environment for local development
process.env.APIFY_LOCAL_STORAGE_DIR = './apify_storage';
process.env.APIFY_TOKEN = 'dev-token';

// Create storage directories
const storageDir = './apify_storage';
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Mock Apify.getInput() to read from test-input.json
const originalApify = require('apify');
const originalGetInput = originalApify.Actor.getInput;

originalApify.Actor.getInput = async () => {
  const inputPath = path.join(__dirname, 'test-input.json');
  if (fs.existsSync(inputPath)) {
    const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    
    // Add environment variables to input data
    inputData.twitterBearerToken = process.env.TWITTER_BEARER_TOKEN;
    inputData.youtubeApiKey = process.env.YOUTUBE_API_KEY;
    inputData.googleSearchApiKey = process.env.SEARCH_API_KEY;
    inputData.googleSearchEngineId = process.env.SEARCH_ENGINE_ID;
    inputData.redditClientId = process.env.REDDIT_CLIENT_ID;
    inputData.redditClientSecret = process.env.REDDIT_CLIENT_SECRET;
    inputData.supabaseUrl = process.env.SUPABASE_URL;
    inputData.supabaseKey = process.env.SUPABASE_KEY;
    
    console.log('📋 Using test input:', JSON.stringify(inputData, null, 2));
    return inputData;
  }
  return null;
};

// Mock dataset operations
originalApify.Actor.pushData = async (data) => {
  console.log('💾 Dataset output:', JSON.stringify(data, null, 2));
  return true;
};

// Start the actor
console.log('🚀 Starting ProspectMatcherUK in development mode...\n');
require('./src/main.js');