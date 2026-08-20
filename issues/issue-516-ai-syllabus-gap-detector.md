---
title: '[FEAT]: AI Syllabus Coverage Gap Detector & PDF Exam Syllabus Importer'
labels: 'ECSoC26, ECSoC26-L3, feature, frontend, backend, ai, study-planner'
assignees: ''
---

## Issue Type
Feature / AI / Study Planner

## Priority
P1 High

## Summary
Build an AI-powered PDF Syllabus Importer & Coverage Gap Detector that parses official university/exam syllabus PDFs, extracts module hierarchies, compares them against user's logged notes and quiz attempts, and highlights unstudied syllabus gaps.

## Problem Statement
Students often miss critical sub-topics buried in long official exam syllabus documents. There is no automated tool to cross-reference an official PDF syllabus against a student's actual study notes and quiz performance to flag unstudied "syllabus blind spots".

## Current Behavior
Study plans are created by manually typing subject names and topic lists.

## Expected Behavior
Students upload an official PDF syllabus document. Gemini 1.5 API extracts modules, sub-topics, and topic weightages. The system compares syllabus topics against the user's notes and quiz attempts, highlighting topics as "Covered", "Partially Covered", or "Unstudied Gap".

## User Story
As a student preparing for competitive board/university exams  
I want to upload my official syllabus PDF and detect unstudied topic gaps  
So that I can ensure 100% of required syllabus topics are covered before exam day  

## Proposed Solution
1. Use `pdf-parse` in Node.js backend to extract text from official syllabus PDFs.
2. Structure Gemini 1.5 API prompt to parse syllabus hierarchy into structured JSON (`{ module, topic, subtopics: [], weightage }`).
3. Build `backend/services/gapDetectorService.js` to cross-reference extracted topics against user's `Note` and `QuizAttempt` tables.
4. Build frontend `SyllabusCoverageMatrix.jsx` displaying visual coverage progress bars and 1-click "Generate Notes for Gap" buttons.

## Technical Scope

### Frontend Impact
- New Components: `frontend/src/components/planner/SyllabusUploaderModal.jsx`, `frontend/src/components/planner/SyllabusCoverageMatrix.jsx`.
- Update `frontend/src/pages/StudyPlanner.jsx`.

### Backend Impact
- Package: `pdf-parse`.
- New Controller: `backend/controllers/syllabusController.js`.
- New Service: `backend/services/gapDetectorService.js`.
- Routes: `backend/routes/syllabusRoutes.js`.

### Database Impact
- New Models: `Syllabus`, `SyllabusTopic` (`id`, `syllabusId`, `title`, `coverageStatus`, `linkedNoteId`).

### API Impact
- `POST /api/syllabus/upload` -> parses PDF syllabus, returns topic hierarchy.
- `GET /api/syllabus/:id/gap-analysis` -> calculates coverage percentages and returns unstudied gap topic list.

### Infrastructure Impact
Handles PDF parsing and Gemini API schema generation.

## Acceptance Criteria
- [ ] Uploading official PDF syllabus parses modules and sub-topics accurately.
- [ ] Topic matrix correctly categorizes topics into Covered (Green), Partial (Yellow), and Gap (Red).
- [ ] Clicking an "Unstudied Gap" topic offers 1-click button to generate AI notes or flashcards for that topic.
- [ ] Displays overall Syllabus Coverage Percentage indicator on dashboard.

## Edge Cases
- [ ] Multi-column or scanned image PDF syllabus -> route through OCR engine if plain text extraction yields low word count.

## Security Considerations
Validate PDF file uploads (MIME type checking and virus scanning) to prevent malicious upload vulnerabilities.

## Accessibility Considerations
Ensure coverage matrix table complies with screen reader accessibility standards.

## Performance Considerations
Cache parsed syllabus JSON structure; execute gap cross-referencing in single optimized SQL query.

## Testing Requirements

### Unit Tests
- [ ] Test gap detector algorithm matching note keywords to syllabus topics.

### Manual Testing
- [ ] Upload sample 3-page syllabus PDF, view coverage matrix, click unstudied gap topic, verify instant AI note generation.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] AI
- [x] Study Planner

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
