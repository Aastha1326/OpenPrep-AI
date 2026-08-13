---
title: '[PERF]: Frontend Canvas Rendering Optimization for High-Density Flashcard Grids'
labels: 'ECSoC26, ECSoC26-L2, performance, frontend, ui/ux, flashcards'
assignees: ''
---

## Issue Type
Performance / Frontend / UI/UX

## Priority
P2 Medium

## Summary
Implement windowing/list virtualization using `react-window` or `react-virtualized` in the flashcard deck viewer to handle decks with 500+ cards without DOM degradation or UI lag.

## Problem Statement
When viewing large flashcard decks (200+ cards), rendering all card DOM nodes simultaneously causes browser memory spikes, slow scrolling, and delayed flip animations, especially on low-end mobile devices.

## Current Behavior
The flashcard grid maps over the entire array of cards directly in the DOM, creating hundreds of un-virtualized DOM elements.

## Expected Behavior
The flashcard view uses virtualized row/grid rendering (`react-window`), mounting only visible cards on screen while recycling DOM nodes during scrolling, maintaining a steady 60 FPS scroll performance.

## User Story
As a student reviewing a 500-card comprehensive deck  
I want smooth scrolling and instant card flip animations  
So that my browser does not lag or freeze during study sessions  

## Proposed Solution
1. Install `react-window` and `react-window-infinite-loader` in `frontend`.
2. Refactor `frontend/src/components/FlashcardGrid.jsx` to use `FixedSizeGrid` or `VariableSizeList`.
3. Implement lazy card front/back image loading and CSS GPU-accelerated card flip transitions (`will-change: transform`).

## Technical Scope

### Frontend Impact
- Package: `react-window`.
- Refactor: `frontend/src/components/FlashcardGrid.jsx`, `frontend/src/components/FlashcardCard.jsx`.

### Backend Impact
None.

### Database Impact
None.

### API Impact
None.

### Infrastructure Impact
Reduces client-side RAM usage by over 70% when viewing large decks.

## Acceptance Criteria
- [ ] Render 1,000 flashcards in grid view without dropping below 55 FPS scroll performance.
- [ ] DOM tree contains fewer than 50 active card elements regardless of total deck size.
- [ ] Card flip animation executes smoothly in under 16ms per frame.
- [ ] Search and filter actions update virtualized grid view instantly.

## Edge Cases
- [ ] Window resizing -> recalculate column counts and item dimensions dynamically.

## Security Considerations
None.

## Accessibility Considerations
Ensure virtualized list items remain accessible via keyboard navigation (`Tab` and arrow keys) and ARIA grid role attributes.

## Performance Considerations
Achieve 60 FPS smooth scrolling and cut memory footprint from 250MB to <30MB for large decks.

## Testing Requirements

### Unit Tests
- [ ] Test virtualized item index calculation and grid column responsiveness.

### Manual Testing
- [ ] Load 500 mock flashcards, scroll rapidly, and inspect DevTools Performance tab for frame drops.

## Affected Areas
- [x] Frontend
- [x] UI/UX
- [x] Flashcards

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
