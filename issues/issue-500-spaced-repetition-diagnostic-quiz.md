---
title: '[FEAT]: AI Weakness Diagnostic Quiz Auto-Generator based on Forgotten Spaced Repetition Cards'
labels: 'ECSoC26, ECSoC26-L3, feature, frontend, backend, ai, quiz-system'
assignees: ''
---

## Issue Type
Feature / AI / Spaced Repetition

## Priority
P1 High

## Summary
Build an intelligent diagnostic quiz generator that identifies flashcards with low SuperMemo SM-2 recall ratings (<3) or overdue review status, and automatically constructs targeted multi-choice diagnostic quizzes targeting those exact weak concepts.

## Problem Statement
While spaced repetition flashcards flag forgotten cards, students must manually review them one by one. There is no automated workflow to turn forgotten flashcard concepts into structured practice quizzes to test conceptual retention in exam format.

## Current Behavior
Flashcard reviews and AI Quiz generation are completely decoupled.

## Expected Behavior
When a student completes a flashcard session with >30% forgotten/hard ratings, a "Generate Diagnostic Remediation Quiz" banner appears. Clicking it passes the forgotten card concepts to Gemini API to create a 5 to 10-question MCQ quiz specifically targeting those memory gaps.

## User Story
As a student struggling with difficult flashcards  
I want the platform to automatically generate a practice quiz from my forgotten flashcard terms  
So that I can reinforce weak concepts in a multiple-choice testing format  

## Proposed Solution
1. Identify flashcards with SM-2 parameter `quality <= 2` or `repetitions == 0` after review.
2. Build `backend/services/remediationService.js` that compiles weak card fronts/backs into prompt payload for Gemini API.
3. Add "Remediation Mode" trigger in `FlashcardReview.jsx` summary modal.
4. Track remediation attempt scores to update SM-2 memory retention factors dynamically.

## Technical Scope

### Frontend Impact
- New Component: `frontend/src/components/flashcards/RemediationQuizModal.jsx`.
- Update `frontend/src/components/FlashcardReview.jsx` summary screen.

### Backend Impact
- New Controller Method: `backend/controllers/quizController.js` (`generateRemediationQuiz`).
- Service: `backend/services/remediationService.js`.

### Database Impact
- Update `Quiz` model: add `sourceType: 'REMEDIATION'` and `linkedDeckId`.

### API Impact
- `POST /api/quizzes/generate-remediation` -> accepts `deckId` and array of `failedCardIds`.

### Infrastructure Impact
Generates targeted AI quizzes using existing Gemini API pipeline.

## Acceptance Criteria
- [ ] Completing flashcard review with failed cards renders "Remediation Quiz Ready" card.
- [ ] Generated quiz questions target the exact terms missed during flashcard session.
- [ ] Passing remediation quiz (>80% score) increases SM-2 interval multiplier for linked cards.
- [ ] Diagnostic attempt history is logged separately under Dashboard analytics.

## Edge Cases
- [ ] Fewer than 2 cards failed -> fallback to standard deck revision recommendation.

## Security Considerations
Ensure user owns the flashcard deck ID before generating remediation quizzes.

## Accessibility Considerations
High contrast tags identifying remediation quiz types in quiz history lists.

## Performance Considerations
Batch Gemini API prompts; cache generated diagnostic quiz payload for 24 hours.

## Testing Requirements

### Unit Tests
- [ ] Test failed card extraction logic and SM-2 interval score adjustment algorithm.

### Manual Testing
- [ ] Review 10 flashcards, rate 4 as "Hard/Failed", click remediation button, verify generated quiz content matches failed card concepts.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] AI
- [x] Quiz System

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 3 (Hard / Advanced) (ECSoC26-L3)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Integration testing passed
- [ ] Ready for production
