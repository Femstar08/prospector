# Beacon Lead Finder API - Architecture Plan

## Overview

Transform the ProspectMatcherUK Apify Actor into a **standalone, monetizable Lead Finder API** that can be licensed to accounting firms and businesses.

## Current State → Target State

### Current: Apify Actor

- Runs as scheduled jobs
- Returns results to Apify dataset
- Optionally saves to Supabase
- Single-tenant design

### Target: Beacon Lead Finder API

- REST API with job queue
- Multi-tenant with API key authentication
- Usage tracking for monetization
- Separate deployable service
- Domain: `api.beaconleads.io`

## Architecture Components

### 1. API Layer (New)

**Technology:** Node.js + Express/Fastify
**Responsibilities:**

- Accept lead search requests
- Validate API keys
- Queue jobs
- Return job IDs
- Provide status polling
- Serve results

**Endpoints:**

```
POST   /v1/searches              - Start a new lead search
GET    /v1/searches/{jobId}      - Get job status
GET    /v1/searches/{jobId}/results - Get search results
GET    /v1/searches              - List all searches for API key
DELETE /v1/searches/{jobId}      - Cancel a search

POST   /v1/api-keys              - Create API key (admin)
GET    /v1/api-keys              - List API keys (admin)
DELETE /v1/api-keys/{keyId}      - Revoke API key (admin)

GET    /v1/usage                 - Get usage stats for API key
GET    /v1/health                - Health check
```

### 2. Job Queue (New)

**Technology:** Bull Queue + Redis
**Responsibilities:**

- Queue search jobs
- Manage job lifecycle (pending → processing → completed/failed)
- Handle retries
- Track progress
- Store job metadata

**Job States:**

- `pending` - Job queued, waiting to start
- `processing` - Job running
- `completed` - Job finished successfully
- `failed` - Job failed with error
- `cancelled` - Job cancelled by user

### 3. Worker Service (Existing Apify Actor - Enhanced)

**Current:** ProspectMatcherUK Apify Actor
**Enhancement:** Add job queue integration

**Responsibilities:**

- Pull jobs from queue
- Execute platform searches (Twitter, YouTube, Reddit, Quora, etc.)
- Apply question-seeking filters
- Classify and score prospects
- Store results
- Update job status

### 4. Database Layer (New + Enhanced)

**Technology:** PostgreSQL (Supabase)

**New Tables:**

```sql
-- API Keys and Tenants
api_keys (
  id, key_hash, tenant_id, name,
  created_at, expires_at, is_active,
  rate_limit_per_hour, rate_limit_per_day
)

tenants (
  id, name, email, plan_tier,
  created_at, is_active
)

-- Job Management
search_jobs (
  id, job_id, tenant_id, api_key_id,
  status, progress_percent,
  input_params, result_count,
  created_at, started_at, completed_at,
  error_message
)

-- Usage Tracking
api_usage (
  id, tenant_id, api_key_id,
  endpoint, job_id, leads_returned,
  timestamp, response_time_ms
)

-- Existing (Enhanced)
prospect_profiles (
  -- Add tenant_id for multi-tenancy
  tenant_id, job_id,
  -- All existing fields...
)
```

### 5. Authentication & Authorization (New)

**API Key Format:** `beacon_live_abc123...` or `beacon_test_abc123...`

**Security:**

- API keys hashed with bcrypt
- Rate limiting per API key
- Tenant isolation (row-level security)
- HTTPS only
- CORS configuration

### 6. Usage Tracking & Billing (New)

**Metrics to Track:**

- Searches initiated
- Leads returned
- API calls made
- Data enrichment requests
- Storage used

**Billing Tiers (Future):**

- Free: 100 leads/month
- Starter: 1,000 leads/month - £49/mo
- Professional: 10,000 leads/month - £199/mo
- Enterprise: Unlimited - Custom pricing

## Data Flow

### 1. Start Search Request

```
Client → API → Validate API Key → Create Job → Queue Job → Return Job ID
```

### 2. Process Search

```
Worker → Pull Job → Execute Search → Classify & Score → Store Results → Update Status
```

### 3. Retrieve Results

```
Client → API → Validate API Key → Check Job Status → Return Results
```

## Normalized Output Schema

```json
{
  "job_id": "job_abc123",
  "status": "completed",
  "progress": 100,
  "total_leads": 45,
  "created_at": "2025-12-08T10:00:00Z",
  "completed_at": "2025-12-08T10:05:23Z",
  "leads": [
    {
      "id": "lead_xyz789",
      "source": "twitter",
      "profile_url": "https://twitter.com/username",
      "name": "John Smith",
      "username": "johnsmith",
      "location": "London, UK",
      "bio": "Property investor seeking accounting advice...",

      "question": {
        "text": "Looking for an accountant who specializes in property investment. Any recommendations?",
        "quality_score": 85,
        "intent_score": 90,
        "decision_stage": "actively_seeking_professional",
        "urgency": "high",
        "asked_at": "2025-12-08T09:45:00Z"
      },

      "classification": {
        "role_tags": ["general_entrepreneur", "investor"],
        "relationship_tags": ["investee_candidate"],
        "wealth_tier": "upper_mid",
        "potential_tier": "high_potential"
      },

      "scores": {
        "overall_score": 88,
        "business_alignment_score": 85,
        "technical_synergy_score": 60,
        "audience_score": 70,
        "wealth_potential_score": 75,
        "openness_score": 90,
        "question_quality_score": 85,
        "intent_score": 90,
        "decision_stage_score": 100
      },

      "engagement": {
        "follower_count": 2500,
        "following_count": 800,
        "post_count": 1200
      },

      "enrichment": {
        "company_name": null,
        "company_website": null,
        "phone": null,
        "email": null,
        "companies_house_number": null
      }
    }
  ]
}
```

