---
title: '[FEAT]: Real-Time Multi-User Collaborative Study Rooms & Live Quiz Battle Lobbies'
labels: 'ECSoC26, ECSoC26-L3, feature, backend, frontend, architecture'
assignees: ''
---

## Issue Type
Feature / Architecture

## Priority
P1 High

## Summary
Implement real-time multi-user study rooms and quiz battle lobbies using `Socket.io` where students can join via a room code, compete on timed quizzes, view live leaderboards, and study synchronously.

## Problem Statement
OpenPrep AI currently offers solo study planning and quiz taking. Students lack interactive social learning mechanisms like group quiz challenges, peer accountability lobbies, and real-time leaderboards.

## Current Behavior
Quizzes and flashcard reviews are strictly individual, single-user asynchronous sessions.

## Expected Behavior
Users can create or join a Study Battle Room via a 6-character room code (e.g. `PREP99`). The room creator sets quiz topic, question count, and timer (e.g., 15s per question). Players see live status (joined/ready), answer questions simultaneously, and receive real-time point updates and final standings.

## User Story
As a student preparing for competitive exams  
I want to create a live quiz room with my classmates  
So that we can test our knowledge against each other in real-time with instant score rankings  

## Proposed Solution
1. Integrate `Socket.io` on Express server (`backend/socket/roomHandler.js`).
2. Add room state manager handling creation, joining, ready status, synced question countdowns, and scoreboard calculations.
3. Build frontend `StudyBattleLobby.jsx` and `LiveQuizBattle.jsx` components using `socket.io-client`.
4. Include live animations for leaderboards, streak multipliers, and battle summary.

## Technical Scope

### Frontend Impact
- Install `socket.io-client` package.
- New views: `frontend/src/pages/StudyBattle.jsx`, `frontend/src/components/battle/BattleLobby.jsx`, `frontend/src/components/battle/LiveQuizCanvas.jsx`, `frontend/src/components/battle/LeaderboardWidget.jsx`.
- New service: `frontend/src/services/socketService.js`.

### Backend Impact
- Install `socket.io` package.
- Update `backend/server.js` to attach Socket.io server instance.
- New modules: `backend/socket/index.js`, `backend/socket/battleHandler.js`, `backend/utils/roomManager.js`.

### Database Impact
- New Model: `BattleSession` (fields: `id`, `roomCode`, `hostUserId`, `topicId`, `status`, `scores` JSONB, `createdAt`).
- New Model: `BattleParticipant` (fields: `battleId`, `userId`, `score`, `correctCount`, `avgTimeMs`).

### API Impact
- `POST /api/battles/create` -> creates room session and generates unique room code.
- `GET /api/battles/:roomCode` -> fetches battle configuration and validity.

### Infrastructure Impact
WebSocket protocol support required on host server. Ensure proper CORS and ping/pong heartbeats configured.

## Acceptance Criteria
- [ ] Host can generate a room with custom topic, question count, and time per question.
- [ ] Participants join instantly via room code with live peer avatar list update.
- [ ] Questions synchronize across all participants with server-authoritative timers.
- [ ] Live leaderboard updates after each question with latency protection.
- [ ] Final results screen presents winner podium, accuracy stats, and XP rewards.

## Edge Cases
- [ ] Participant disconnects mid-game -> preserve socket state for 30s re-connection window.
- [ ] Host leaves lobby before game start -> reassign host role to next connected player.
- [ ] Invalid room code entered -> display clean error modal.

## Security Considerations
- Validate user JWT during socket connection handshake.
- Server-side question validation to prevent client-side answer tampering.

## Accessibility Considerations
High contrast colors for leaderboard rankings, keyboard navigation for option selection under tight timers.

## Performance Considerations
Use in-memory map/Redis for active room states; flush finished session metrics asynchronously to PostgreSQL database.

## Testing Requirements

### Unit Tests
- [ ] Test `roomManager` room code generation, participant add/remove, and score calculation logic.

### Integration Tests
- [ ] Mock multi-client socket connections verifying synchronized event emission (`START_GAME`, `NEXT_QUESTION`, `SUBMIT_ANSWER`).

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] Database
- [x] Architecture

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 3 (Hard / Advanced) (ECSoC26-L3)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Multi-client manual testing verified
- [ ] Socket API documentation added to `docs/`
- [ ] Ready for production
