---
title: '[FEAT]: AI Practice Interview Simulator for Oral Vivas & Technical viva Voce Questions'
labels: 'ECSoC26, ECSoC26-L3, feature, frontend, backend, ai'
assignees: ''
---

## Issue Type
Feature / AI / Mentorship

## Priority
P1 High

## Summary
Build an interactive AI Oral Viva Voce Interview Simulator powered by Gemini 1.5 API where students practice real-time conversational technical interviews, answering audio/text follow-up questions with instant rubric evaluations.

## Problem Statement
University practical exams and competitive interviews feature oral viva voce examinations where examiners ask dynamic follow-up questions based on student responses. Students currently have no practice tool to simulate pressure-filled viva voce oral questioning.

## Current Behavior
The platform supports static multiple-choice and written descriptive questions, but lacks conversational multi-turn AI viva simulations.

## Expected Behavior
Students select a subject (e.g. Operating Systems or Organic Chemistry) and launch "AI Viva Voce Mode". An AI Examiner persona asks an opening technical question. The student responds via speech or text. The AI evaluates the answer, asks probing follow-up questions based on student answers, and provides a final Viva Scorecard.

## User Story
As a university STEM student preparing for practical viva exams  
I want to practice interactive multi-turn viva oral interviews with an AI examiner  
So that I can build confidence answering follow-up technical questions under exam pressure  

## Proposed Solution
1. Create dynamic Gemini API system prompt representing a strict yet supportive academic examiner persona.
2. Build multi-turn session manager in `backend/services/vivaService.js` maintaining conversation history context.
3. Build frontend `VivaSimulatorCanvas.jsx` featuring speech-to-text input, avatar speech animation, and real-time confidence indicator.
4. Generate comprehensive Viva Performance Scorecard (Conceptual Depth, Technical Accuracy, Response Time, Communication Clarity).

## Technical Scope

### Frontend Impact
- New Directory: `frontend/src/components/viva/`.
- New Components: `VivaSimulatorCanvas.jsx`, `ExaminerAvatar.jsx`, `VivaScorecardModal.jsx`.
- New Page: `frontend/src/pages/VivaSimulator.jsx`.

### Backend Impact
- New Controller: `backend/controllers/vivaController.js`.
- New Service: `backend/services/vivaService.js`.
- Routes: `backend/routes/vivaRoutes.js`.

### Database Impact
- New Model: `VivaSession` (`id`, `userId`, `subjectId`, `turns` JSONB, `score`, `feedback` JSONB).

### API Impact
- `POST /api/viva/start` -> initiates session with examiner persona.
- `POST /api/viva/respond` -> submits student answer, returns next AI question and live evaluation.
- `POST /api/viva/evaluate` -> completes session and generates final scorecard.

### Infrastructure Impact
Uses Gemini API multi-turn chat completions (`google-generative-ai` SDK).

## Acceptance Criteria
- [ ] AI Examiner asks relevant course-specific viva questions and logical follow-ups.
- [ ] Speech input registers student verbal response and converts to text accurately.
- [ ] End-of-viva scorecard displays score out of 100, topic mastery breakdown, and constructive advice.
- [ ] Session allows 5 to 10 multi-turn question exchanges before completing evaluation.

## Edge Cases
- [ ] Student gives vague or incomplete answer -> AI examiner asks targeted clarifying question ("Can you explain the mathematical derivation for that statement?").

## Security Considerations
Sanitize conversational transcript inputs; enforce user quota on multi-turn API sessions.

## Accessibility Considerations
Full text input fallback for speech recognition; screen reader accessible chat history layout.

## Performance Considerations
Stream Gemini API response chunks (`generateContentStream`) for instant typewriter question rendering.

## Testing Requirements

### Unit Tests
- [ ] Test viva prompt builder and multi-turn state aggregator utility functions.

### Manual Testing
- [ ] Run 5-turn viva session on "Database Indexing", respond via speech, verify follow-up question relevance and final scorecard export.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] AI

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
