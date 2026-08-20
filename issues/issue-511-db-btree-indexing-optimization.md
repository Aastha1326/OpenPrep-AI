---
title: '[PERF]: Database Query Optimization & B-Tree Indexing for Search and Attempt Logs'
labels: 'ECSoC26, ECSoC26-L2, performance, backend, database'
assignees: ''
---

## Issue Type
Performance / Database / Backend

## Priority
P2 Medium

## Summary
Add targeted PostgreSQL B-Tree and GIN indexes, optimize Sequelize model associations, and analyze execution plans (`EXPLAIN ANALYZE`) for high-traffic tables (`QuizAttempt`, `Flashcard`, `StudyPlanTask`, `User`).

## Problem Statement
As quiz attempts and flashcard cards accumulate, SQL queries filtering by `userId`, `created_at`, or searching card text perform full sequential table scans, increasing database query latency over 400ms.

## Current Behavior
Sequelize models define primary key auto-increment indexes, but lack composite indexes for compound queries like `WHERE user_id = X AND status = Y ORDER BY created_at DESC`.

## Expected Behavior
Adding composite B-Tree indexes and GIN full-text search indexes drops query execution time under 15ms for filtered list queries and search operations.

## User Story
As a user querying quiz attempts or searching flashcards  
I want database search queries to return results instantly  
So that workspace list filters and analytical reports render without database query bottlenecks  

## Proposed Solution
1. Write Sequelize migration script `backend/migrations/add-performance-indexes.js`.
2. Add composite indexes:
   - `idx_quiz_attempts_user_created`: `(user_id, created_at DESC)`
   - `idx_flashcards_deck_position`: `(deck_id, position)`
   - `idx_study_tasks_user_date`: `(user_id, scheduled_date)`
3. Add GIN index for full-text search on note titles and content: `gin(to_tsvector('english', title || ' ' || content))`.
4. Run `EXPLAIN ANALYZE` benchmarks before and after indexing to verify index usage.

## Technical Scope

### Frontend Impact
None (Transparent query speed improvement).

### Backend Impact
- New Migration: `backend/migrations/20260812-add-performance-indexes.js`.
- Updates to model declarations in `backend/models/*.js`.

### Database Impact
Improves PostgreSQL query performance and reduces CPU load.

### API Impact
None.

### Infrastructure Impact
Slight increase in database disk index storage (<5MB).

## Acceptance Criteria
- [ ] Migration applies composite and GIN indexes cleanly without data loss.
- [ ] `EXPLAIN ANALYZE` confirms PostgreSQL query planner utilizes index scans instead of sequential scans.
- [ ] `/api/quizzes/history` query execution time decreases from >350ms to <15ms.
- [ ] Full-text search across 10,000 flashcard records executes under 20ms.

## Edge Cases
- [ ] SQLite fallback in dev mode -> ensure migration conditionally applies syntax compatible with both SQLite and PostgreSQL.

## Security Considerations
None.

## Performance Considerations
Achieve 20x faster query execution for high-frequency database endpoints.

## Testing Requirements

### Unit Tests
- [ ] Test migration `up` and `down` rollback functions.

### Integration Tests
- [ ] Benchmark query response latency using large seeded database dataset (10,000 mock attempt rows).

## Affected Areas
- [x] Backend
- [x] Database

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 2 (Medium / Intermediate) (ECSoC26-L2)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Database benchmarks verified
- [ ] Ready for production
