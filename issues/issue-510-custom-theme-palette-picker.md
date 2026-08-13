---
title: '[FEAT]: Custom Color Palette Theme Customizer (Neumorphism, Glassmorphism, AMOLED Dark)'
labels: 'ECSoC26, ECSoC26-L1, feature, frontend, ui/ux, good first issue'
assignees: ''
---

## Issue Type
Feature / Frontend / UI/UX

## Priority
P3 Low

## Summary
Expand the theme provider with customizable theme presets (Modern Glassmorphism, Midnight AMOLED Dark, Emerald Study, Sunset Warm, Sepia Reading) and a custom CSS variable accent color picker.

## Problem Statement
Users currently have access to standard Light and Dark modes. Students studying for extended night hours require specialized low-contrast options like AMOLED Dark or Sepia, or prefer personalizing their interface with custom accent colors.

## Current Behavior
Theme context supports binary light/dark mode toggling.

## Expected Behavior
A Theme Customizer drawer in user settings allows selecting preset themes (AMOLED Pitch Black, Sepia Paper, Emerald Forest, Cyberpunk Neon, Glassmorphism) and picking primary/secondary HSL accent colors applied dynamically via CSS variables.

## User Story
As a night-owl student studying late hours  
I want to select AMOLED dark or Sepia themes and customize UI accent colors  
So that I can reduce eye strain and enjoy a personalized study environment  

## Proposed Solution
1. Refactor `frontend/src/context/ThemeContext.jsx` to support multi-theme state (`theme: 'dark' | 'light' | 'amoled' | 'sepia' | 'emerald'`).
2. Add CSS custom properties (`--bg-primary`, `--text-primary`, `--accent-primary`) in `index.css`.
3. Create `ThemeSelectorDrawer.jsx` with visual theme preview cards and color picker sliders.
4. Persist theme choice and accent hex colors in `localStorage` and user database settings.

## Technical Scope

### Frontend Impact
- Component: `frontend/src/components/settings/ThemeSelectorDrawer.jsx`.
- Refactor: `frontend/src/context/ThemeContext.jsx`, `frontend/src/index.css`.

### Backend Impact
Update `User` profile controller to accept `themePreference` JSON string.

### Database Impact
- Update `User` model: add `themePreference` JSONB column.

### API Impact
- `PATCH /api/users/profile` -> updates theme preference payload.

### Infrastructure Impact
Client-side CSS variable switching.

## Acceptance Criteria
- [ ] Theme switcher changes background, text, and component border colors instantly without page reload.
- [ ] Sepia theme applies warm reading background (`#fbf0d9`) ideal for long reading sessions.
- [ ] AMOLED theme applies true pitch black (`#000000`) for OLED power savings.
- [ ] Custom accent color picker dynamically updates buttons and focus ring colors.
- [ ] Theme selection persists across user logins.

## Edge Cases
- [ ] Custom accent color chosen with poor contrast -> automatically adjust text contrast ratio to satisfy WCAG AA compliance (4.5:1).

## Security Considerations
None.

## Accessibility Considerations
Ensure all preset color combinations meet minimum WCAG 2.1 AA contrast requirements.

## Performance Considerations
Pure CSS variable manipulation; zero bundle size overhead.

## Testing Requirements

### Unit Tests
- [ ] Test `ThemeContext` state changes and CSS variable injection logic.

### Manual Testing
- [ ] Switch between AMOLED, Sepia, and Light modes, pick custom purple accent color, verify UI element color updates.

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
