const { Actor } = require('apify');
const AdapterFactory = require('./adapters/adapter-factory');
const Classifier = require('./classification/classifier');
const RelationshipClassifier = require('./classification/relationship-classifier');
const WealthClassifier = require('./classification/wealth-classifier');
const Scorer = require('./scoring/scorer');
const Filter = require('./utils/filter');
const StorageManager = require('./storage/storage-manager');

/**
 * Main Actor entry point
 */
Actor.main(async () => {
  console.log('ProspectMatcherUK Actor starting...');

  // Get input
  const input = await Actor.getInput();
  
  // Validate input
  validateInput(input);
  
  const {
    keywords = [],
    includePlatforms = ['linkedin', 'x', 'youtube'],
    countryFilter = 'United Kingdom',
    maxResults = 300,
    minOverallScore = 50,
    onlyNewProfiles = true,
    supabaseUrl,
    supabaseKey
  } = input;

  console.log('Input configuration:', {
    keywords,
    includePlatforms,
    countryFilter,
    maxResults,
    minOverallScore,
    onlyNewProfiles
  });

  // Initialize components
  const adapterFactory = new AdapterFactory();
  const classifier = new Classifier();
  const relationshipClassifier = new RelationshipClassifier();
  const wealthClassifier = new WealthClassifier();
  const scorer = new Scorer();
  const filter = new Filter();
  const storageManager = new StorageManager({ supabaseUrl, supabaseKey });

  // Get run ID for traceability
  const runId = Actor.getEnv().actorRunId || 'local-run';

  try {
    // Step 1: Search across platforms
    console.log('\n=== Step 1: Searching platforms ===');
    const rawProfiles = await orchestratePlatformSearches(
      adapterFactory,
      includePlatforms,
      keywords,
      countryFilter,
      maxResults
    );
    
    console.log(`Found ${rawProfiles.length} raw profiles`);

    if (rawProfiles.length === 0) {
      console.log('No profiles found. Exiting.');
      return;
    }

    // Step 2: Classify and enrich profiles
    console.log('\n=== Step 2: Classifying and enriching profiles ===');
    const enrichedProfiles = [];
    
    for (const rawProfile of rawProfiles) {
      try {
        const enriched = await enrichProfile(
          rawProfile,
          classifier,
          relationshipClassifier,
          wealthClassifier,
          scorer,
          keywords,
          runId
        );
        enrichedProfiles.push(enriched);
      } catch (error) {
        console.error(`Error enriching profile ${rawProfile.profile_url}:`, error.message);
        // Continue with next profile
      }
    }

    console.log(`Enriched ${enrichedProfiles.length} profiles`);

    // Step 3: Filter and deduplicate
    console.log('\n=== Step 3: Filtering and deduplicating ===');
    const filteredProfiles = filter.applyFilters(enrichedProfiles, {
      minOverallScore,
      maxResults
    });

    console.log(`After filtering: ${filteredProfiles.length} profiles`);

    // Step 4: Save to storage
    console.log('\n=== Step 4: Saving to storage ===');
    await storageManager.saveProfiles(filteredProfiles);

    console.log('\n=== Actor completed successfully ===');
    console.log(`Total profiles saved: ${filteredProfiles.length}`);

  } catch (error) {
    console.error('Actor failed:', error);
    throw error;
  }
});

/**
 * Validate input configuration
 */
function validateInput(input) {
  if (!input) {
    throw new Error('Input is required');
  }

  if (!input.keywords || input.keywords.length === 0) {
    throw new Error('At least one keyword is required');
  }

  if (input.includePlatforms && input.includePlatforms.length > 0) {
    const validPlatforms = ['linkedin', 'x', 'youtube', 'reddit', 'medium', 'web'];
    for (const platform of input.includePlatforms) {
      if (!validPlatforms.includes(platform.toLowerCase())) {
        throw new Error(`Invalid platform: ${platform}. Valid platforms: ${validPlatforms.join(', ')}`);
      }
    }
  }

  if (input.minOverallScore !== undefined) {
    if (input.minOverallScore < 0 || input.minOverallScore > 100) {
      throw new Error('minOverallScore must be between 0 and 100');
    }
  }
}

/**
 * Orchestrate searches across multiple platforms
 */
async function orchestratePlatformSearches(adapterFactory, platforms, keywords, countryFilter, maxResults) {
  const allProfiles = [];
  const resultsPerPlatform = Math.ceil(maxResults / platforms.length);

  // Search platforms in parallel
  const searchPromises = platforms.map(async (platform) => {
    try {
      console.log(`Searching ${platform}...`);
      const adapter = adapterFactory.getAdapter(platform);
      const profiles = await adapter.search(keywords, countryFilter, resultsPerPlatform);
      console.log(`${platform}: found ${profiles.length} profiles`);
      return profiles;
    } catch (error) {
      console.error(`Error searching ${platform}:`, error.message);
      return []; // Continue with other platforms
    }
  });

  const results = await Promise.all(searchPromises);
  
  // Flatten results
  for (const platformProfiles of results) {
    allProfiles.push(...platformProfiles);
  }

  return allProfiles;
}

/**
 * Enrich a profile with classification and scoring
 */
async function enrichProfile(rawProfile, classifier, relationshipClassifier, wealthClassifier, scorer, keywords, runId) {
  // Classify roles
  const roleTags = await classifier.classifyRoles(rawProfile);
  
  // Detect topics
  const topics = await classifier.detectTopics(`${rawProfile.bio} ${rawProfile.last_content_sample}`);
  
  // Analyze openness
  const openness = await classifier.analyzeOpenness(rawProfile);
  
  // Classify relationships
  const relationshipTags = await relationshipClassifier.classifyRelationships(
    { ...rawProfile, role_tags: roleTags },
    { keywords }
  );
  
  // Classify wealth and potential
  const wealthTier = wealthClassifier.classifyWealthTier(rawProfile, roleTags);
  const potentialTier = wealthClassifier.classifyPotentialTier(rawProfile, topics);
  
  // Build enriched profile for scoring
  const enrichedProfile = {
    ...rawProfile,
    role_tags: roleTags,
    topics_detected: topics,
    relationship_tags: relationshipTags,
    wealth_tier: wealthTier,
    potential_tier: potentialTier,
    openness_tag: openness.tag,
    openness_score: openness.score
  };
  
  // Calculate scores
  const scores = scorer.calculateAllScores(enrichedProfile, keywords);
  
  // Add metadata
  const finalProfile = {
    ...enrichedProfile,
    ...scores,
    country: rawProfile.location ? new (require('./adapters/base-adapter'))().normalizeLocation(rawProfile.location) : '',
    data_source_run_id: runId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  return finalProfile;
}
