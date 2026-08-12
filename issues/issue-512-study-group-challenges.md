---
title: '[FEAT]: Group Study Challenge Mode with Team Leaderboards & Collaborative Badges'
labels: 'ECSoC26, ECSoC26-L2, feature, frontend, backend, dashboard'
assignees: ''
---

## Issue Type
Feature / Gamification / Social Learning

## Priority
P2 Medium

## Summary
Add a Group Study Challenges feature where study groups or classmates create shared weekly study goals (e.g., "Complete 500 Flashcard Reviews as a Group"), track collective progress bars, and unlock team XP badges.

## Problem Statement
While individual streaks motivate single users, students studying in peer groups or university cohorts lack collective team goals, shared leaderboards, and collaborative gamification mechanisms to keep group members accountable.

## Current Behavior
Gamification features (streaks, XP) are purely single-user metrics without group options.

## Expected Behavior
Users can create or join a "Study Squad" (e.g. "MedSchool 2026 Squad"). The squad sets weekly target goals. A shared team dashboard displays individual contribution progress bars, weekly group leaderboard rankings, and unlockable group badges ("Midnight Grind Squad", "1,000 Questions Solved").

## User Story
As a member of a study group  
I want to join a team challenge and contribute my study hours and quiz scores to a group goal  
So that my study group can motivate each other and earn collective team achievements  

## Proposed Solution
1. Create `StudySquad` and `SquadMember` models in PostgreSQL database.
2. Create `SquadChallenge` model with fields (`targetXp`, `currentXp`, `startDate`, `endDate`).
3. Build frontend `StudySquadDashboard.jsx` featuring group progress bars, member contribution lists, and badge showcases.
4. Add auto-sync triggers updating group XP whenever members complete quizzes or flashcard sessions.

## Technical Scope

### Frontend Impact
- New Directory: `frontend/src/components/squads/`.
- New Components: `StudySquadDashboard.jsx`, `CreateSquadModal.jsx`, `SquadLeaderboard.jsx`.
- New View: `frontend/src/pages/SquadsPage.jsx`.

### Backend Impact
- New Controllers: `backend/controllers/squadController.js`, `backend/controllers/challengeController.js`.
- Routes: `backend/routes/squadRoutes.js`.

### Database Impact
- New Models: `StudySquad`, `SquadMember`, `SquadChallenge`, `SquadAchievement`.

### API Impact
- `POST /api/squads/create` -> creates study group.
- `POST /api/squads/:id/join` -> join group via squad invite code.
- `GET /api/squads/:id/dashboard` -> returns group analytics & active challenge progress.

### Infrastructure Impact
Uses existing PostgreSQL database and WebSocket server for live leaderboard updates.

## Acceptance Criteria
- [ ] Users can create squad, generate 6-character squad join code, and invite classmates.
- [ ] Shared team challenge progress bar updates dynamically as members log study sessions.
- [ ] Group Leaderboard ranks squad members by weekly XP contribution.
- [ ] Unlocking team goal triggers confetti animation and awards squad achievement badge to all members.

## Edge Cases
- [ ] Member leaves squad -> recalculate active challenge XP tally cleanly without dropping squad totals.

## Security Considerations
Validate squad invite code integrity; restrict squad management actions (remove member, edit challenge) to squad admin role.

## Accessibility Considerations
Ensure progress bars have accessible text labels (`aria-valuenow`, `aria-valuemax`).

## Performance Considerations
Cache active squad metrics in Redis to handle frequent progress updates.

## Testing Requirements

### Unit Tests
- [ ] Test squad XP aggregation and member contribution calculation functions.

### Manual Testing
- [ ] Create 3-member squad, complete a 10-question quiz, verify squad total XP increases by quiz score amount.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] Dashboard

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
