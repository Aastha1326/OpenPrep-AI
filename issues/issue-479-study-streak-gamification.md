---
title: '[FEAT]: Daily Study Streak Counter, Unlockable Achievement Badges, and XP Rewards System'
labels: 'ECSoC26, ECSoC26-L2, feature, backend, frontend, gamification'
assignees: ''
---

## Issue Type
Feature / Gamification

## Priority
P2 Medium

## Summary
Implement a complete study gamification system featuring an accurate daily activity streak counter, XP points for completed study tasks, unlockable achievement badges (e.g., "Night Owl", "Quiz Master", "7-Day Streak"), and a user level progress bar.

## Problem Statement
Exam preparation requires consistent daily habits over extended periods. Without gamified incentives, visual progression cues, and streak maintenance rewards, student retention drops after the initial few study sessions.

## Current Behavior
The dashboard shows basic activity metrics, but lacks gamification systems, XP leveling, streak freeze capabilities, or earnable achievement badges.

## Expected Behavior
1. Users gain XP points for key actions:
   - Completing a daily study plan task (+50 XP)
   - Finishing a quiz (+100 XP)
   - Reviewing a flashcard deck (+30 XP)
2. Daily Streak counter increments when a user logs in and completes at least 1 study task per calendar day (UTC/Local user timezone).
3. Earning XP updates user Level (e.g., Level 1 "Novice Prep" to Level 10 "Exam Scholar").
4. Achievement Badges unlock automatically with popup modal animations.

## User Story
As a student striving for daily consistency  
I want to see my daily streak count, level up with XP, and earn badges  
So that I feel motivated to log in and complete study tasks every single day  

## Proposed Solution
1. Create `gamificationService.js` to calculate XP gains, level thresholds, and check badge criteria after activities.
2. Build `StreakWidget.jsx` and `AchievementBadgesGrid.jsx` on the main dashboard.
3. Add `StreakFreeze` item allowing users to maintain streaks if they miss a single day.
4. Trigger celebratory confetti animations (`canvas-confetti`) when unlocking new badges or leveling up.

## Technical Scope

### Frontend Impact
- Install `canvas-confetti` package.
- Components: `frontend/src/components/gamification/StreakWidget.jsx`, `frontend/src/components/gamification/BadgeCard.jsx`, `frontend/src/components/gamification/LevelProgressBar.jsx`, `frontend/src/components/gamification/BadgeUnlockModal.jsx`.

### Backend Impact
- New Service: `backend/services/gamificationService.js`.
- Controller updates: Trigger XP awards in `quizController`, `studyPlanController`, `flashcardController`.

### Database Impact
- `User` model updates: `xp: INTEGER`, `level: INTEGER`, `currentStreak: INTEGER`, `longestStreak: INTEGER`, `lastActivityDate: DATEONLY`, `streakFreezesAvailable: INTEGER`.
- New Model: `UserBadge` (`id`, `userId`, `badgeCode`, `unlockedAt`).

### API Impact
- `GET /api/gamification/summary` -> returns user XP, streak details, and earned badges list.
- `POST /api/gamification/streak-freeze/use` -> consumes streak freeze token.

### Infrastructure Impact
None.

## Acceptance Criteria
- [ ] Streak increments by +1 if task completed within 24-48 hour window of last activity.
- [ ] Streak resets to 0 if >48 hours elapse without activity (unless streak freeze is active).
- [ ] Completing quizzes and study planner tasks correctly grants designated XP amount.
- [ ] Crossing XP thresholds increments user Level and triggers celebratory frontend modal.
- [ ] Badges correctly unlock when criteria are met (e.g., "Quiz Master" after 10 completed quizzes).

## Edge Cases
- [ ] Timezone differences -> calculate activity dates using user's client timezone offset.
- [ ] Rapid task completion spam -> cap maximum XP earned per hour to prevent exploitation.

## Security Considerations
All XP gains and badge conditions must be calculated server-side; client endpoints cannot arbitrarily submit XP gain amounts.

## Accessibility Considerations
Ensure screen readers announce badge unlocks via `aria-live="polite"` and provide alternative text descriptions for visual badge icons.

## Performance Considerations
Check badge unlock conditions in background worker queues or post-controller response hooks so core API responses remain fast.

## Testing Requirements

### Unit Tests
- [ ] Test `gamificationService` streak counter calculation across edge date boundaries (calendar day rolls, leap years).
- [ ] Test level calculation formula (`level = Math.floor(Math.sqrt(xp / 100)) + 1`).

### Integration Tests
- [ ] Complete a quiz via API and verify `xp` and `UserBadge` rows are created.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] Database
- [x] Dashboard

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 2 (Medium / Intermediate) (ECSoC26-L2)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Unit & integration tests passing
- [ ] Dashboard UI updated with streak widget
- [ ] Ready for production
