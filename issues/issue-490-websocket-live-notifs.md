---
title: '[FEAT]: In-App WebSocket Notification Center & Automated Web Push Study Reminders'
labels: 'ECSoC26, ECSoC26-L2, feature, frontend, backend, dashboard'
assignees: ''
---

## Issue Type
Feature / Real-time / Notifications

## Priority
P2 Medium

## Summary
Build an in-app WebSocket real-time notification hub paired with Web Push API (service worker) to send instant study session reminders, weakness alert warnings, and streak milestone achievements to students.

## Problem Statement
Students often miss scheduled study tasks or forget daily review sessions because the platform lacks real-time notifications and browser push alerts when they are not actively viewing the dashboard.

## Current Behavior
No notification center or browser alerts exist. Users must manually navigate to the study planner view to check upcoming tasks.

## Expected Behavior
A top navigation bell icon displays an unread notification count. Real-time events (e.g., "Daily Flashcard Streak at risk!", "Study Session starts in 15 mins", "New Community Deck Shared") trigger drop-down alerts and desktop Web Push notifications.

## User Story
As a busy student  
I want to receive push notifications and real-time in-app alerts for upcoming study sessions and weakness warnings  
So that I never break my daily study streak or forget scheduled revision tasks  

## Proposed Solution
1. Use existing `Socket.io` connection to push real-time notifications (`NOTIF_NEW`, `WEAKNESS_ALERT`) to authenticated clients.
2. Integrate standard Web Push API (`web-push` NPM package on backend + service worker push subscription on frontend).
3. Create `frontend/src/components/notifications/NotificationBell.jsx` and `NotificationCenterModal.jsx`.
4. Store notification history in PostgreSQL database with read/unread status.

## Technical Scope

### Frontend Impact
- New Components: `frontend/src/components/notifications/NotificationBell.jsx`, `frontend/src/components/notifications/NotificationList.jsx`.
- Service Worker update: `frontend/public/sw.js` for handling push payload events and desktop toast popups.

### Backend Impact
- New Model: `Notification` (`id`, `userId`, `title`, `message`, `type`, `isRead`, `link`, `createdAt`).
- New Controller: `backend/controllers/notificationController.js`.
- Scheduled Cron job: `backend/jobs/studyReminderCron.js` checking upcoming study tasks every 15 minutes.

### Database Impact
- New Model: `Notification` and `PushSubscription` (fields: `userId`, `endpoint`, `keys`).

### API Impact
- `GET /api/notifications` -> list recent user notifications.
- `PATCH /api/notifications/:id/read` -> mark notification as read.
- `POST /api/notifications/subscribe-push` -> save browser VAPID push subscription.

### Infrastructure Impact
Generate VAPID keys (`NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`) in `.env.example`.

## Acceptance Criteria
- [ ] Bell icon updates with unread count badge in real time.
- [ ] Clicking notification marks it as read and redirects user to relevant route (e.g., specific quiz or flashcard deck).
- [ ] Users can toggle "Enable Desktop Push Notifications" in User Settings.
- [ ] Cron job dispatches reminders 15 minutes before scheduled `StudyPlanTask`.
- [ ] "Mark All as Read" button clears unread badge instantly.

## Edge Cases
- [ ] User denies browser notification permission -> fallback silently to in-app bell notification dropdown only.
- [ ] Disconnected socket -> queue offline notifications in database and deliver upon re-login.

## Security Considerations
Encrypt VAPID keys securely; ensure users cannot access or alter another user's notification payload.

## Accessibility Considerations
Use ARIA live regions (`aria-live="polite"`) to announce new incoming notifications to screen readers.

## Performance Considerations
Batch notification DB insertions; clean up read notifications older than 30 days via background cron cleanup.

## Testing Requirements

### Unit Tests
- [ ] Test notification database CRUD operations and unread count queries.

### Manual Testing
- [ ] Schedule task 15 mins out, verify socket emission and desktop browser push alert payload.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] Dashboard

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
