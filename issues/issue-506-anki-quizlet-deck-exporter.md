---
title: '[FEAT]: Exportable Flashcard Decks in Anki (.apkg) & Quizlet CSV Format'
labels: 'ECSoC26, ECSoC26-L2, feature, frontend, backend, flashcards'
assignees: ''
---

## Issue Type
Feature / Flashcards / Integration

## Priority
P2 Medium

## Summary
Build export and import parsers supporting Anki package format (`.apkg`), Quizlet comma/tab-separated CSV format, and JSON schema, allowing seamless two-way flashcard deck migration.

## Problem Statement
Students switching to OpenPrep AI already have existing flashcard decks in Anki or Quizlet, or want to export OpenPrep AI flashcards to mobile AnkiDroid/AnkiMobile apps for offline study.

## Current Behavior
Flashcards can only be created manually or generated via AI inside OpenPrep AI without export or third-party format import options.

## Expected Behavior
Deck action menu includes "Export Deck" (options: Anki .apkg, Quizlet CSV, OpenPrep JSON) and "Import Deck" (accepting .apkg, CSV, or JSON files), parsing front/back text, media links, and tags accurately.

## User Story
As an Anki/Quizlet user  
I want to import my existing Anki decks and export OpenPrep AI decks to .apkg format  
So that I can seamlessly sync my flashcards across my preferred flashcard ecosystems  

## Proposed Solution
1. Use `anki-apkg-export` or `sql.js` in Node.js backend to generate binary `.apkg` SQLite ZIP archives.
2. Build CSV parser (`papaparse`) for Quizlet tab-separated and comma-separated term/definition files.
3. Add import/export modal in `frontend/src/components/flashcards/DeckExportModal.jsx` and `DeckImportModal.jsx`.

## Technical Scope

### Frontend Impact
- New Components: `frontend/src/components/flashcards/DeckExportModal.jsx`, `frontend/src/components/flashcards/DeckImportModal.jsx`.
- Update `FlashcardsPage.jsx`.

### Backend Impact
- Packages: `anki-apkg-export`, `papaparse`.
- New Controller: `backend/controllers/deckExchangeController.js`.
- Routes: `backend/routes/deckExchangeRoutes.js`.

### Database Impact
None.

### API Impact
- `GET /api/flashcards/decks/:id/export?format=apkg` -> returns downloadable binary `.apkg` blob.
- `POST /api/flashcards/decks/import` -> accepts multipart file upload, returns imported deck ID.

### Infrastructure Impact
Handles binary file streaming for `.apkg` exports.

## Acceptance Criteria
- [ ] Exporting deck to `.apkg` produces valid file importable into Anki desktop application.
- [ ] Exporting to CSV produces clean term-definition pairs with custom delimiter selection.
- [ ] Importing Quizlet CSV file creates new deck with correct card count and tags.
- [ ] Preserves LaTeX math syntax (`\( ... \)`) across export and import formats.

## Edge Cases
- [ ] CSV file missing headers or malformed -> present interactive column mapping preview modal before saving.

## Security Considerations
Sanitize imported CSV and APKG text contents to prevent XSS payloads or malicious script injections.

## Accessibility Considerations
Ensure file input upload buttons comply with standard ARIA file upload patterns.

## Performance Considerations
Process large deck imports asynchronously using streams to prevent blocking Express event loop.

## Testing Requirements

### Unit Tests
- [ ] Test CSV parser with comma, tab, and custom delimiter separated files.

### Manual Testing
- [ ] Export deck to `.apkg`, open in Anki Desktop, verify cards and tags match; import a Quizlet CSV export file into OpenPrep AI.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] Flashcards

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 2 (Medium / Intermediate) (ECSoC26-L2)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Manual testing passed
- [ ] Documentation updated
- [ ] Ready for production
