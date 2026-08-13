---
title: '[FEAT]: Daily Exam Countdown Widget & Revision Target Velocity Tracker'
labels: 'ECSoC26, ECSoC26-L1, feature, frontend, dashboard, good first issue'
assignees: ''
---

## Issue Type
Feature / Frontend / Dashboard

## Priority
P3 Low

## Summary
Add a prominent "Exam Countdown & Velocity Tracker" card on the main dashboard showing days remaining until the target exam date, daily required study hours vs actual logged hours, and revision pace indicators.

## Problem Statement
Students lack a visual countdown reminding them of upcoming exam target dates. Without a daily study pace tracker, students fall behind schedule without realizing how many daily study hours are needed to complete their remaining syllabus topics.

## Current Behavior
Target exam date is saved in study plan settings but not highlighted prominently on the primary dashboard view.

## Expected Behavior
A prominent Dashboard card displays "Days Remaining to Target Exam" (e.g. `18 Days Left`), a circular progress ring showing daily completed vs required study hours (`3.5 / 4.0 Hrs Logged Today`), and a velocity status indicator (`On Track`, `Slightly Behind`, `Urgent Pace Adjustment Needed`).

## User Story
As a student preparing under deadline  
I want a clear exam countdown and daily study pace velocity widget on my dashboard  
So that I stay aware of exam deadlines and log sufficient study hours each day  

## Proposed Solution
1. Create `ExamCountdownCard.jsx` featuring dynamic circular progress ring (SVG or CSS radial progress).
2. Calculate required daily study velocity based on total uncompleted `StudyPlanTask` items divided by days remaining until `examDate`.
3. Add quick "Log Study Session" action button directly inside the card.

## Technical Scope

### Frontend Impact
- New Component: `frontend/src/components/dashboard/ExamCountdownCard.jsx`.
- Update `frontend/src/pages/Dashboard.jsx`.

### Backend Impact
Update `GET /api/dashboard/stats` payload to include `daysUntilExam` and `requiredDailyMinutes`.

### Database Impact
None. Uses existing `user.examDate` and `StudyPlanTask` tables.

### API Impact
- `GET /api/dashboard/stats` -> includes calculated exam countdown and velocity metrics.

### Infrastructure Impact
Client-side UI widget.

## Acceptance Criteria
- [ ] Displays exact days, hours, and minutes remaining until target exam date.
- [ ] Circular progress ring updates in real time as study time is logged.
- [ ] Displays pace status badge ("On Track" green, "Slightly Behind" yellow, "Action Required" red).
- [ ] Exam date picker modal allows updating target exam date with 1 click.

## Edge Cases
- [ ] Target exam date is today or in the past -> display "Exam Day Today!" or prompt user to archive plan and set next exam target.

## Security Considerations
None.

## Accessibility Considerations
Ensure countdown digits and progress ring values are announced cleanly by screen readers (`aria-label="18 days remaining until exam"`).

## Performance Considerations
Lightweight timer hook using `setInterval` checking once per minute.

## Testing Requirements

### Unit Tests
- [ ] Test exam countdown calculation and velocity pace categorization logic.

### Manual Testing
- [ ] Set exam date 10 days in future, log 2 study hours, verify progress ring and pace status badge updates.

## Affected Areas
- [x] Frontend
- [x] Dashboard

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
