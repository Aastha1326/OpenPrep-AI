---
title: '[FEAT]: Public Community Flashcard Deck Library & Rating System'
labels: 'ECSoC26, ECSoC26-L2, feature, fullstack, community, database'
assignees: ''
---

## Issue Type
Feature / Community Resources

## Priority
P2 Medium

## Summary
Build a Public Community Flashcard Deck Marketplace/Library where students can publish their curated flashcard decks, discover shared decks created by peers, fork/import community decks into their personal library, and submit star ratings and review comments.

## Problem Statement
Currently, all created flashcard decks are private to individual student accounts. Students spend duplicate effort creating flashcards for common syllabus topics (e.g., Organic Chemistry, Indian Polity, MCAT Biology) instead of leveraging high-quality decks created by top peers.

## Current Behavior
Flashcard decks are isolated per user; there is no public discovery feed or sharing mechanism.

## Expected Behavior
1. Users can toggle a deck's status to "Public".
2. A new "Community Library" tab presents searchable, filterable flashcard decks categorized by subject, exam type, author, rating, and download count.
3. Users can preview sample cards, click "Fork Deck" to copy it to their collection, and leave a 1-5 star rating.

## User Story
As a student preparing for national entrance exams  
I want to browse and fork community-curated flashcard decks  
So that I can immediately start studying high-quality cards created by top performers without building every card from scratch  

## Proposed Solution
1. Add deck visibility and rating schemas to Sequelize models.
2. Build `CommunityDecks.jsx` marketplace view with search bar, tag filters, sorting (Most Popular, Highest Rated, Newest), and deck preview modal.
3. Add `forkDeck` backend controller duplicating deck structure and cards under the target user's ID.

## Technical Scope

### Frontend Impact
- New Page: `frontend/src/pages/CommunityDecks.jsx`.
- New Components: `frontend/src/components/community/DeckCard.jsx`, `frontend/src/components/community/DeckPreviewModal.jsx`, `frontend/src/components/community/StarRating.jsx`.

### Backend Impact
- New Controller: `backend/controllers/communityController.js`.
- Updates to: `backend/controllers/flashcardController.js`.
- Routes: `backend/routes/communityRoutes.js`.

### Database Impact
- `FlashcardDeck` model updates: `isPublic: BOOLEAN`, `downloadsCount: INTEGER`, `averageRating: FLOAT`, `ratingsCount: INTEGER`.
- New Model: `DeckRating` (`id`, `deckId`, `userId`, `stars` 1-5, `comment` TEXT, `createdAt`).

### API Impact
- `GET /api/community/decks?search=organic&subjectId=4&sort=popular` -> returns public decks list.
- `POST /api/community/decks/:id/fork` -> clones deck to user library.
- `POST /api/community/decks/:id/rate` -> submits rating.

### Infrastructure Impact
None.

## Acceptance Criteria
- [ ] Toggling deck to Public makes it immediately discoverable in Community Library.
- [ ] Search bar filters public decks by deck title, subject, tags, or description.
- [ ] Clicking "Fork Deck" duplicates cards atomically without mutating original deck.
- [ ] Users can submit 1-5 star ratings and update their rating if previously submitted.
- [ ] Average rating updates dynamically on new rating submission.

## Edge Cases
- [ ] Author deletes or unpublishes original deck -> preserves previously forked decks in other users' libraries.
- [ ] Rating own deck -> disallow authors from rating their own published decks.

## Security Considerations
Sanitize search inputs and review comments to prevent XSS. Validate that users can only modify public status for decks they own.

## Accessibility Considerations
Full keyboard navigation for rating stars (`aria-valuenow`, `aria-valuemin="1"`, `aria-valuemax="5"`).

## Performance Considerations
Index `(isPublic, averageRating)` and `(isPublic, downloadsCount)` in PostgreSQL for rapid catalog queries.

## Testing Requirements

### Unit Tests
- [ ] Test average rating recalculation algorithm on new rating additions.

### Integration Tests
- [ ] Test deck fork API endpoint ensuring card count match and independent user ownership.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] Database
- [x] Community

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 2 (Medium / Intermediate) (ECSoC26-L2)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Unit & integration tests passing
- [ ] Documentation updated
- [ ] Ready for production
