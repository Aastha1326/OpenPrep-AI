---
title: '[DOCS]: Interactive Architecture Component Diagrams & End-to-End Flowcharts'
labels: 'ECSoC26, ECSoC26-L1, documentation, good first issue'
assignees: ''
---

## Issue Type
Documentation / Architecture / Developer Experience

## Priority
P3 Low

## Summary
Add comprehensive Mermaid.js component architecture diagrams, sequence diagrams for core user workflows (Quiz generation, Spaced repetition, Auth tokens), and updated deployment flowcharts in `docs/architecture.md`.

## Problem Statement
While high-level markdown guides exist, new open-source contributors struggle to visualize data flow between the React frontend, Express API routes, Gemini AI service, Socket.io real-time engine, and PostgreSQL database.

## Current Behavior
`docs/architecture.md` contains basic text descriptions without visual Mermaid diagrams or sequence charts.

## Expected Behavior
`docs/architecture.md` includes interactive Mermaid.js diagrams for: System Architecture Overview, Auth & JWT Refresh Sequence, Gemini AI Question Generation Flow, Socket.io Real-time Quiz Battle Flow, and Database ER Diagram.

## User Story
As a new open-source contributor  
I want clear, visual architecture and sequence diagrams  
So that I can quickly understand the system data flow and start contributing code  

## Proposed Solution
1. Add Mermaid.js code blocks in `docs/architecture.md` covering system topology and data flow.
2. Add sequence diagram for Gemini AI question generation pipeline.
3. Add sequence diagram for Socket.io multiplayer study battle room events.
4. Update `README.md` to link to the visual architecture charts.

## Technical Scope

### Frontend Impact
None.

### Backend Impact
None.

### Database Impact
None.

### API Impact
None.

### Infrastructure Impact
Enhances developer documentation clarity.

## Acceptance Criteria
- [ ] `docs/architecture.md` renders valid GitHub Markdown Mermaid diagrams for System Overview, Auth Sequence, and AI Pipeline.
- [ ] Diagrams accurately reflect active code files, controllers, middleware, and database models.
- [ ] Sequence diagrams document error handling and fallback branches cleanly.
- [ ] All diagram node labels use descriptive file and module names matching repository structure.

## Edge Cases
- [ ] Ensure Mermaid syntax is compatible with GitHub Markdown rendering parser.

## Security Considerations
Ensure diagrams do not expose secret API keys or private production URLs.

## Accessibility Considerations
Provide text-based descriptions alongside Mermaid visual diagrams for screen reader users.

## Performance Considerations
Zero runtime impact.

## Testing Requirements

### Manual Testing
- [ ] View `docs/architecture.md` on GitHub / VS Code previewer, verify all Mermaid diagrams render cleanly without syntax errors.

## Affected Areas
- [x] Documentation

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
