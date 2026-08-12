---
title: '[PERF]: Performance Benchmark Suite & Load Testing Setup with k6 / Artillery'
labels: 'ECSoC26, ECSoC26-L2, performance, backend'
assignees: ''
---

## Issue Type
Performance / Testing / Infrastructure

## Priority
P2 Medium

## Summary
Integrate a k6 / Artillery load testing suite (`tests/load/`) to benchmark backend API performance under high concurrency (100–500 virtual users), capturing request latency, throughput, error rates, and DB pool saturation.

## Problem Statement
The backend API has not been stress-tested under concurrent load. During peak study hours or multi-user quiz battles, un-benchmarked database connection pools or unhandled CPU bottlenecks could lead to API crashes or high response latency.

## Current Behavior
No load testing scripts or automated concurrency benchmark suites exist in the repository.

## Expected Behavior
Running `npm run test:load` executes k6 or Artillery scenarios testing core user flows: Authentication Login, Dashboard Aggregation, Quiz Submission, and Flashcard Retrieval under 200 concurrent Virtual Users (VUs), generating latency breakdown metrics (p95, p99, error rate).

## User Story
As a maintainer or DevOps engineer  
I want automated load testing scripts and latency benchmarks  
So that we can ensure API stability and sub-100ms response times under peak user concurrency  

## Proposed Solution
1. Create `tests/load/scenarios/authFlow.js`, `quizSubmission.js`, `dashboardStats.js`.
2. Configure k6 test thresholds: p95 latency < 200ms, error rate < 1%.
3. Add `scripts/run-load-tests.sh` and `package.json` script `npm run test:load`.
4. Output HTML load test report summary (`tests/load/reports/summary.html`).

## Technical Scope

### Frontend Impact
None.

### Backend Impact
- New Directory: `tests/load/`.
- New Files: `tests/load/config.js`, `tests/load/scenarios/*.js`, `scripts/run-load-tests.js`.
- Updates to `package.json`.

### Database Impact
Identifies database connection pool limits and bottleneck queries.

### API Impact
None.

### Infrastructure Impact
Run as part of release candidate pipeline.

## Acceptance Criteria
- [ ] k6 / Artillery script executes 5-minute ramp-up load test up to 200 Virtual Users.
- [ ] p95 response latency across all non-AI endpoints remains under 200ms.
- [ ] HTTP error rate remains below 1.0% throughout peak load run.
- [ ] Generates clean HTML report summary detailing throughput (RPS), connection times, and status codes.

## Edge Cases
- [ ] External Gemini API calls -> mock AI endpoints during load tests to prevent hitting API quota limits.

## Security Considerations
Never run load tests against live production endpoints without maintainer authorization; restrict target URL to local test server or staging instance.

## Accessibility Considerations
None.

## Performance Considerations
Identifies memory leaks and connection pool exhaustion under load.

## Testing Requirements

### Manual Testing
- [ ] Run `npm run test:load` against local Docker stack, verify p95 latency metrics and HTML report output.

## Affected Areas
- [x] Backend

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 2 (Medium / Intermediate) (ECSoC26-L2)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Benchmark test results verified
- [ ] Documentation updated
- [ ] Ready for production
