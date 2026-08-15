---
title: '[INFRA]: Sentry Real-Time Error Tracking, Exception Handler Middleware, & Performance Monitoring'
labels: 'ECSoC26, ECSoC26-L1, feature, backend, good first issue'
assignees: ''
---

## Issue Type
Infrastructure / Backend / Monitoring

## Priority
P2 Medium

## Summary
Integrate Sentry SDK (`@sentry/node` and `@sentry/react`) across both Express backend and React frontend for centralized real-time unhandled exception tracking, API error monitoring, and transaction profiling.

## Problem Statement
When uncaught exceptions occur in production (e.g., Gemini API rate limit timeouts, database constraint errors, unhandled promise rejections), maintainers have to rely on raw server log files. There is no centralized error monitoring dashboard or real-time stack trace alert system.

## Current Behavior
Unhandled backend errors log to standard stdout/stderr without automated alerting or contextual error capture.

## Expected Behavior
Errors in both frontend and backend are captured automatically by Sentry with context (User ID, Request Route, Environment, Stack Trace). Express error middleware captures 500 status exceptions and returns sanitized user error messages.

## User Story
As a developer or maintainer  
I want real-time error logging and performance tracing via Sentry  
So that production bugs and API failures are caught and reported instantly with full stack traces  

## Proposed Solution
1. Install `@sentry/node` and `@sentry/profiling-node` in `backend`, and `@sentry/react` in `frontend`.
2. Create initialization config `backend/config/sentry.js` and mount Sentry request/error handlers in `backend/server.js`.
3. Add global React Error Boundary wrapper `frontend/src/components/common/ErrorBoundary.jsx` integrated with Sentry.
4. Add `SENTRY_DSN` and `SENTRY_ENVIRONMENT` in `.env.example`.

## Technical Scope

### Frontend Impact
- Package: `@sentry/react`.
- New Component: `frontend/src/components/common/ErrorBoundary.jsx`.
- Update `frontend/src/main.jsx` to initialize Sentry.

### Backend Impact
- Packages: `@sentry/node`, `@sentry/profiling-node`.
- New File: `backend/config/sentry.js`.
- Updates to `backend/middleware/errorHandler.js` and `backend/server.js`.

### Database Impact
None.

### API Impact
None (transparent error middleware integration).

### Infrastructure Impact
Requires `SENTRY_DSN` environment variable. Graceful no-op if DSN is not provided in local dev environment.

## Acceptance Criteria
- [ ] Backend uncaught exceptions capture stack trace, request method, route URL, and logged-in user ID in Sentry.
- [ ] Frontend React component render crashes display clean fallback ErrorBoundary UI and report error to Sentry.
- [ ] API error middleware catches 500 server errors and returns clean JSON `{ success: false, message: "Internal Server Error" }` without leaking internal DB details.
- [ ] Sentry is disabled or muted automatically during local unit/integration test runs (`NODE_ENV=test`).

## Edge Cases
- [ ] Invalid or missing `SENTRY_DSN` -> app continues to function normal with standard console error fallback.
- [ ] Sensitive data (passwords, JWT tokens, credit card details) -> scrub headers and request bodies before sending to Sentry (`beforeSend` hook).

## Security Considerations
Sanitize request payload objects in Sentry `beforeSend` filter to prevent leakage of user secrets, passwords, or tokens.

## Accessibility Considerations
Fallback error UI component complies with visual contrast and accessibility standards.

## Performance Considerations
Lightweight async transport layer; sampling rate configured (`tracesSampleRate: 0.2`) to minimize performance impact.

## Testing Requirements

### Unit Tests
- [ ] Test `errorHandler` middleware returns 500 status and calls Sentry capture.

### Manual Testing
- [ ] Trigger mock error endpoint (`GET /api/test-error`) and check Sentry dashboard for captured stack trace.

## Affected Areas
- [x] Backend
- [x] Frontend

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 1 (Easy / Beginner-friendly) (ECSoC26-L1)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Manual testing passed
- [ ] Setup guide updated with Sentry environment variables
- [ ] Ready for production
