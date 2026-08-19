---
title: '[FEAT]: Customizable Pomodoro Focus Timer with Lo-Fi Audio Streams & Break Analytics'
labels: 'ECSoC26, ECSoC26-L1, feature, frontend, ui/ux, study-planner, good first issue'
assignees: ''
---

## Issue Type
Feature / UI/UX / Productivity

## Priority
P3 Low

## Summary
Build an integrated Pomodoro Focus Timer component directly in the navigation bar / study planner, featuring customizable work/break durations, ambient lo-fi soundscapes, audio chimes, and session analytics.

## Problem Statement
Students often get distracted during long study sessions. Currently, they must leave the OpenPrep AI workspace to use external timer apps, losing track of actual focus time logged against specific syllabus tasks.

## Current Behavior
No built-in timer exists. Task durations are entered manually or estimated statically.

## Expected Behavior
Users can launch a floating or embedded "Focus Mode" Pomodoro timer (e.g. 25m work / 5m break). The timer plays subtle ambient lo-fi audio, rings an end chime, updates browser tab title with countdown (`(24:50) OpenPrep AI`), and automatically logs completed focus minutes to the active `StudyPlanTask`.

## User Story
As a student  
I want to run a Pomodoro focus timer linked to my active study plan task  
So that I can stay disciplined and automatically record my actual focus hours  

## Proposed Solution
1. Create a `PomodoroTimer.jsx` widget featuring standard controls (Start, Pause, Reset, Skip Break, Settings).
2. Store timer state (Focus, Short Break, Long Break, cycles completed) in a dynamic React context or Redux store slice.
3. Integrate HTML5 Audio element for ambient background sounds (Lo-Fi Beats, Rain, White Noise, Coffee Shop) with volume slider.
4. Auto-update `document.title` and display browser native notification on session completion.

## Technical Scope

### Frontend Impact
- New Context/Store: `frontend/src/context/PomodoroContext.jsx`.
- New Components: `frontend/src/components/timer/PomodoroWidget.jsx`, `frontend/src/components/timer/AmbientAudioPlayer.jsx`, `frontend/src/components/timer/TimerSettingsModal.jsx`.
- Update `frontend/src/components/Navbar.jsx` to show miniature timer widget.

### Backend Impact
- Controller Endpoint update: `backend/controllers/studyPlannerController.js` (`logFocusSession`).

### Database Impact
- Update `StudyPlanTask` model: add `actualMinutesSpent` integer field.

### API Impact
- `POST /api/study-planner/tasks/:id/log-time` -> updates elapsed minutes logged.

### Infrastructure Impact
Include royalty-free audio loop samples in `frontend/public/audio/`.

## Acceptance Criteria
- [ ] Timer accurately counts down with start, pause, and reset controls.
- [ ] Browser tab title reflects live countdown time.
- [ ] Sound selector plays/mutes ambient audio loops cleanly without distortion.
- [ ] Completing a focus session triggers chime audio alert and browser notification.
- [ ] Focus minutes are automatically saved and added to daily study dashboard stats.

## Edge Cases
- [ ] Page reload mid-timer -> persist active timer start timestamp in `localStorage` to resume seamless countdown.
- [ ] Audio autoplay blocked by browser policy -> show gentle inline "Click to enable audio" prompt.

## Security Considerations
Client-side timer state; sanitize logged time payloads on backend to prevent negative or unrealistic hour injection (e.g., max 12 hours continuous).

## Accessibility Considerations
Full keyboard accessibility (Space bar to start/pause), high-contrast timer digits, aria-live status announcements.

## Performance Considerations
Use Web Workers or `requestAnimationFrame` interval checking to prevent background tab timer throttling in Chrome/Firefox.

## Testing Requirements

### Unit Tests
- [ ] Test timer state transitions (Work -> Short Break -> Long Break after 4 cycles).

### Manual Testing
- [ ] Run 1-minute test focus cycle with ambient rain audio, verify end chime and dashboard logged time update.

## Affected Areas
- [x] Frontend
- [x] UI/UX
- [x] Study Planner

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 1 (Easy / Beginner-friendly) (ECSoC26-L1)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Manual testing passed
- [ ] Documentation updated
- [ ] Ready for production
