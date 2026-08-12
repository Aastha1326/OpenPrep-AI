---
title: '[BUG/PERF]: Add Pagination, Sorting, and Search Indexing to Flashcards API'
labels: 'ECSoC26, ECSoC26-L1, bug, performance, backend, database'
assignees: ''
---

## Issue Type
Bug / Performance

## Priority
P2 Medium

## Summary
Refactor `GET /api/flashcards` to support pagination (`page`, `limit`), topic/subject filtering, search indexing, and sorting to fix memory bloat and slow API responses when accounts accumulate hundreds of flashcards.

## Problem Statement
Currently, `flashcardController.getUserFlashcards` fetches all flashcard rows for a user in a single unpaginated database query (`findAll()`). For active users with >500 cards, this causes heavy payload sizes (>2MB JSON), slow response times (>1.5s), and browser DOM slowdown.

## Current Behavior
The backend returns an unbounded array of all flashcard records owned by the logged-in user.

## Expected Behavior
The API accepts query parameters `?page=1&limit=20&search=photosynthesis&subjectId=12&sortBy=nextReviewDate&order=ASC` and returns structured paginated results:
```json
{
  "flashcards": [...],
  "pagination": {
    "total": 340,
    "page": 1,
    "limit": 20,
    "totalPages": 17
  }
}
```

## User Story
As a user with a large library of flashcards  
I want the flashcards list page to load instantly and support search/filtering  
So that I can quickly manage and review my decks without waiting for long network transfers  

## Proposed Solution
1. Add Sequelize pagination (`findAndCountAll` with `limit` and `offset`).
2. Add PostgreSQL indexes on `(userId, topicId)`, `(userId, nextReviewDate)`, and full-text search vector on card `front` & `back`.
3. Update frontend `flashcardSlice` and Flashcard Management view to implement infinite scrolling or paginated table controls.

## Technical Scope

### Frontend Impact
- Update `frontend/src/store/slices/flashcardSlice.js` to handle paginated state.
- Update `frontend/src/pages/Flashcards.jsx` with search bar, filter dropdowns, and pagination controls.

### Backend Impact
- Refactor `backend/controllers/flashcardController.js` (`getFlashcards` function).
- Add helper validation for page/limit bounds (`Math.min(limit, 100)`).

### Database Impact
- Migration file: Add index `idx_flashcards_user_next_review` on `(user_id, next_review_date)` and `idx_flashcards_user_topic` on `(user_id, topic_id)`.

### API Impact
- `GET /api/flashcards?page=1&limit=20&search=keyword&subjectId=X&sortBy=createdAt&order=DESC`

### Infrastructure Impact
None.

## Acceptance Criteria
- [ ] API payload size reduced from >2MB to <50KB for default 20 items per page limit.
- [ ] Response latency drops under 50ms for paginated requests.
- [ ] Searching by query term filters cards instantly using server-side ILIKE/full-text search.
- [ ] Frontend displays clean pagination buttons with active page highlights.

## Edge Cases
- [ ] Invalid page numbers (e.g. `page=-1` or `page=abc`) -> defaults safely to `page=1`.
- [ ] Requesting page beyond total count -> returns empty array with correct pagination metadata.

## Security Considerations
Ensure SQL injection protection by using parameterization in Sequelize `Op.like` or full-text queries.

## Accessibility Considerations
Ensure pagination controls have proper `aria-label="Page 1"`, `aria-current="page"` attributes.

## Performance Considerations
Drastically cuts memory allocation per Express request thread and client React DOM node creation count.

## Testing Requirements

### Unit Tests
- [ ] Test `flashcardController` query builder with search, sorting, and pagination options.

### Integration Tests
- [ ] Seed 100 flashcards, query page 2 with limit 10, and verify items 11-20 are returned with correct `totalCount`.

## Affected Areas
- [x] Backend
- [x] Database
- [x] Frontend

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 1 (Easy / Beginner-friendly) (ECSoC26-L1)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Database migration created & executed
- [ ] Tests passing
- [ ] Ready for production
