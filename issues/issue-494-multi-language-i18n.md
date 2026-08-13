---
title: '[FEAT]: Multi-Language Internationalization (i18n) Engine with RTL & Locales Support'
labels: 'ECSoC26, ECSoC26-L2, feature, frontend, ui/ux'
assignees: ''
---

## Issue Type
Feature / Frontend / Localization

## Priority
P2 Medium

## Summary
Integrate `react-i18next` and `i18next` into the React frontend to support multi-language internationalization (i18n) for key student demographics (English, Spanish, Hindi, French, German), complete with right-to-left (RTL) text layout switching.

## Problem Statement
OpenPrep AI currently hardcodes all user interface text in English. Non-native English students preparing for global or localized regional competitive exams face language barriers while navigating study features and quiz interfaces.

## Current Behavior
All string literals across UI components, buttons, and navigation elements are hardcoded in English.

## Expected Behavior
A language selector dropdown in the navbar allows users to switch the UI language instantly (e.g., English, Hindi, Spanish). Locale preferences persist in local storage/user settings, and text directions automatically switch to RTL for languages like Arabic/Hebrew.

## User Story
As a non-native English speaking student  
I want to view the platform interface in my native language  
So that I can focus entirely on studying without struggling to translate navigation buttons and menu items  

## Proposed Solution
1. Install `i18next`, `react-i18next`, and `i18next-browser-languagedetector` packages in `frontend`.
2. Set up i18n initialization file `frontend/src/i18n.js` with translation JSON resource dictionaries stored in `frontend/public/locales/{lang}/translation.json`.
3. Create `LanguageSelector.jsx` component for navbar and user profile settings.
4. Add dynamic `dir="rtl"` or `dir="ltr"` attribute handling on HTML body element when switching languages.

## Technical Scope

### Frontend Impact
- Packages: `i18next`, `react-i18next`, `i18next-browser-languagedetector`.
- New Directory: `frontend/public/locales/` (`en`, `hi`, `es`, `fr`, `ar`).
- New Component: `frontend/src/components/LanguageSelector.jsx`.
- Refactor: Replace hardcoded strings in `Navbar.jsx`, `Dashboard.jsx`, and `FlashcardReview.jsx` with `useTranslation()` hooks (`t('dashboard.welcome')`).

### Backend Impact
- Optional: Store preferred locale string field (`locale: string`) in `User` database model.

### Database Impact
- Update `User` model: add `locale` string column (default `'en'`).

### API Impact
- `PATCH /api/users/profile` -> updates user language preference.

### Infrastructure Impact
Zero backend performance overhead; locale dictionary files served statically or code-split dynamically.

## Acceptance Criteria
- [ ] Language selector changes UI text dynamically across components without requiring page reload.
- [ ] User language preference persists across sessions in `localStorage` and backend profile.
- [ ] RTL layout switching triggers correct Flexbox/Grid direction for Arabic/Hebrew locales.
- [ ] Fallback language defaults cleanly to English if missing key string in secondary locale file.
- [ ] Standard dates and number formats adapt to user locale (`Intl.DateTimeFormat`).

## Edge Cases
- [ ] Dynamic AI generated content -> maintain AI prompt output language selection based on active locale setting.

## Security Considerations
Validate locale string inputs to prevent directory traversal in dynamic locale file loading.

## Accessibility Considerations
Ensure `lang` attribute on `<html>` tag updates dynamically for screen reader voice synth selection.

## Performance Considerations
Lazy-load translation JSON files using `i18next-http-backend` so initial bundle size remains unaffected.

## Testing Requirements

### Unit Tests
- [ ] Test `i18n` configuration and translation key lookup fallback logic.

### Manual Testing
- [ ] Switch language from English to Hindi / Spanish, verify navbar and flashcards update text instantly.

## Affected Areas
- [x] Frontend
- [x] UI/UX

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
