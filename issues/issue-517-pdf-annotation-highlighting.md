---
title: '[FEAT]: In-Browser PDF Annotation, Text Highlighting & Sticky Notes Utility'
labels: 'ECSoC26, ECSoC26-L2, feature, frontend, ui/ux'
assignees: ''
---

## Issue Type
Feature / Frontend / Document Tools

## Priority
P2 Medium

## Summary
Build an in-browser PDF reader viewer using `pdfjs-dist` or `react-pdf` featuring text selection highlighting (Yellow, Green, Pink, Blue), sticky text notes, and a 1-click "Create Flashcard from Highlight" context menu action.

## Problem Statement
When students read textbook PDFs or uploaded PYQ question papers inside OpenPrep AI, they have to switch back and forth between an external PDF viewer and the note editor to write down highlights and flashcards.

## Current Behavior
Uploaded PDF files are viewed statically without interactive annotation, highlighting, or sticky note tools.

## Expected Behavior
Opening an uploaded PDF document loads an interactive PDF viewer. Students can highlight text in 4 colors, add floating sticky notes, and right-click highlighted text to select "Auto-Generate Flashcard from Selection".

## User Story
As a student reading PDF textbooks and question papers  
I want to highlight key text and add sticky notes directly inside the in-browser PDF viewer  
So that I can convert important textbook passages into flashcards instantly while reading  

## Proposed Solution
1. Enhance `frontend/src/components/common/PDFViewer.jsx` using `react-pdf` and custom canvas annotation overlay.
2. Build annotation state manager tracking text highlights (`{ page, rects, color, commentText }`).
3. Add floating context menu on text selection: "Highlight", "Add Note", "Convert to Flashcard".
4. Store PDF annotations in PostgreSQL database linked to the document record.

## Technical Scope

### Frontend Impact
- Packages: `react-pdf`, `pdfjs-dist`.
- New Components: `frontend/src/components/pdf/PDFAnnotationToolbar.jsx`, `frontend/src/components/pdf/StickyNoteOverlay.jsx`, `frontend/src/components/pdf/SelectionContextMenu.jsx`.
- Refactor: `frontend/src/components/common/PDFViewer.jsx`.

### Backend Impact
- New Controller: `backend/controllers/pdfAnnotationController.js`.
- Routes: `backend/routes/pdfAnnotationRoutes.js`.

### Database Impact
- New Model: `PDFAnnotation` (`id`, `userId`, `documentId`, `pageNumber`, `rectsData` JSONB, `color`, `commentText`).

### API Impact
- `GET /api/documents/:id/annotations` -> retrieves saved annotations.
- `POST /api/documents/:id/annotations` -> saves highlight/sticky note.

### Infrastructure Impact
Client-side PDF canvas rendering.

## Acceptance Criteria
- [ ] Text selection in PDF viewer brings up annotation floating context menu.
- [ ] Highlights render accurately across zoom levels and page turns.
- [ ] Sticky notes expand/collapse on click and display user commentary.
- [ ] Clicking "Convert to Flashcard" opens pre-filled Flashcard creation modal with highlighted text as card front.
- [ ] Annotations persist across sessions and reloads.

## Edge Cases
- [ ] Scanned image PDFs without text layer -> display warning: "Text selection requires searchable PDF. OCR parsing recommended."

## Security Considerations
Sanitize all sticky note text comments to prevent stored XSS attacks.

## Accessibility Considerations
Provide keyboard shortcuts for text highlighting (`Ctrl+H`) and screen reader text extraction.

## Performance Considerations
Render canvas overlays efficiently using `requestAnimationFrame`; debounce annotation position saving.

## Testing Requirements

### Unit Tests
- [ ] Test annotation coordinate normalization and JSON serialization functions.

### Manual Testing
- [ ] Open 5-page PDF document, highlight 3 sentences in different colors, add a sticky note, and convert highlight to flashcard.

## Affected Areas
- [x] Frontend
- [x] UI/UX

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
