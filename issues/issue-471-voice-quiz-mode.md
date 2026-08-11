---
title: '[FEAT]: Voice-Controlled Quiz & Flashcard Hands-Free Mode using Web Speech API'
labels: 'ECSoC26, ECSoC26-L2, feature, frontend, accessibility, ui/ux'
assignees: ''
---

## Issue Type
Feature / Accessibility / UI/UX

## Priority
P2 Medium

## Summary
Add a voice-controlled "Hands-Free Mode" to the Quiz Generator and Flashcard Review interfaces using the native Web Speech API (SpeechRecognition and SpeechSynthesis).

## Problem Statement
Currently, students studying while multi-tasking (e.g., writing notes, exercising, commuting) have to manually click or press keys to reveal flashcards, rate difficulty, or select quiz options. Adding voice input and text-to-speech audio prompts allows a completely hands-free revision experience.

## Current Behavior
Users must click UI buttons ("Show Answer", "Easy/Medium/Hard", Option A/B/C/D) using mouse or touch.

## Expected Behavior
Users can toggle "Hands-Free Voice Mode". The system reads out question and options via Text-to-Speech (TTS), listens for spoken commands (e.g., "Option B", "Flip", "Rate 4"), and automatically progresses to the next question.

## User Story
As a student revising on the move  
I want to listen to question prompts and speak my answers aloud  
So that I can complete flashcard sessions hands-free without staring at or touching my screen  

## Proposed Solution
1. Create a `useVoiceControl` custom React hook wrapping `window.SpeechRecognition` (or `webkitSpeechRecognition`) and `window.speechSynthesis`.
2. Add a `VoiceModeToggle` component in `QuizModal.jsx` and `FlashcardReview.jsx`.
3. Provide visual audio waveform/mic status indicators showing listening state (Idle, Listening, Processing, Speaking).
4. Implement voice command mapping:
   - "Flip" / "Show" -> reveals flashcard answer.
   - "One" / "Two" / "Three" / "Four" or "Easy" / "Good" / "Hard" -> registers SM-2 score.
   - "Option A" / "Option B" -> selects quiz answer.
   - "Pause" / "Resume" -> controls flow.

## Technical Scope

### Frontend Impact
- New Hook: `frontend/src/hooks/useVoiceControl.js`
- New Components: `frontend/src/components/VoiceModeToggle.jsx`, `frontend/src/components/AudioWaveform.jsx`
- Updates to `frontend/src/components/FlashcardReview.jsx` and `frontend/src/components/QuizModal.jsx`

### Backend Impact
None (Client-side Web Speech API execution).

### Database Impact
None. Option to persist `voiceEnabled: boolean` in user settings context/localStorage.

### API Impact
None.

### Infrastructure Impact
Uses standard browser Web Speech APIs. Fallback graceful warning for unsupported browsers (e.g., Firefox without speech recognition flag).

## Acceptance Criteria
- [ ] Toggle switch enables/disables voice control in quiz and flashcard views.
- [ ] TTS accurately speaks questions, card fronts, and option labels.
- [ ] Speech recognition listens for specified key phrases and executes actions without false positives.
- [ ] Microphone permission request handled gracefully with browser fallback alert.
- [ ] Full keyboard and visual indicator feedback during active listening.

## Edge Cases
- [ ] Background noise or accent misinterpretation (add confidence score threshold > 0.6).
- [ ] Browser unsupported (Safari / Firefox) -> show inline notification and fallback to standard buttons.
- [ ] Concurrent speech synthesis and recognition collision -> auto-mute mic while TTS is speaking.

## Security Considerations
Requires HTTPS in production for SpeechRecognition API permissions. Ensure audio buffers are processed entirely on-device and never stored or sent to remote servers.

## Accessibility Considerations
Includes screen-reader announcements (ARIA live regions) and high-visibility status icons for hearing/visually impaired users.

## Performance Considerations
Lightweight hook execution; destroy speech recognition instances on component unmount to prevent memory leaks.

## Testing Requirements

### Unit Tests
- [ ] Test `useVoiceControl` state changes (listening, speaking, command parsing logic).

### Manual Testing
- [ ] Test hands-free run through 5 flashcards using voice commands.
- [ ] Test browser unsupported fallback on Firefox.

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
- [ ] Documentation updated in frontend architecture docs
- [ ] Ready for production
