---
title: '[DOCS]: Dynamic OpenAPI 3.0 (Swagger) Specification & Interactive API Explorer'
labels: 'ECSoC26, ECSoC26-L1, documentation, backend, good first issue'
assignees: ''
---

## Issue Type
Documentation / Backend / Developer Experience

## Priority
P3 Low

## Summary
Generate and integrate an interactive OpenAPI 3.0 (Swagger) UI spec into the Express backend (`swagger-ui-express` and `swagger-jsdoc`), serving live interactive API documentation at `/api/docs`.

## Problem Statement
The project documentation currently relies on static markdown files (`docs/api-reference.md`). As new endpoints for quizzes, flashcards, and authentication are added or modified, static documentation becomes outdated, making integration difficult for frontend developers and open-source contributors.

## Current Behavior
No interactive API playground exists; endpoints must be inspected manually in controller code or markdown files.

## Expected Behavior
Navigating to `http://localhost:5000/api/docs` renders an interactive Swagger UI documentation page listing all routes, parameters, request body schemas, response statuses, and JWT authentication authorization headers with a "Try it out" feature.

## User Story
As a developer or open-source contributor  
I want an interactive OpenAPI/Swagger UI endpoint  
So that I can explore, test, and integrate backend REST APIs directly from the browser  

## Proposed Solution
1. Install `swagger-ui-express` and `swagger-jsdoc` NPM packages in `backend`.
2. Configure OpenAPI base specification object in `backend/config/swagger.js`.
3. Add JSDoc `@openapi` annotations above route definitions in `backend/routes/*.js` detailing request parameters, request body schemas, and response codes.
4. Mount Swagger UI middleware on route `/api/docs` in `backend/server.js`.

## Technical Scope

### Frontend Impact
None.

### Backend Impact
- Packages: `swagger-ui-express`, `swagger-jsdoc`.
- New File: `backend/config/swagger.js`.
- Updates to `backend/server.js` and all route files in `backend/routes/`.

### Database Impact
None.

### API Impact
- New Endpoint: `GET /api/docs` -> interactive Swagger HTML interface.
- New Endpoint: `GET /api/docs.json` -> raw JSON OpenAPI spec file.

### Infrastructure Impact
Zero runtime memory overhead; specs loaded on server startup.

## Acceptance Criteria
- [ ] Navigating to `/api/docs` in browser loads clean Swagger UI layout.
- [ ] All major endpoint categories (Auth, Quiz, Flashcards, StudyPlanner, PYQ) are categorized with tags.
- [ ] Authorize button supports entering JWT token (`Bearer <token>`) for testing protected routes.
- [ ] Schemas correctly reflect database model structures (User, QuizAttempt, StudyPlanTask).
- [ ] Executing "Try it out" requests returns valid JSON responses from local API server.

## Edge Cases
- [ ] Production deployment -> option to lock or restrict `/api/docs` behind environment variable flag (`SWAGGER_ENABLED=true`).

## Security Considerations
Ensure Swagger documentation does not expose secret keys, database credentials, or sensitive server paths.

## Accessibility Considerations
Use default accessible Swagger UI theme CSS.

## Performance Considerations
Cache generated OpenAPI JSON schema in memory after initial build.

## Testing Requirements

### Unit Tests
- [ ] Test `swagger.js` config returns valid OpenAPI 3.0 specification object.

### Manual Testing
- [ ] Open `/api/docs`, authenticate with test user token, execute `GET /api/dashboard/stats` via Swagger UI.

## Affected Areas
- [x] Documentation
- [x] Backend

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 1 (Easy / Beginner-friendly) (ECSoC26-L1)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Manual testing passed
- [ ] Setup guide updated
- [ ] Ready for production
