---
title: '[FEAT]: Responsive Mobile Bottom Sheet Navigation & Touch Gesture Support'
labels: 'ECSoC26, ECSoC26-L1, feature, frontend, ui/ux, good first issue'
assignees: ''
---

## Issue Type
Feature / Mobile UI / UI/UX

## Priority
P3 Low

## Summary
Implement mobile-optimized bottom navigation sheets (`react-spring` / `framer-motion` bottom sheet modal) and swipe touch gestures (swipe left to flip card, swipe right for easy, swipe down to dismiss) for mobile smartphone users.

## Problem Statement
On mobile browsers, traditional desktop modals and top navigation menus require awkward top-of-screen reaches. Mobile students need thumb-friendly bottom sheet drawers and intuitive touch swipe gestures for reviewing flashcards and answering quiz questions on smartphones.

## Current Behavior
Modals render as centered desktop popups on all screen sizes, requiring precise taps on small 'X' close icons at the top right.

## Expected Behavior
On screens under 768px width, modals and action drawers slide up smoothly from the bottom as swipeable Bottom Sheets (drag down to dismiss). Flashcards support touch swipe gestures (swipe left to flip/next, swipe right for known card).

## User Story
As a mobile smartphone user  
I want thumb-friendly bottom sheet drawers and swipe touch gestures  
So that I can comfortably review flashcards and navigate the app with one hand on my phone  

## Proposed Solution
1. Create `MobileBottomSheet.jsx` component using `framer-motion` or `use-gesture` handling drag gestures and physics snapping.
2. Integrate `@use-gesture/react` in `FlashcardReview.jsx` for swipe left/right/down card interaction.
3. Update `Navbar.jsx` to render a fixed mobile bottom navigation bar (`MobileBottomNav.jsx`) on small viewports.

## Technical Scope

### Frontend Impact
- Packages: `@use-gesture/react`, `framer-motion`.
- New Components: `frontend/src/components/common/MobileBottomSheet.jsx`, `frontend/src/components/common/MobileBottomNav.jsx`.
- Refactor: `frontend/src/components/FlashcardReview.jsx`.

### Backend Impact
None.

### Database Impact
None.

### API Impact
None.

### Infrastructure Impact
Client-side touch gesture handling.

## Acceptance Criteria
- [ ] On viewports <768px, modals convert to bottom sheet drawers with top drag handle indicator.
- [ ] Swiping down on bottom sheet dismisses modal with smooth spring animation.
- [ ] Swiping left on flashcard advances card; swiping right marks card as known/mastered.
- [ ] Mobile bottom navigation bar replaces top header navigation on smartphones for easy thumb reach.

## Edge Cases
- [ ] Touch scroll inside bottom sheet content -> prevent modal drag dismiss while user is scrolling internal text.

## Security Considerations
None.

## Accessibility Considerations
Ensure screen readers can trigger all swipe actions via standard focusable action buttons.

## Performance Considerations
Use CSS `transform: translateY()` GPU acceleration for 60 FPS drawer drag animations.

## Testing Requirements

### Unit Tests
- [ ] Test gesture threshold calculation utility functions.

### Manual Testing
- [ ] Open Chrome DevTools mobile device emulator (iPhone/Pixel), test bottom sheet drag dismiss, mobile navbar navigation, and card swipe gestures.

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
- [ ] Mobile manual testing passed
- [ ] Documentation updated
- [ ] Ready for production
