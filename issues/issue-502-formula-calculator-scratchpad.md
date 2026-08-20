---
title: '[FEAT]: Interactive Formula Calculator & Scientific Notation Scratchpad Widget'
labels: 'ECSoC26, ECSoC26-L1, feature, frontend, ui/ux, good first issue'
assignees: ''
---

## Issue Type
Feature / UI/UX / Tools

## Priority
P3 Low

## Summary
Add an expandable floating scientific calculator & scratchpad drawer component in the quiz and flashcard review interface to help STEM students evaluate math formulas, physics constants, and chemical calculations without leaving the workspace.

## Problem Statement
Students taking quizzes involving math, physics, or engineering problems must open OS calculator apps or switch browser tabs to perform basic calculations or sketch rough working, interrupting test flow.

## Current Behavior
No built-in calculator or scratchpad is available in quiz or flashcard views.

## Expected Behavior
A "Calculator & Scratchpad" action button in the quiz header opens a draggable, collapsible floating drawer containing a scientific calculator (trig functions, logs, powers, constants) and an HTML5 canvas scratchpad for quick manual working.

## User Story
As a STEM student solving math and physics quizzes  
I want a floating scientific calculator and canvas scratchpad available inside the quiz view  
So that I can quickly compute formulas and sketch working without leaving the quiz screen  

## Proposed Solution
1. Integrate `mathjs` for evaluating mathematical expressions safely on the client side.
2. Build `frontend/src/components/common/ScientificCalculator.jsx` with basic and advanced mode tabs.
3. Build `frontend/src/components/common/CanvasScratchpad.jsx` allowing mouse/touch drawing with clear and undo buttons.
4. Mount both in a floating draggable drawer (`FloatingUtilityDrawer.jsx`).

## Technical Scope

### Frontend Impact
- Package: `mathjs`.
- New Components: `frontend/src/components/common/ScientificCalculator.jsx`, `frontend/src/components/common/CanvasScratchpad.jsx`, `frontend/src/components/common/FloatingUtilityDrawer.jsx`.

### Backend Impact
None.

### Database Impact
None.

### API Impact
None.

### Infrastructure Impact
Client-side execution.

## Acceptance Criteria
- [ ] Floating button opens/closes drawer smoothly without obstructing question text.
- [ ] Calculator supports basic arithmetic, trigonometric functions (sin, cos, tan), logs, exponents, and constants ($\pi, e$).
- [ ] Canvas scratchpad supports touch/mouse drawing, stroke color options, and "Clear" button.
- [ ] Drawer position is draggable across the screen and remembers user preference in `localStorage`.

## Edge Cases
- [ ] Division by zero or math syntax error -> render clean "Invalid Expression" label in calculator screen.

## Security Considerations
Use `mathjs` `evaluate()` parser instead of native JavaScript `eval()` to prevent arbitrary code execution vulnerabilities.

## Accessibility Considerations
Ensure calculator buttons are focusable via keyboard (`Tab` and number key presses) with ARIA labels.

## Performance Considerations
Lightweight HTML5 2D canvas context; clear drawing buffer on unmount.

## Testing Requirements

### Unit Tests
- [ ] Test scientific calculator math expression parser for trig, log, and exponent operations.

### Manual Testing
- [ ] Open quiz view, launch floating calculator, evaluate `sin(45) * sqrt(16)`, test canvas drawing, and close drawer.

## Affected Areas
- [x] Frontend
- [x] UI/UX

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
