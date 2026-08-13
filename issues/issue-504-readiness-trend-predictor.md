---
title: '[FEAT]: AI Diagnostic Exam Readiness Score Simulation with Historical Trend Prediction'
labels: 'ECSoC26, ECSoC26-L2, feature, frontend, backend, ai, dashboard'
assignees: ''
---

## Issue Type
Feature / AI / Dashboard Analytics

## Priority
P2 Medium

## Summary
Enhance the Dashboard Exam Readiness Predictor by calculating a predictive score model that projects target exam performance (e.g. 85%) based on current quiz score velocity, topic coverage, and spaced repetition retention rates.

## Problem Statement
The readiness predictor currently displays a static current score percentage. Students cannot see projected score trajectories or determine if their current daily study pace will allow them to achieve their target score before their upcoming exam date.

## Current Behavior
Readiness score is calculated as a simple static average of historical quiz accuracy.

## Expected Behavior
The Readiness Predictor widget displays current readiness (e.g., 72%), target goal (e.g., 90%), projected readiness at exam date based on current velocity (e.g., 86%), and an interactive "Study Intensity Slider" (e.g., +1 hr/day -> +5% score bump).

## User Story
As a student preparing for an upcoming exam  
I want to see projected readiness score trends based on my daily study velocity  
So that I can adjust my daily study hours to hit my target score before exam day  

## Proposed Solution
1. Implement a predictive calculation algorithm in `backend/utils/predictiveModel.js` factoring in topic coverage, recent quiz accuracy weighting (exponential decay), and spaced repetition stability.
2. Build frontend `ExamReadinessPredictor.jsx` with interactive line chart (Recharts) showing historical vs projected score curves.
3. Add interactive "Target Score & Hours Simulator" slider adjusting target projection in real time.

## Technical Scope

### Frontend Impact
- Component Update: `frontend/src/components/dashboard/ExamReadinessPredictor.jsx`.
- New Component: `frontend/src/components/dashboard/ReadinessVelocityChart.jsx`.

### Backend Impact
- New Utility: `backend/utils/predictiveModel.js`.
- Updates to `backend/controllers/dashboardController.js`.

### Database Impact
None. Uses existing attempt and plan data.

### API Impact
- `GET /api/dashboard/readiness-projection?targetExamDate=2026-09-01&dailyHours=3` -> returns projected readiness trajectory data points.

### Infrastructure Impact
Client/server mathematical model execution.

## Acceptance Criteria
- [ ] Displays interactive Recharts line chart mapping historical score velocity vs projected trajectory.
- [ ] Adjusting daily study hours slider dynamically recalculates projected score curve.
- [ ] Flags "Target Score at Risk" warning if projected score falls below target score on exam date.
- [ ] Provides AI-generated recommendation list of top 3 high-weightage topics to study to close score gap.

## Edge Cases
- [ ] Exam date passed or not set -> default to 30-day projection window.
- [ ] Fewer than 3 quiz attempts -> display "Insufficient attempt data to model projection" state.

## Security Considerations
Validate query parameters to prevent integer overflow or injection in simulator queries.

## Accessibility Considerations
Ensure line chart data points have textual tabular fallback for screen readers.

## Performance Considerations
Memoize projection mathematical calculations to run under 10ms on client side.

## Testing Requirements

### Unit Tests
- [ ] Test predictive score model algorithm with various study velocity inputs.

### Manual Testing
- [ ] Change daily study hours slider from 2h to 4h, verify projected curve shifts upward on readiness chart.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] AI
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
