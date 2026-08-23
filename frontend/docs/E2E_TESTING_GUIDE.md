# OpenPrep AI End-to-End Testing Guide (Playwright)

## Overview
OpenPrep AI utilizes [Playwright](https://playwright.dev/) for cross-browser, cross-device E2E validation. Tests verify critical student workflows across Desktop and Mobile viewports.

## Test Directory Structure
```
frontend/e2e/
├── fixtures/
│   └── testFixtures.js        # Extended Playwright test fixtures with auth & mocks
├── helpers/
│   ├── authHelper.js          # Authentication helper routines
│   └── mockApi.js             # API route interceptors and mock payloads
├── auth.spec.js               # Login, registration, form validation
├── dashboard.spec.js          # Metrics widgets, theme toggling
├── quiz.spec.js               # Quiz taking, answers, results
├── flashcards.spec.js         # Spaced repetition, decks
├── study-plan.spec.js         # AI schedules, milestones
└── community.spec.js          # Study groups, peer forums
```

## Running Tests Locally

### 1. Run all tests in headless mode
```bash
npx playwright test
```

### 2. Run with interactive UI mode
```bash
npx playwright test --ui
```

### 3. Run specific test suite
```bash
npx playwright test e2e/auth.spec.js --project="Desktop Chromium"
```

### 4. View HTML test report
```bash
npx playwright show-report
```

## CI/CD Pipeline
Tests run automatically on all pull requests targeting `main` via `.github/workflows/e2e-tests.yml`. Test artifacts (traces, videos, screenshots) are preserved on failure for 14 days.
