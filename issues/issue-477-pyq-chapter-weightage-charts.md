---
title: '[FEAT]: Automated PDF PYQ Chapter Weightage & Topic Trend Analyzer with Visual Charts'
labels: 'ECSoC26, ECSoC26-L3, feature, backend, frontend, analytics'
assignees: ''
---

## Issue Type
Feature / Analytics

## Priority
P1 High

## Summary
Build a PYQ (Previous Year Questions) analysis module that processes batch PDF exam papers, extracts chapter question frequency using Gemini API, and visualizes chapter weightage percentages using interactive Chart.js/Recharts graphs.

## Problem Statement
Students spend hours manually counting past exam paper questions to figure out high-yield chapters versus low-yield topics. OpenPrep AI needs an automated parser that analyzes multiple years of exam papers (e.g. 2020-2025) and presents actionable frequency charts.

## Current Behavior
The platform allows PDF note uploads, but lacks structured multi-year PYQ parsing, topic distribution metrics, and trend visual analytics.

## Expected Behavior
1. Users upload up to 10 past exam paper PDFs for a subject.
2. Backend extracts text via `pdf-parse` and prompts Gemini API to output structured JSON categorizing questions into Subject Chapters and difficulty levels.
3. Dashboard displays:
   - Chapter Weightage Bar Chart (% of total marks per chapter).
   - Topic Frequency Heatmap (recurring questions across years).
   - Recommended High-Yield Chapter Priority List.

## User Story
As a student preparing for board or entrance exams  
I want to upload past 5 years of exam papers  
So that I can visually identify which 20% of chapters account for 80% of exam marks  

## Proposed Solution
1. Create `pyqAnalyzerService.js` to extract text from multi-page PDFs and chunk prompt requests for Gemini API.
2. Enforce structured JSON schema response from Gemini API containing chapter names, mark allocations, and question topics.
3. Build `PYQAnalyticsDashboard.jsx` using Recharts for interactive visualization (BarChart, PieChart, Heatmap Grid).
4. Allow exporting PYQ analysis summary reports as PDF.

## Technical Scope

### Frontend Impact
- New Page: `frontend/src/pages/PYQAnalytics.jsx`.
- New Components: `frontend/src/components/pyq/ChapterWeightageChart.jsx`, `frontend/src/components/pyq/TopicHeatmap.jsx`, `frontend/src/components/pyq/PYQUploadModal.jsx`.

### Backend Impact
- New Controller: `backend/controllers/pyqController.js`.
- New Service: `backend/services/pyqAnalyzerService.js`.
- Route Additions: `backend/routes/pyqRoutes.js`.

### Database Impact
- New Model: `PYQAnalysis` (`id`, `subjectId`, `examName`, `yearRange`, `weightageData` JSONB, `totalQuestions`, `userId`).
- New Model: `PYQQuestion` (`id`, `pyqAnalysisId`, `chapterName`, `topicName`, `questionText`, `marks`, `year`).

### API Impact
- `POST /api/pyq/analyze` -> accepts array of PDF files, returns structured analysis object.
- `GET /api/pyq/subject/:subjectId` -> returns historical analysis results.

### Infrastructure Impact
Ensure server file upload buffer limits handle up to 25MB total payload for multi-pdf uploads.

## Acceptance Criteria
- [ ] Multi-PDF upload accepts 1 to 10 PDF files with progress progress indicators.
- [ ] Gemini API successfully extracts chapters and calculates percentage weightages correctly summing to 100%.
- [ ] Interactive Recharts bar chart displays weightage breakdown by chapter with tooltips.
- [ ] Topic heatmap highlights repeatedly tested concepts across multiple years.
- [ ] User can click a chapter on the chart to generate a targeted flashcard deck or quiz.

## Edge Cases
- [ ] PDF scanned as images (non-selectable text) -> detect zero-text output and route to OCR pipeline.
- [ ] Gemini output JSON malformed -> fall back to strict JSON repair parser.

## Security Considerations
Validate PDF MIME types (`application/pdf`) and sanitize file names before disk storage. Limit processing concurrency to prevent CPU starvation.

## Accessibility Considerations
Ensure chart data is accessible via keyboard-navigable data tables (screen-reader accessible fallback tables).

## Performance Considerations
Cache parsed PYQ analysis results in database so subsequent page views load instantly without re-invoking AI endpoints.

## Testing Requirements

### Unit Tests
- [ ] Test `pyqAnalyzerService` JSON parsing and weightage calculator functions.

### Integration Tests
- [ ] Test `/api/pyq/analyze` endpoint with sample 3-page PDF exam paper fixture.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] Database
- [x] AI
- [x] PYQ Analysis

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 3 (Hard / Advanced) (ECSoC26-L3)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Integration tests passing
- [ ] Documentation updated in `docs/feature-specifications.md`
- [ ] Ready for production
