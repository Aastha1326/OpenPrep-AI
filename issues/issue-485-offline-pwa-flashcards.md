---
title: '[FEAT]: Offline Progressive Web App (PWA) Support with IndexedDB Flashcard Review Caching'
labels: 'ECSoC26, ECSoC26-L3, feature, pwa, frontend, offline'
assignees: ''
---

## Issue Type
Feature / Progressive Web App / Offline Capability

## Priority
P2 Medium

## Summary
Transform OpenPrep AI frontend into an offline-capable Progressive Web App (PWA) using Workbox / Vite PWA Plugin and Dexie.js (IndexedDB wrapper), allowing students to review flashcards and complete offline quizzes without active internet connectivity.

## Problem Statement
Students frequently study in environments with unstable or no internet access (subways, flights, remote campuses). Currently, losing internet connection breaks flashcard reviews, prevents card flips, and causes application errors.

## Expected Behavior
1. The web application can be installed to desktop/mobile home screens as a standalone PWA.
2. Flashcard decks and pending review queues are cached locally using IndexedDB (Dexie.js).
3. Users can review flashcards and record difficulty ratings offline.
4. When connection is restored, background sync automatically uploads review logs and updates SM-2 database state on server.

## User Story
As a commuting student on the subway without cellular service  
I want to open OpenPrep AI and complete my daily flashcard review queue offline  
So that my study progress is saved locally and synced automatically once I regain internet connection  

## Proposed Solution
1. Integrate `vite-plugin-pwa` in `frontend/vite.config.js` with web app manifest and Workbox service worker caching strategies.
2. Use `dexie` package to manage client-side IndexedDB database (`openprep_offline_db`).
3. Build offline queue sync manager (`offlineSyncService.js`) listening to `window.addEventListener('online')` events.
4. Add visual offline status banner (`OfflineIndicator.jsx`) alerting user when operating in offline sync mode.

## Technical Scope

### Frontend Impact
- Install `vite-plugin-pwa`, `dexie`.
- Update: `frontend/vite.config.js`.
- New Services: `frontend/src/services/db.js` (Dexie schema), `frontend/src/services/offlineSyncService.js`.
- New Components: `frontend/src/components/common/OfflineIndicator.jsx`, `frontend/src/components/common/PwaInstallPrompt.jsx`.

### Backend Impact
- Controller update: `backend/controllers/flashcardController.js` (`syncOfflineReviews` batch endpoint).
- Route addition: `POST /api/flashcards/batch-sync`.

### Database Impact
None.

### API Impact
- `POST /api/flashcards/batch-sync` -> accepts array of offline SM-2 review events `{ cardId, score, reviewedAt }`, updates backend models atomically.

### Infrastructure Impact
Web App Manifest configuration (`manifest.webmanifest`), service worker asset caching, HTTPS requirement.

## Acceptance Criteria
- [ ] Application installs successfully as a PWA on Chrome/iOS Safari with native window frame.
- [ ] Disconnecting internet allows reviewing cached flashcard decks seamlessly.
- [ ] Offline SM-2 rating actions save to IndexedDB instantly without UI errors.
- [ ] Reconnecting internet triggers background sync, flushing offline queue to server with toast notification.
- [ ] Service worker caches static assets (JS, CSS, images) using Stale-While-Revalidate caching strategy.

## Edge Cases
- [ ] Sync conflicts (e.g. card deleted on server while offline) -> handle server reconciliation gracefully using timestamps.
- [ ] IndexedDB quota full -> notify user to clear cached media assets.

## Security Considerations
Validate authorization headers when executing background sync requests. Ensure offline IndexedDB storage is scoped strictly to domain origin.

## Accessibility Considerations
Provide clear screen-reader announcements when switching between online and offline operational modes ("Working Offline").

## Performance Considerations
IndexedDB reads respond in < 5ms; service worker pre-caches core application shell assets for near-instant cold loads (< 500ms).

## Testing Requirements

### Unit Tests
- [ ] Test Dexie IndexedDB read/write operations and queue flushing logic.

### Manual Testing
- [ ] Simulate offline mode via Chrome DevTools Network tab, perform 5 card reviews, turn network back online, and verify batch sync call.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] PWA
- [x] Flashcards

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 3 (Hard / Advanced) (ECSoC26-L3)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Offline manual test verified
- [ ] Documentation updated
- [ ] Ready for production
