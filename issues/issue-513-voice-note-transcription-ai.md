---
title: '[FEAT]: Speech-to-Text Voice Note Recorder with Automated AI Bullet-Point Summarization'
labels: 'ECSoC26, ECSoC26-L2, feature, frontend, backend, ai'
assignees: ''
---

## Issue Type
Feature / AI / Audio Processing

## Priority
P2 Medium

## Summary
Add an in-browser audio voice recorder component that captures lecture audio, transcribes speech to text using Web Speech API or OpenAI Whisper API, and generates structured AI bullet-point summaries and key takeaway cards using Gemini API.

## Problem Statement
Students attending live lectures or recorded study sessions struggle to write comprehensive notes while listening to professors. They need a tool to record voice notes directly in the workspace and convert spoken lectures into structured text notes automatically.

## Current Behavior
Notes can only be created by manually typing text or pasting existing documents.

## Expected Behavior
Clicking "Record Voice Note" in the Notes Editor records audio from the microphone. Upon stopping recording, the transcript is generated and passed to Gemini API to auto-create a structured note complete with Title, Key Concepts, Formulas Mentioned, and Action Items.

## User Story
As a student attending live or online lectures  
I want to record audio notes and have AI transcribe and summarize them into structured revision notes  
So that I can focus on listening without worrying about missing important lecture details  

## Proposed Solution
1. Use `MediaRecorder` API in browser to capture audio blob (`audio/webm` or `audio/mp3`).
2. Transcribe via Web Speech API or backend speech transcription pipeline.
3. Pass raw lecture transcript to Gemini API with specialized prompt: "Summarize this lecture into structured sections: Core Topic, Key Takeaways, Formulas/Definitions, and Exam Warning Points".
4. Insert generated note object directly into the `NoteEditor.jsx` interface.

## Technical Scope

### Frontend Impact
- New Component: `frontend/src/components/notes/VoiceNoteRecorderModal.jsx`, `frontend/src/components/notes/AudioWaveformVisualizer.jsx`.
- Update `frontend/src/pages/NotesPage.jsx`.

### Backend Impact
- New Controller: `backend/controllers/audioNoteController.js`.
- Route: `POST /api/notes/transcribe-and-summarize`.

### Database Impact
- Update `Note` model: add `audioUrl` (STRING) and `isVoiceNote` (BOOLEAN).

### API Impact
- `POST /api/notes/transcribe-and-summarize` -> accepts multipart audio file or raw transcript text, returns formatted structured note JSON.

### Infrastructure Impact
Upload audio blobs to local `uploads/audio` or Cloud storage if configured.

## Acceptance Criteria
- [ ] Record button captures audio from microphone with real-time waveform visualization.
- [ ] Speech recognition or backend transcriber converts audio into text accurately.
- [ ] Gemini API generates structured markdown note with headings, bullet points, and key terms.
- [ ] User can listen back to recorded audio file while reviewing the generated note.

## Edge Cases
- [ ] Background noise or silent audio recorded -> display alert: "No speech detected in audio recording. Please try again."

## Security Considerations
Require explicit user microphone permission prompt; sanitize transcribed text to prevent injection.

## Accessibility Considerations
Provide full manual text editing access to transcripts for hearing-impaired users.

## Performance Considerations
Compress audio recorded in webm format; limit single recording session to 30 minutes to manage memory.

## Testing Requirements

### Unit Tests
- [ ] Test audio blob handler and AI summarization prompt formatter functions.

### Manual Testing
- [ ] Speak 1-minute lecture sample into recorder, verify audio waveform, transcript generation, and structured note output.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] AI

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
