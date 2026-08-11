---
title: '[FEAT]: Dynamic AI Exam Readiness Score Predictor & Knowledge Gap Radar Chart'
labels: 'ECSoC26, ECSoC26-L3, feature, ai, frontend, analytics'
assignees: ''
---

## Issue Type
Feature / AI Analytics

## Priority
P1 High

## Summary
Implement an AI-driven Exam Readiness Engine that computes an overall Readiness Percentage (0-100%) and renders a subject-by-subject Knowledge Radar Chart based on quiz scores, SM-2 flashcard recall memory retention metrics, and daily plan task completion velocity.

## Problem Statement
Students often feel unprepared or anxious before exams because they lack a single composite metric telling them whether they are on track to pass or excel. Raw quiz scores don't account for spaced repetition memory decay or syllabus coverage.

## Current Behavior
The dashboard shows separate raw metrics (total study hours, quiz scores) without synthesising them into an overall readiness probability score or visual radar chart.

## Expected Behavior
1. The platform calculates an **Exam Readiness Index (ERI)** combining:
   - Syllabus Coverage % (weighted 30%)
   - Quiz Accuracy % (weighted 30%)
   - Spaced Repetition Flashcard Memory Retention Stability (weighted 25%)
   - Study Plan Schedule Velocity (weighted 15%)
2. Dashboard renders an interactive **Knowledge Radar Chart** mapping proficiency across core subjects.
3. Gemini AI provides a personalized "Readiness Diagnosis & Recommendation" paragraph highlighting top priority action items.

## User Story
As a student 2 weeks away from final exams  
I want an overall Readiness Score and a radar chart of my weak vs strong subjects  
So that I know exactly which subject area needs urgent revision to maximize my final score  

## Proposed Solution
1. Create `readinessCalculator.js` backend service aggregating quiz attempt history, flashcard review intervals, and study plan completion status.
2. Formulate Gemini API prompt to generate AI diagnostic insights based on aggregated metrics.
3. Build `ExamReadinessWidget.jsx` and `KnowledgeRadarChart.jsx` using Recharts Radar/PolarArea charts.
4. Add countdown readiness trends showing projected readiness score by exam date.

## Technical Scope

### Frontend Impact
- New Components: `frontend/src/components/analytics/ExamReadinessCard.jsx`, `frontend/src/components/analytics/KnowledgeRadarChart.jsx`, `frontend/src/components/analytics/AiDiagnosisPanel.jsx`.

### Backend Impact
- New Controller: `backend/controllers/readinessController.js`.
- New Service: `backend/services/readinessCalculator.js`.
- Route: `backend/routes/readinessRoutes.js`.

### Database Impact
- New Model: `ReadinessSnapshot` (`id`, `userId`, `subjectId`, `readinessScore`, `syllabusCoverage`, `quizAccuracy`, `memoryRetention`, `aiRecommendation` TEXT, `createdAt`).

### API Impact
- `GET /api/readiness/summary` -> returns current composite readiness score, radar chart dataset, and AI diagnosis.
- `POST /api/readiness/recalculate` -> forces fresh metric computation.

### Infrastructure Impact
Ensure backend response caching (1 hour TTL) to prevent repeated Gemini API calls for unchanged performance metrics.

## Acceptance Criteria
- [ ] Composite Readiness Score calculates correctly on a scale of 0 to 100%.
- [ ] Knowledge Radar chart renders at least 3 active subjects with proficiency axes (0 to 100).
- [ ] AI recommendation paragraph highlights specific weak topics and suggested actions.
- [ ] Changing quiz scores or reviewing flashcards updates the readiness snapshot.
- [ ] Projected readiness trajectory plots score forecast up to exam date.

## Edge Cases
- [ ] New user with 0 quizzes taken -> display "Insufficient Data - Take your first quiz to unlock Readiness Insights".
- [ ] Single subject enrolled -> fallback to Bar Chart visualization instead of Radar chart.

## Security Considerations
Ensure readiness endpoints validate user token and return data exclusively for the authenticated user.

## Accessibility Considerations
Provide text table equivalent of radar chart data points for screen readers.

## Performance Considerations
Pre-calculate readiness snapshots in background jobs when a quiz or study plan task is marked complete, ensuring `GET /api/readiness/summary` responds under 30ms.

## Testing Requirements

### Unit Tests
- [ ] Test `readinessCalculator` weighted index algorithm with various accuracy and coverage mock datasets.

### Integration Tests
- [ ] Call `/api/readiness/summary` and verify structure of radar chart payload and diagnostic output.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] Database
- [x] AI
- [x] Dashboard

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 3 (Hard / Advanced) (ECSoC26-L3)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Ready for production
