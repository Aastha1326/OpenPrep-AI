---
title: '[FEAT]: Interactive AI-Generated Topic Mind Map & Dynamic Concept Node Graph Visualizer'
labels: 'ECSoC26, ECSoC26-L3, feature, frontend, ai, ui/ux'
assignees: ''
---

## Issue Type
Feature / AI / Visualizer

## Priority
P1 High

## Summary
Build an interactive Mind Map & Concept Node Graph generator powered by Gemini API that transforms raw notes or syllabus topics into interactive, drill-down visual diagrams (using React Flow or Cytoscape.js).

## Problem Statement
Text-dense study notes and long syllabus documents can be overwhelming for visual learners. Students lack a high-level visual representation of how topics, subtopics, formulas, and concepts interrelate across an exam syllabus.

## Current Behavior
Notes and syllabus topics are displayed only as linear text lists or accordion items.

## Expected Behavior
Students click "Generate Mind Map" on any Subject, Note, or Syllabus module to view an interactive 2D node graph. Users can zoom, pan, click nodes to reveal sub-concepts/flashcards, and auto-expand AI-generated topic summaries.

## User Story
As a visual learner  
I want to visualize syllabus concepts as an interactive mind map node graph  
So that I can understand how topics connect and quickly zoom into sub-concepts I find confusing  

## Proposed Solution
1. Prompt Gemini 1.5 API to structure raw note content or topic lists into hierarchical JSON node trees (`{ id, label, category, children: [] }`).
2. Integrate `reactflow` or `@xyflow/react` to render node graphs with customizable node styles (color-coded by difficulty or subject area).
3. Implement interactive node controls: expand/collapse sub-branches, search node labels, export high-res PNG visual, and click node to launch instant AI quick quiz on that specific topic.

## Technical Scope

### Frontend Impact
- New Dependency: `@xyflow/react` (or `reactflow`).
- New Component: `frontend/src/components/visualizer/MindMapCanvas.jsx`, `frontend/src/components/visualizer/NodeDetailModal.jsx`.
- New View: `frontend/src/pages/MindMapViewer.jsx`.

### Backend Impact
- New Service method in `backend/services/geminiService.js`: `generateMindMapStructure(textContext)`.
- New Endpoint in `backend/controllers/aiController.js`: `generateMindMap`.

### Database Impact
- New Model: `MindMap` (`id`, `userId`, `subjectId`, `nodesData` JSONB, `createdAt`).

### API Impact
- `POST /api/ai/mind-map/generate` -> accepts `noteId` or `topicId`, returns graph nodes & edges JSON.
- `GET /api/ai/mind-map/:id` -> retrieves saved mind map graph data.

### Infrastructure Impact
Client-side GPU canvas rendering for smooth panning/zooming animations up to 200 nodes.

## Acceptance Criteria
- [ ] AI prompt returns valid JSON node hierarchy without breaking tree schema.
- [ ] Mind map canvas renders root, topic, and sub-topic nodes with clean connector lines.
- [ ] Pan, zoom, and drag-and-drop node positioning work smoothly without frame drop.
- [ ] Clicking any concept node opens detail panel showing key formulas, definitions, and flashcard triggers.
- [ ] Export Mind Map button generates clean PNG/SVG image download.

## Edge Cases
- [ ] Extremely large notes -> cap AI tree generation to 3 depth levels with pagination/virtualization.
- [ ] Invalid JSON response from Gemini API -> catch error and render auto-retry modal.

## Security Considerations
Validate authorization headers to restrict mind map access to document owners or public shared decks.

## Accessibility Considerations
Provide alternative collapsible text tree view (`aria-expanded`) for screen reader compatibility.

## Performance Considerations
Use React Flow node memoization and canvas optimization flags (`onlyRenderVisibleElements={true}`).

## Testing Requirements

### Unit Tests
- [ ] Test mind map JSON schema validation utility (`validateMindMapSchema`).

### Manual Testing
- [ ] Upload 5-page PDF note, generate mind map, test zooming/dragging 50+ nodes, and export image.

## Affected Areas
- [x] Frontend
- [x] AI
- [x] UI/UX

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 3 (Hard / Advanced) (ECSoC26-L3)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Manual testing passed
- [ ] Architecture documentation updated
- [ ] Ready for production
