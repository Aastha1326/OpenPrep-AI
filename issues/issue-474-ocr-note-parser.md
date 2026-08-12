---
title: '[FEAT]: Optical Character Recognition (OCR) Engine for Uploading Handwritten Notes & Screenshots'
labels: 'ECSoC26, ECSoC26-L3, feature, ai, backend, frontend'
assignees: ''
---

## Issue Type
Feature / AI Integration

## Priority
P2 Medium

## Summary
Integrate Tesseract.js / OCR pipeline into the note upload and PYQ intake modules so students can upload images (`.png`, `.jpg`, `.jpeg`, `.webp`) of handwritten class notes or textbook screenshots and automatically convert them into text for AI quiz and flashcard generation.

## Problem Statement
Students frequently have handwritten notes or photos of past exam question papers rather than clean digital PDFs. Currently, OpenPrep AI only accepts standard text or digital PDF uploads, forcing users to type out printed text manually.

## Current Behavior
File uploader only processes digital `.pdf` and `.txt` files. Image files are rejected or unsupported.

## Expected Behavior
When a user uploads an image (`.png`, `.jpg`, `.jpeg`), the system triggers an OCR extraction pipeline, displays the extracted text in an editable preview pane, and allows saving it as a digital Note or PYQ entry.

## User Story
As a student with handwritten lecture notes  
I want to upload photographs of my notebook pages  
So that OpenPrep AI can extract the written text and automatically build flashcards and practice quizzes for me  

## Proposed Solution
1. Add `tesseract.js` on backend / frontend for image parsing.
2. Build an OCR worker process (`ocrService.js`) to handle image pre-processing (grayscale, thresholding) and text recognition.
3. Integrate an "Editable Text Preview" modal on frontend allowing users to review and fix recognition mistakes before submitting to Gemini API.
4. Support multi-image batch uploads for multiple note pages.

## Technical Scope

### Frontend Impact
- Component: `frontend/src/components/OCRUploadZone.jsx`, `frontend/src/components/TextCorrectionModal.jsx`.
- Image crop/rotate utility controls before running OCR.
- Progress bar displaying OCR recognition confidence and progress percentage.

### Backend Impact
- New Service: `backend/services/ocrService.js` utilizing `tesseract.js` worker threads.
- Controller updates: `backend/controllers/noteController.js` to process image MIME types.

### Database Impact
- `Note` model: Add `ocrConfidence: FLOAT`, `originalImageUrl: STRING`, `isOcrExtracted: BOOLEAN`.

### API Impact
- `POST /api/notes/ocr-upload` -> accepts `multipart/form-data` image file, returns `{ extractedText, confidence, wordCount }`.

### Infrastructure Impact
Include `tesseract.js` dependency. Ensure worker data files (language training data like `eng.traineddata`) are cached locally or served via CDN.

## Acceptance Criteria
- [ ] Uploading PNG/JPG image extracts readable text within 5 seconds for standard page resolution.
- [ ] Extracted text appears in an editable modal with highlight markers for low-confidence words.
- [ ] User can confirm or edit text before saving as a Note or generating AI Quiz/Flashcards.
- [ ] Unsupported file types (e.g. `.gif`, `.bmp`) rejected with validation error message.
- [ ] Memory allocation of Tesseract workers properly cleaned up post-extraction.

## Edge Cases
- [ ] Extremely blurry or low-light images -> display notification suggesting re-uploading a clearer photo.
- [ ] Large resolution photos (>10MB) -> auto-resize client-side before processing.

## Security Considerations
Sanitize all OCR-extracted text strings before DB insertion or feeding to Gemini prompt templates to prevent prompt injection attacks.

## Accessibility Considerations
Provide alternative manual text entry input field for screen-reader users or when camera image input fails.

## Performance Considerations
Run Tesseract processing inside a worker thread to prevent blocking Express main event loop.

## Testing Requirements

### Unit Tests
- [ ] Test `ocrService` text extraction accuracy on sample test image fixture.

### Integration Tests
- [ ] Upload test image to `/api/notes/ocr-upload` and verify JSON response format and DB payload.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] AI
- [x] Database

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 3 (Hard / Advanced) (ECSoC26-L3)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] OCR sample testing verified
- [ ] Setup guide updated with OCR language data details
- [ ] Ready for production
