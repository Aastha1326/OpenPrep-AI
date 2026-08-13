---
title: '[SEC]: CSRF Protection, HTTP Security Headers (Helmet.js), & API Rate Limiter Refactor'
labels: 'ECSoC26, ECSoC26-L2, security, backend, authentication'
assignees: ''
---

## Issue Type
Security / Backend / Middleware

## Priority
P1 High

## Summary
Harden Node.js Express API security by implementing `helmet`, CORS restriction policies, CSRF double-submit cookies, and `express-rate-limit` per-IP quota limits across auth and AI endpoint routes.

## Problem Statement
The backend currently lacks explicit security headers (HSTS, Content Security Policy, X-Frame-Options) and granular rate-limiting controls. This leaves public API routes vulnerable to brute-force auth attempts, clickjacking, and Denial of Service (DoS) spikes.

## Current Behavior
Basic CORS middleware is configured without strict origin checks or security header middleware.

## Expected Behavior
Express server enforces `helmet` security headers, strict CORS origin whitelisting, CSRF token validation on state-mutating requests, and sliding-window rate limiters (e.g. 5 auth attempts per min, 20 AI requests per hour).

## User Story
As a maintainer  
I want robust HTTP security headers, CSRF protection, and rate limiters on all backend API routes  
So that user accounts and API quotas remain protected against automated attacks  

## Proposed Solution
1. Install `helmet`, `csurf` / `csrf-csrf`, and `express-rate-limit` in `backend`.
2. Configure Helmet middleware in `backend/server.js` with strict CSP policies.
3. Configure rate limiters: `authRateLimiter` (5 reqs / 15 mins), `aiRateLimiter` (30 reqs / hour), `generalRateLimiter` (100 reqs / 15 mins).
4. Add CSRF double-submit token middleware for POST/PUT/DELETE requests.

## Technical Scope

### Frontend Impact
- Update `api.js` Axios client to send CSRF token header (`X-CSRF-Token`).

### Backend Impact
- Packages: `helmet`, `csrf-csrf`, `express-rate-limit`.
- New Files: `backend/middleware/securityMiddleware.js`, `backend/middleware/rateLimitMiddleware.js`.
- Updates to `backend/server.js`.

### Database Impact
None.

### API Impact
- Rate limited responses return `429 Too Many Requests`.
- Missing CSRF token returns `403 Forbidden`.

### Infrastructure Impact
Includes security headers on all HTTP responses.

## Acceptance Criteria
- [ ] Response headers include `X-Frame-Options: DENY`, `Strict-Transport-Security`, and `X-Content-Type-Options: nosniff`.
- [ ] Exceeding 5 failed login attempts returns `429 Too Many Requests` with `Retry-After` header.
- [ ] State-mutating requests without valid CSRF header return 403 error.
- [ ] Automated security audit via OWASP ZAP or Lighthouse passes without high severity flags.

## Edge Cases
- [ ] Automated integration tests -> bypass rate limiter when `NODE_ENV=test`.

## Security Considerations
Prevents CSRF, XSS, clickjacking, and API brute-forcing attacks.

## Accessibility Considerations
None.

## Performance Considerations
Lightweight in-memory / Redis sliding window store.

## Testing Requirements

### Unit Tests
- [ ] Test rate limiter middleware triggering 429 status code on 6th request.

### Integration Tests
- [ ] Test CSRF token generation and validation middleware using Supertest.

## Affected Areas
- [x] Backend
- [x] Authentication
- [x] Security

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 2 (Medium / Intermediate) (ECSoC26-L2)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Security testing verified
- [ ] Setup guide updated
- [ ] Ready for production
