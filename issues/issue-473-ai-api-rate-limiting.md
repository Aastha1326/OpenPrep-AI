---
title: '[BUG/SEC]: Implement Rate Limiting & User Quota Controls for Gemini AI API Routes'
labels: 'ECSoC26, ECSoC26-L2, bug, security, backend, performance'
assignees: ''
---

## Issue Type
Bug / Security Enhancement

## Priority
P0 Critical

## Summary
Secure all backend routes interfacing with the Gemini AI API (`/api/ai/*`, quiz generation, study plan generation, note summarization) using dynamic rate limiters, user tier quotas, and token bucket middleware to prevent API quota drain and malicious overuse.

## Problem Statement
Currently, users can trigger AI endpoints repeatedly without strict client or user-based rate limiting. A single user or bot script could spam quiz generation or note summary APIs, exhausting the project's Gemini API quota and causing service denial for all users.

## Current Behavior
AI generation controller endpoints lack dedicated IP/User rate limiting middleware beyond standard basic request limits.

## Expected Behavior
1. Rate limit `/api/ai/*` routes (e.g., maximum 10 AI generation requests per user per 15 minutes).
2. Track daily user AI usage quotas in database / Redis.
3. Return clear `HTTP 429 Too Many Requests` responses with `Retry-After` headers and clean user-facing error messages on frontend quota exhaustion.

## User Story
As a system administrator  
I want to restrict Gemini API usage per user  
So that our API costs remain sustainable and no single user can exhaust the platform quota  

## Proposed Solution
1. Use `express-rate-limit` to set route-level request ceilings on AI controllers.
2. Implement `aiQuotaMiddleware.js` checking user daily usage counts against role/tier limits.
3. Add standard response format for rate limit errors: `{ error: "AI rate limit exceeded", retryInSeconds: 900, remainingQuota: 0 }`.
4. Update frontend Axios interceptors to display a friendly quota timer banner when rate-limited.

## Technical Scope

### Frontend Impact
- Update `frontend/src/services/api.js` interceptor to handle HTTP 429 status code.
- Add `QuotaExceededModal.jsx` component displaying countdown timer.

### Backend Impact
- New Middleware: `backend/middleware/aiQuotaMiddleware.js`.
- Updates to `backend/routes/aiRoutes.js`, `backend/routes/quizRoutes.js`, `backend/routes/studyPlanRoutes.js`.

### Database Impact
- Update `User` model: Add columns `dailyAiUsageCount: INTEGER`, `lastAiUsageReset: DATE`.

### API Impact
- Response header addition: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- `GET /api/user/quota` endpoint returning remaining daily AI requests.

### Infrastructure Impact
Optional Redis store integration if scaling across multiple server instances (fallback to in-memory store for local dev).

## Acceptance Criteria
- [ ] AI endpoints restrict requests over 10 calls per 15-minute window per IP/User.
- [ ] Daily limit counter resets automatically at midnight UTC.
- [ ] HTTP 429 response correctly returned with `Retry-After` headers.
- [ ] Frontend displays clean countdown banner and disables AI generation buttons when limit is reached.
- [ ] Non-AI routes remain unaffected by AI rate limiting rules.

## Edge Cases
- [ ] User logs out and switches accounts on same IP -> rate limit bound to both User ID and IP fallback.
- [ ] Server reboot -> usage counts preserved in database without resetting daily limits prematurely.

## Security Considerations
Prevents Denial of Wallet (DoW) attacks against Gemini API billing accounts and mitigates automated scraping attacks.

## Accessibility Considerations
Ensure status announcements on rate limit triggers are accessible to screen readers.

## Performance Considerations
Extremely fast middleware check (< 2ms) using DB index or memory cache prior to initiating costly HTTP calls to Google Gemini.

## Testing Requirements

### Unit Tests
- [ ] Test `aiQuotaMiddleware` blocking requests when quota is 0.
- [ ] Test daily reset logic when `lastAiUsageReset` is older than 24 hours.

### Integration Tests
- [ ] Send 11 rapid requests to `/api/ai/summarize-note` and assert 11th request returns HTTP 429.

## Affected Areas
- [x] Backend
- [x] Security
- [x] Database
- [x] AI

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 2 (Medium / Intermediate) (ECSoC26-L2)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Integration tests passing
- [ ] Security documentation updated in `docs/security.md`
- [ ] Ready for production
