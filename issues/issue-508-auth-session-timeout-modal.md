---
title: '[BUG]: Session Timeout Warning Modal & Automatic Auth Token Renewal Retry'
labels: 'ECSoC26, ECSoC26-L1, bug, frontend, authentication, good first issue'
assignees: ''
---

## Issue Type
Bug / Authentication / Frontend UX

## Priority
P3 Low

## Summary
Add a session timeout warning modal (showing 2-minute countdown before JWT expiry) and implement automatic silent refresh token retry in Axios interceptors to prevent user data loss during active study sessions.

## Problem Statement
When a user's JWT access token expires during a lengthy quiz or flashcard review session, submitting an answer fails silently or redirects the user to the login screen without saving their progress or attempt score.

## Current Behavior
Expired JWT tokens cause 401 HTTP errors without automatic refresh token retry or pre-expiry session extension warnings.

## Expected Behavior
When JWT access token has 2 minutes remaining before expiry, a floating "Session Expiring Soon" modal appears with a "Extend Session" button. If the token expires during an API request, the Axios interceptor uses the refresh token to obtain a new access token transparently without interrupting user actions.

## User Story
As a user in the middle of an intensive study or quiz session  
I want my authentication session refreshed seamlessly in the background  
So that I never get logged out unexpectedly or lose my quiz attempt progress  

## Proposed Solution
1. Update `frontend/src/services/api.js` Axios response interceptor to handle 401 errors using `POST /api/auth/refresh-token`.
2. Queue failed requests during token refreshing and replay them once new token is retrieved.
3. Build `SessionTimeoutModal.jsx` component triggered when token remaining time < 120 seconds.

## Technical Scope

### Frontend Impact
- Component: `frontend/src/components/common/SessionTimeoutModal.jsx`.
- Updates to `frontend/src/services/api.js` and auth context.

### Backend Impact
Ensure `POST /api/auth/refresh-token` endpoint returns valid new access token and HttpOnly refresh cookie.

### Database Impact
None.

### API Impact
None.

### Infrastructure Impact
Zero runtime cost.

## Acceptance Criteria
- [ ] 401 HTTP responses trigger silent token refresh retry once before rejecting request.
- [ ] User remains on active page without loss of form data or quiz attempt inputs.
- [ ] Pre-expiry modal displays 2-minute countdown with working "Extend Session" button.
- [ ] Clicking "Logout" or token refresh failure redirects cleanly to `/login` with friendly toast alert.

## Edge Cases
- [ ] Refresh token itself expired or revoked -> clear user storage and redirect to login page cleanly.

## Security Considerations
Store refresh tokens in `HttpOnly`, `SameSite=Strict` cookies to mitigate XSS token theft risks.

## Accessibility Considerations
Ensure timeout modal traps focus (`focus-trap-react`) and announces remaining seconds to screen readers.

## Performance Considerations
Lightweight timer hook; cancel timers when user unmounts app or logs out.

## Testing Requirements

### Unit Tests
- [ ] Test Axios interceptor queueing logic when 401 error response is received.

### Manual Testing
- [ ] Manually shorten access token TTL in dev environment to 1 minute, verify silent refresh and pre-expiry modal.

## Affected Areas
- [x] Frontend
- [x] Authentication

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 1 (Easy / Beginner-friendly) (ECSoC26-L1)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Manual testing passed
- [ ] Documentation updated
- [ ] Ready for production
