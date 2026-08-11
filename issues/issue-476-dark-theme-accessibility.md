---
title: '[ENH]: Theme System Refactor with High-Contrast Mode & System Preference Sync'
labels: 'ECSoC26, ECSoC26-L1, enhancement, frontend, ui/ux, accessibility'
assignees: ''
---

## Issue Type
Enhancement / UI/UX / Accessibility

## Priority
P3 Low

## Summary
Refactor the frontend theme context to support smooth dark/light mode switching, automatic OS system preference detection (`prefers-color-scheme`), and a specialized High-Contrast mode for accessible reading.

## Problem Statement
The current theme toggle implementation suffers from unstyled flash of light mode on initial page load (FOUC), lacks high-contrast themes for visually impaired students, and does not listen to system dark mode settings changes.

## Current Behavior
Theme state relies solely on local React state or basic localStorage, causing visual flickering during hydration and lacking accessibility contrast compliance (WCAG 2.1 AA standard).

## Expected Behavior
1. Theme selector allows "Light", "Dark", "High Contrast", or "System Default".
2. System preference changes dynamically update the theme if set to "System Default".
3. Zero flash of unstyled theme on page refresh by executing inline anti-FOUC inline script in `index.html`.
4. High Contrast mode guarantees minimum 7:1 color contrast ratio across all UI cards, text, and form controls.

## User Story
As a student studying late at night or with visual impairments  
I want a flicker-free dark mode and a high-contrast reading theme option  
So that I can reduce eye strain and comfortably read study material for long periods  

## Proposed Solution
1. Update `frontend/src/context/ThemeContext.jsx` with standard theme management.
2. Add inline head script in `frontend/index.html` to read `localStorage.theme` or `window.matchMedia('(prefers-color-scheme: dark)')` prior to DOM render.
3. Configure Tailwind color tokens in `tailwind.config.js` for high-contrast variables (`bg-contrast`, `text-contrast`, `border-contrast`).
4. Add theme selector dropdown in Navbar/Settings with intuitive icons.

## Technical Scope

### Frontend Impact
- Refactor: `frontend/src/context/ThemeContext.jsx`.
- Update: `frontend/index.html`, `frontend/src/index.css`, `frontend/tailwind.config.js`.
- Component: `frontend/src/components/ThemeSelectorModal.jsx`.

### Backend Impact
None.

### Database Impact
- Optional: Add `preferredTheme: ENUM('light', 'dark', 'high-contrast', 'system')` column to `User` model to sync across user devices.

### API Impact
- Update `PUT /api/user/profile` to accept `preferredTheme`.

### Infrastructure Impact
None.

## Acceptance Criteria
- [ ] Theme switches instantly without page reload or visual flickering.
- [ ] Inline script in `index.html` prevents FOUC on full page refresh.
- [ ] High Contrast mode passes WCAG 2.1 AAA contrast audit (>7:1 ratio) on Chrome DevTools Lighthouse.
- [ ] OS system dark/light mode toggle immediately updates app UI when "System Default" is selected.

## Edge Cases
- [ ] User changes OS theme while app tab is open -> `matchMedia` change listener updates theme automatically.

## Security Considerations
None.

## Accessibility Considerations
Full adherence to WCAG 2.1 AA / AAA standards; includes `aria-pressed` states on theme toggle buttons.

## Performance Considerations
Zero CSS layout shifts; minimal JS footprint (< 1KB).

## Testing Requirements

### Unit Tests
- [ ] Test `ThemeContext` default fallback and mode switching methods.

### Manual Testing
- [ ] Run Chrome Lighthouse Accessibility audit and confirm 100 score in High Contrast mode.

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
- [ ] Lighthouse accessibility score verified
- [ ] Ready for production