## Implementation Phases

### Phase 1: API Foundation (Week 1)

- [ ] Set up Express/Fastify API server
- [ ] Implement API key authentication
- [ ] Create database schema (api_keys, tenants, search_jobs, api_usage)
- [ ] Set up Redis + Bull Queue
- [ ] Implement core endpoints (POST /searches, GET /searches/{id})
- [ ] Add basic rate limiting
- [ ] Deploy to staging environment

### Phase 2: Worker Integration (Week 2)

- [ ] Enhance Apify Actor to pull from job queue
- [ ] Add job status updates to worker
- [ ] Implement progress tracking
- [ ] Add error handling and retries
- [ ] Test end-to-end job flow
- [ ] Add job cancellation support

### Phase 3: Question-Seeking Features (Week 3)

- [ ] Implement question detection utility
- [ ] Enhance Twitter adapter with question search
- [ ] Implement Reddit integration (r/UKPersonalFinance, etc.)
- [ ] Add YouTube comment analysis
- [ ] Implement Quora adapter
- [ ] Add intent scoring engine
- [ ] Update overall scoring with question metrics

### Phase 4: Multi-Tenancy & Security (Week 4)

- [ ] Implement tenant isolation (RLS in Supabase)
- [ ] Add API key management endpoints
- [ ] Implement usage tracking
- [ ] Add rate limiting per tenant
- [ ] Set up monitoring and alerting
- [ ] Security audit and penetration testing

### Phase 5: Enrichment Pipeline (Week 5-6)

- [ ] Integrate Companies House API
- [ ] Add website crawling for contact info
- [ ] Implement LinkedIn company signals
- [ ] Add email finding service integration
- [ ] Add phone number validation
- [ ] Create enrichment job queue

### Phase 6: Production & Monetization (Week 7-8)

- [ ] Set up production infrastructure
- [ ] Configure domain (api.beaconleads.io)
- [ ] Implement billing integration (Stripe)
- [ ] Create usage dashboards
- [ ] Write API documentation (OpenAPI/Swagger)
- [ ] Create client SDKs (Node.js, Python)
- [ ] Launch beta program

## CRM Integration

### Beacon & Ledger CRM Client

```javascript
// Simple wrapper client for CRM
const BeaconLeadsClient = require("@beacon/leads-client");

const client = new BeaconLeadsClient({
  apiKey: process.env.BEACON_LEADS_API_KEY,
  baseUrl: "https://api.beaconleads.io/v1",
});

// Start a search
const job = await client.searches.create({
  keywords: ["property", "accounting", "tax advice"],
  location: "United Kingdom",
  questionSeekingMode: true,
  maxResults: 100,
});

// Poll for completion
const results = await client.searches.waitForCompletion(job.id, {
  pollInterval: 5000, // 5 seconds
  timeout: 300000, // 5 minutes
});

// Convert selected leads to CRM
for (const lead of results.leads) {
  if (lead.scores.overall_score > 80) {
    await crm.leads.create({
      name: lead.name,
      source: "beacon_leads",
      external_id: lead.id,
      metadata: lead,
    });
  }
}
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                 (api.beaconleads.io)                     │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼─────┐          ┌─────▼────┐
    │ API Node │          │ API Node │
    │ (Express)│          │ (Express)│
    └────┬─────┘          └─────┬────┘
         │                      │
         └──────────┬───────────┘
                    │
         ┌──────────▼──────────┐
         │   Redis (Bull Queue) │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │  Worker Pool         │
         │  (Apify Actors)      │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │  PostgreSQL          │
         │  (Supabase)          │
         └─────────────────────┘
```

## Technology Stack

**API Server:**

- Node.js 20+
- Express or Fastify
- TypeScript (optional but recommended)

**Job Queue:**

- Bull Queue
- Redis 7+

**Database:**

- PostgreSQL 15+ (Supabase)
- Row-level security for multi-tenancy

**Worker:**

- Existing Apify Actor (Node.js)
- Enhanced with queue integration

**Hosting:**

- API: Railway, Render, or AWS ECS
- Workers: Apify Platform
- Database: Supabase
- Redis: Upstash or Redis Cloud

**Monitoring:**

- Sentry (error tracking)
- DataDog or New Relic (APM)
- Uptime monitoring

## Key Constraints & Requirements

✅ **Separation from CRM**

- API has its own database
- No direct CRM database access
- CRM calls API via HTTP

✅ **Multi-Tenant Support**

- Tenant isolation via RLS
- API key per tenant
- Usage tracking per tenant

✅ **Scalability**

- Horizontal scaling of API nodes
- Worker pool can scale independently
- Queue handles high volume

✅ **Security**

- API key authentication
- Rate limiting
- HTTPS only
- Input validation
- SQL injection prevention

✅ **Monetization Ready**

- Usage tracking
- Billing integration hooks
- Multiple pricing tiers
- API key management

## Next Steps

1. **Review this architecture** - Does it align with your vision?
2. **Prioritize phases** - Which phase should we start with?
3. **Choose tech stack** - Confirm technology choices
4. **Set up infrastructure** - Create staging environment
5. **Start Phase 1** - Build API foundation

**Recommendation:** Start with Phase 1 (API Foundation) while continuing to enhance the existing Apify Actor with question-seeking features in parallel.

Would you like me to:

- **A)** Start implementing Phase 1 (API Foundation)?
- **B)** Continue with Phase 3 (Question-Seeking Features) in the current actor?
- **C)** Create the CRM-side integration client?
- **D)** Design the Lead Finder UI flow?
