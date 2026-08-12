---
title: '[FEAT]: OAuth 2.0 Social Authentication (Google & GitHub) Integration'
labels: 'ECSoC26, ECSoC26-L2, feature, authentication, security, backend, frontend'
assignees: ''
---

## Issue Type
Feature / Security / Authentication

## Priority
P1 High

## Summary
Add OAuth 2.0 single sign-on (SSO) support enabling users to log in or register with Google and GitHub accounts via Passport.js, issuing secure JWT HTTP-only cookies on successful authentication.

## Problem Statement
Requiring standard email/password registration increases user onboarding friction. Many students prefer logging in with one click via Google or GitHub accounts.

## Current Behavior
Authentication only supports standard email + password registration and login endpoints.

## Expected Behavior
1. Login and Register pages display "Continue with Google" and "Continue with GitHub" brand buttons.
2. Clicking social login triggers standard OAuth authorization flow.
3. If user exists with matching email, link social account; otherwise, automatically create new user profile.
4. Issue JWT auth token and redirect user to dashboard.

## User Story
As a new student signing up  
I want to log in using my Google or GitHub account  
So that I don't have to remember another username and password  

## Proposed Solution
1. Install `passport`, `passport-google-oauth20`, `passport-github2` npm packages on backend.
2. Configure Passport strategies in `backend/config/passport.js`.
3. Create OAuth routes in `backend/routes/authRoutes.js`.
4. Update frontend `Login.jsx` and `Register.jsx` with responsive social login buttons (`GoogleLoginButton.jsx`, `GitHubLoginButton.jsx`).

## Technical Scope

### Frontend Impact
- New Components: `frontend/src/components/auth/GoogleLoginButton.jsx`, `frontend/src/components/auth/GitHubLoginButton.jsx`.
- Update `frontend/src/pages/Login.jsx` and `frontend/src/pages/Register.jsx`.
- Handle OAuth callback redirect in `frontend/src/pages/OAuthCallback.jsx`.

### Backend Impact
- New Config: `backend/config/passport.js`.
- Updates to `backend/controllers/authController.js`, `backend/routes/authRoutes.js`, `backend/server.js`.

### Database Impact
- `User` model updates: Add `googleId: STRING`, `githubId: STRING`, `avatarUrl: STRING`, `authProvider: ENUM('local', 'google', 'github')`, make `password` nullable for OAuth users.

### API Impact
- `GET /api/auth/google` -> redirects to Google OAuth consent screen.
- `GET /api/auth/google/callback` -> handles Google OAuth code exchange.
- `GET /api/auth/github` -> redirects to GitHub OAuth consent screen.
- `GET /api/auth/github/callback` -> handles GitHub OAuth code exchange.

### Infrastructure Impact
Set environment variables in `backend/.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.

## Acceptance Criteria
- [ ] Clicking "Continue with Google" opens Google account picker and logs user in successfully.
- [ ] Clicking "Continue with GitHub" authorizes app and creates user account.
- [ ] Existing users logging in with Google/GitHub matching their email auto-link provider ID.
- [ ] JWT token correctly set upon callback completion and user redirected to `/dashboard`.
- [ ] Profiles populated with user avatar and display name from social provider.

## Edge Cases
- [ ] Social account email missing/private (GitHub) -> prompt user to enter email address before finalizing account creation.
- [ ] User cancels OAuth consent -> handle error parameter and redirect to `/login?error=oauth_cancelled`.

## Security Considerations
Validate OAuth state parameter to prevent CSRF attacks during code exchange. Ensure JWT tokens carry standard signature and expiration.

## Accessibility Considerations
Social login buttons include `aria-label="Log in with Google"` and high contrast logo SVGs.

## Performance Considerations
Lightweight OAuth code exchange execution (< 250ms latency total).

## Testing Requirements

### Unit Tests
- [ ] Test Passport strategy callback logic with mocked profile payloads.

### Manual Testing
- [ ] Test end-to-end Google login flow on local dev environment.
- [ ] Test end-to-end GitHub login flow.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] Authentication
- [x] Database

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 2 (Medium / Intermediate) (ECSoC26-L2)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Manual OAuth testing verified
- [ ] Documentation updated in `docs/authentication-flow.md`
- [ ] Ready for production
