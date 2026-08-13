---
title: '[PERF]: Redis Caching Layer for Analytics Dashboards, Quiz Sets & Frequently Accessed PYQs'
labels: 'ECSoC26, ECSoC26-L2, performance, backend, database, dashboard'
assignees: ''
---

## Issue Type
Performance / Infrastructure / Backend

## Priority
P2 Medium

## Summary
Implement a Redis caching layer using `ioredis` in the Node.js Express backend to cache heavy dashboard aggregation queries, static PYQ topic catalogs, and generated quiz sets, reducing PostgreSQL database load and latency.

## Problem Statement
As user activity scales, calculating real-time dashboard analytics (accuracy rates, topic mastery percentages, study streaks) requires executing expensive multi-table JOINs on PostgreSQL on every page load. This increases database load and API response latency (over 600ms).

## Current Behavior
Every GET request to `/api/dashboard/stats`, `/api/pyq/topics`, and `/api/flashcards` directly executes heavy database SQL queries without intermediate caching.

## Expected Behavior
Dashboard analytics and static subject/PYQ metadata are cached in Redis with appropriate Time-To-Live (TTL) policies and invalidation triggers, dropping response latency under 50ms.

## User Story
As a user loading the dashboard  
I want analytics and PYQ data to load instantly  
So that I experience zero lag while navigating between subjects and progress metrics  

## Proposed Solution
1. Add `ioredis` client configuration in `backend/config/redis.js` with fallback in-memory cache if Redis server is unavailable.
2. Build cache middleware `backend/middleware/cacheMiddleware.js` for GET endpoints with configurable TTL (e.g., 15 mins for analytics, 24 hours for static PYQ catalogs).
3. Implement cache invalidation hooks in Sequelize models (`QuizAttempt`, `StudyPlanTask`, `Flashcard`) when new attempts or edits are posted.
4. Add `CACHE_ENABLED=true` and `REDIS_URL` in `.env.example`.

## Technical Scope

### Frontend Impact
None (transparent API latency improvement).

### Backend Impact
- Package: `ioredis`.
- New Files: `backend/config/redis.js`, `backend/middleware/cacheMiddleware.js`, `backend/utils/cacheManager.js`.
- Updates to `backend/controllers/dashboardController.js` and `backend/controllers/pyqController.js`.

### Database Impact
Reduces query load on PostgreSQL database instance.

### API Impact
HTTP headers will include `X-Cache: HIT` or `X-Cache: MISS`.

### Infrastructure Impact
Docker Compose updated with `redis:alpine` service container.

## Acceptance Criteria
- [ ] Redis container integrated into `docker-compose.yml` and verified via healthcheck.
- [ ] Subsequent requests to `/api/dashboard/stats` return cached responses in under 50ms with `X-Cache: HIT`.
- [ ] Submitting a new quiz attempt invalidates user's cached dashboard analytics key automatically.
- [ ] Server gracefully falls back to direct database queries if Redis connection fails or drops.

## Edge Cases
- [ ] Redis connection timeout -> log error silently and bypass cache without dropping user request.
- [ ] Cache key collision across different users -> scope cache keys strictly by `user_${req.user.id}:${endpoint}`.

## Security Considerations
Never store sensitive security tokens or raw password hashes in Redis cache keys; sanitize cached user payload objects.

## Performance Considerations
Achieve 10x response time reduction (from ~600ms down to ~35ms) for cached analytical data endpoints.

## Testing Requirements

### Unit Tests
- [ ] Test `cacheManager` key generation, set, get, and invalidate utilities.

### Integration Tests
- [ ] Test API endpoint cache hit/miss behavior using Supertest.

## Affected Areas
- [x] Backend
- [x] Database
- [x] Dashboard

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 2 (Medium / Intermediate) (ECSoC26-L2)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Integration testing passed
- [ ] Setup guide updated with Redis config instructions
- [ ] Ready for production
