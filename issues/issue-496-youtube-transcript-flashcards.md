---
title: '[FEAT]: AI Flashcard Auto-Generation from YouTube Lecture Video Transcripts & Timestamps'
labels: 'ECSoC26, ECSoC26-L3, feature, frontend, backend, ai, flashcards'
assignees: ''
---

## Issue Type
Feature / AI / Flashcards

## Priority
P1 High

## Summary
Integrate a YouTube video URL parser and transcript fetcher (`youtube-transcript`) paired with Gemini 1.5 API to automatically extract key concepts, definitions, and timestamps into interactive flashcard decks.

## Problem Statement
Students spend hours manually watching recorded video lectures and writing down study notes. They lack an automated tool to parse online lecture videos (e.g. YouTube playlists/tutorials) directly into flashcard revision decks with timestamp references.

## Current Behavior
Users can only generate flashcards by manually typing text or uploading PDF documents.

## Expected Behavior
Users paste a YouTube video URL into the Flashcard Generator. The system fetches the video transcript, feeds it to Gemini API to extract high-yield concept pairs, and creates a flashcard deck where each card includes a "Jump to Video Timestamp" link (`youtube.com/watch?v=...&t=120s`).

## User Story
As a student watching online video lectures  
I want to generate flashcards directly from a YouTube video URL with timestamp links  
So that I can quickly review key lecture moments without re-watching hours of video  

## Proposed Solution
1. Use `youtube-transcript` or `youtube-captions-scraper` in Node.js backend to fetch closed captions / auto-generated transcript text and timestamps.
2. Structure Gemini API prompt to extract core QA pairs formatted with starting timestamp seconds.
3. Build frontend `YouTubeFlashcardImporter.jsx` component with video preview embed and timestamp seek controls.
4. Save flashcard items with `videoUrl` and `timestampSeconds` metadata.

## Technical Scope

### Frontend Impact
- New Component: `frontend/src/components/flashcards/YouTubeFlashcardImporter.jsx`.
- Updates to `frontend/src/components/FlashcardReview.jsx` to render clickable timestamp badges.

### Backend Impact
- New Controller: `backend/controllers/youtubeController.js`.
- Route: `POST /api/flashcards/generate-from-youtube`.

### Database Impact
- Update `Flashcard` model: add `sourceUrl` (STRING) and `timestampSeconds` (INTEGER).

### API Impact
- `POST /api/flashcards/generate-from-youtube` -> accepts `{ videoUrl, deckName }`, returns generated flashcards with timestamps.

### Infrastructure Impact
Uses standard YouTube public transcript API; handles missing captions gracefully.

## Acceptance Criteria
- [ ] Paste valid YouTube URL parses captions and returns list of flashcards.
- [ ] Flashcards include timestamp badge (e.g. "04:15") that opens video modal at exact timestamp.
- [ ] Handles videos with disabled captions by showing clean user error modal.
- [ ] Supports playlist URL import up to 5 videos.

## Edge Cases
- [ ] Non-English video captions -> detect language and pass translation instructions to Gemini API.

## Security Considerations
Validate YouTube URL regex pattern on server side to prevent SSRF (Server-Side Request Forgery) attacks.

## Accessibility Considerations
Ensure video player embed includes standard keyboard accessibility and closed caption toggles.

## Performance Considerations
Cache fetched YouTube transcript strings in Redis / memory to avoid hitting rate limits on repeated requests.

## Testing Requirements

### Unit Tests
- [ ] Test YouTube URL regex parser and timestamp converter utility functions.

### Manual Testing
- [ ] Import a 10-minute computer science YouTube tutorial URL and verify generated cards and timestamp playback.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] AI
- [x] Flashcards

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 3 (Hard / Advanced) (ECSoC26-L3)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Manual testing passed
- [ ] Documentation updated
- [ ] Ready for production
