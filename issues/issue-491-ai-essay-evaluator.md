---
title: '[FEAT]: AI Short-Answer & Subjective Essay Scoring Engine with Interactive Rubric Feedback'
labels: 'ECSoC26, ECSoC26-L3, feature, frontend, backend, ai, quiz-system'
assignees: ''
---

## Issue Type
Feature / AI / Quiz System

## Priority
P1 High

## Summary
Expand the AI Quiz Generator to support non-MCQ descriptive short-answer and essay questions, using Gemini API to evaluate written student answers against a structured rubric with partial credit scoring and detailed improvement suggestions.

## Problem Statement
Currently, the quiz generator evaluates only multiple-choice (MCQ) questions. However, competitive exams and university assessments require written descriptive answers. Students have no automated tool to grade their written explanations or check if key technical concepts are missing.

## Current Behavior
Quizzes consist exclusively of 4-option MCQs evaluated via exact string matching.

## Expected Behavior
Quiz creators can select "Subjective / Short Answer" mode. Students type written responses in a text area. Upon submission, Gemini API evaluates the answer against standard model answers using a 4-part rubric (Conceptual Accuracy, Completeness, Key Terminology, Clarity), providing a score out of 10 and line-by-line feedback.

## User Story
As a student practicing for written subjective exams  
I want the AI to evaluate my handwritten or typed explanations against ideal answer rubrics  
So that I can identify missing technical terms and refine my written answer structure  

## Proposed Solution
1. Update `QuizQuestion` schema to support `questionType: 'MCQ' | 'SUBJECTIVE'`.
2. Construct Gemini 1.5 evaluation prompt in `backend/services/geminiService.js` returning structured JSON (`{ score, maxScore, keyStrengths, missingKeywords, feedback }`).
3. Build frontend `SubjectiveQuestionView.jsx` featuring rich text editor, word count indicator, and animated evaluation results drawer.
4. Provide side-by-side comparison of student answer vs ideal model response.

## Technical Scope

### Frontend Impact
- New Components: `frontend/src/components/quiz/SubjectiveQuestionView.jsx`, `frontend/src/components/quiz/RubricFeedbackCard.jsx`.
- Updates to `frontend/src/components/QuizModal.jsx` to render subjective question types.

### Backend Impact
- New Service Method: `backend/services/geminiService.js` (`evaluateSubjectiveAnswer`).
- Endpoint: `POST /api/quizzes/evaluate-subjective`.

### Database Impact
- Update `QuizQuestion` model: add `questionType` (ENUM), `rubricCriteria` (JSONB), `idealAnswer` (TEXT).
- Update `QuizAttempt` model: store detailed subjective evaluation breakdown object.

### API Impact
- `POST /api/quizzes/evaluate-subjective` -> accepts `questionId`, `userAnswerText`, returns score breakdown & feedback.

### Infrastructure Impact
Uses Gemini API text completion. Stream evaluation response to reduce perceived latency.

## Acceptance Criteria
- [ ] Subjective questions display question prompt, max points, and key criteria tags.
- [ ] Evaluation prompt accurately grades conceptual correctness even if phrasing differs from model answer.
- [ ] Displays numerical score, missing keywords highlight list, and actionable suggestions.
- [ ] Includes word count counter and minimum response length check (e.g., 20 words).
- [ ] Re-evaluating or reviewing past attempts presents historical feedback logs.

## Edge Cases
- [ ] Off-topic / empty answer submitted -> return 0 points with explicit feedback flag ("Answer insufficient or off-topic").
- [ ] Code block snippets in technical answers -> parse and highlight syntax correctly in evaluation output.

## Security Considerations
Sanitize all submitted subjective text to prevent prompt injection attempts aimed at manipulating the grading prompt.

## Accessibility Considerations
Ensure screen-reader compatible status alerts during AI evaluation processing state.

## Performance Considerations
Cache evaluation rubrics; limit maximum student response length to 1,000 words per question to control API token costs.

## Testing Requirements

### Unit Tests
- [ ] Test subjective evaluation JSON response validator and score parser.

### Integration Tests
- [ ] Mock Gemini API responses for correct, partially correct, and incorrect subjective answers.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] AI
- [x] Quiz System

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 3 (Hard / Advanced) (ECSoC26-L3)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Integration testing passed
- [ ] API documentation updated
- [ ] Ready for production
