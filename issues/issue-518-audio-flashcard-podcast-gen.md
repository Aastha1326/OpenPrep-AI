---
title: '[FEAT]: Audio Flashcard Podcast Generator for Hands-Free Listening'
labels: 'ECSoC26, ECSoC26-L3, feature, frontend, backend, ai, flashcards'
assignees: ''
---

## Issue Type
Feature / AI / Audio Generation

## Priority
P1 High

## Summary
Build an automated "Flashcard Audio Podcast Generator" that converts any flashcard deck into a downloadable MP3/WebM audio stream formatted like a conversational revision podcast episode (Host Q&A style with pauses for recall).

## Problem Statement
Students commuting, walking, exercising, or resting their eyes cannot interact with screen-based flashcard interfaces. They lack a tool to convert their flashcard revision decks into structured audio podcasts they can listen to on headphones.

## Current Behavior
Flashcards are reviewed visually card-by-card on screen.

## Expected Behavior
Students click "Export as Audio Podcast" on any deck. The backend generates a stitched audio file (or streams Web Speech / Text-to-Speech audio) structured as: Host states term -> 3-second pause for student recall -> Host states answer and explanation -> Next card.

## User Story
As a student commuting to university  
I want to listen to my flashcard decks as audio podcast episodes with recall pauses  
So that I can revise my study material hands-free while walking or commuting  

## Proposed Solution
1. Build `backend/services/podcastAudioService.js` using Node.js TTS (or `gTTS` / Web Speech synthesis) stitching audio clips.
2. Structure audio timing: Question audio -> 3.5s silent audio buffer -> Answer audio -> Short chime transition.
3. Build frontend `AudioPodcastPlayer.jsx` featuring playlist controls (Play, Pause, 15s Rewind, Speed 0.8x-1.5x, Download MP3).
4. Save podcast episodes in database linked to flashcard deck.

## Technical Scope

### Frontend Impact
- New Component: `frontend/src/components/flashcards/AudioPodcastPlayerModal.jsx`.
- Update `FlashcardsPage.jsx` to render "Listen as Podcast" button.

### Backend Impact
- New Controller: `backend/controllers/podcastController.js`.
- New Service: `backend/services/podcastAudioService.js`.
- Routes: `backend/routes/podcastRoutes.js`.

### Database Impact
- New Model: `PodcastEpisode` (`id`, `userId`, `deckId`, `title`, `audioUrl`, `durationSeconds`).

### API Impact
- `POST /api/flashcards/decks/:id/generate-podcast` -> generates audio file, returns stream URL.

### Infrastructure Impact
Media file storage for generated podcast MP3 files.

## Acceptance Criteria
- [ ] Podcast generator constructs audio file with clear question readout, silent pause interval, and answer explanation.
- [ ] Player controls allow pause, rewind 15 seconds, and speed adjustment (0.8x to 1.5x).
- [ ] Download button provides `.mp3` file for offline listening on mobile devices.
- [ ] Background audio playback continues when browser tab is minimized or screen is locked on mobile.

## Edge Cases
- [ ] Decks with over 50 cards -> offer chapter pagination (Part 1: Cards 1-25, Part 2: Cards 26-50) to keep file sizes manageable.

## Security Considerations
Validate deck ownership before generating audio streams.

## Accessibility Considerations
Full screen reader support and visible live audio transcript captions on screen during playback.

## Performance Considerations
Cache generated audio files in S3 / local disk cache to avoid redundant audio synthesis processing.

## Testing Requirements

### Unit Tests
- [ ] Test audio buffer concatenation and silence interval insertion algorithm.

### Manual Testing
- [ ] Export 10-card deck as podcast, play on mobile browser with screen locked, verify recall pause and audio clarity.

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
