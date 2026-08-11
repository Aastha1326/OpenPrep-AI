---
title: '[FEAT]: Export AI Study Plans to iCalendar (.ics) and Direct Google Calendar Sync'
labels: 'ECSoC26, ECSoC26-L2, feature, backend, frontend, study-planner'
assignees: ''
---

## Issue Type
Feature / Integration

## Priority
P2 Medium

## Summary
Enable students to export their generated AI Study Schedules into standard `.ics` (iCalendar) files or synchronize tasks directly into Google Calendar via OAuth2 API integration.

## Problem Statement
While OpenPrep AI creates structured daily study timelines, students use external calendar apps (Google Calendar, Apple Calendar, Outlook) for daily time management. Without export/sync functionality, students must manually copy daily study tasks into their personal calendars.

## Current Behavior
Study schedules are displayed strictly within the web dashboard app UI.

## Expected Behavior
1. "Export to Calendar" dropdown button on Study Plan page with options:
   - "Download .ics File"
   - "Sync to Google Calendar"
2. Downloading `.ics` generates a valid iCalendar file with scheduled study blocks, topic titles, and revision reminders.
3. Clicking "Sync to Google Calendar" prompts Google OAuth authorization and populates study tasks as events on a dedicated "OpenPrep Study Schedule" calendar.

## User Story
As a busy student using Google Calendar  
I want to push my OpenPrep study tasks into my personal calendar with one click  
So that I get automatic mobile notifications and reminders for every study session  

## Proposed Solution
1. Backend `.ics` generator using `ics` npm package (`backend/services/calendarService.js`).
2. Google Calendar API client setup using `googleapis` package.
3. Frontend UI trigger with status toast notifications for sync success/failure.
4. Settings page toggle for automatic background calendar sync when study plans update.

## Technical Scope

### Frontend Impact
- New Component: `frontend/src/components/CalendarExportDropdown.jsx`.
- Service update: `frontend/src/services/studyPlanService.js` to handle file downloads and OAuth redirect.

### Backend Impact
- New Service: `backend/services/calendarService.js`.
- New Routes: `backend/routes/calendarRoutes.js` (`GET /api/calendar/export-ics`, `POST /api/calendar/google-sync`, `GET /api/calendar/google-callback`).

### Database Impact
- `User` model: Add `googleCalendarRefreshToken: TEXT`, `syncGoogleCalendar: BOOLEAN`.

### API Impact
- `GET /api/study-plans/:id/ics` -> streams `.ics` file attachment.
- `POST /api/calendar/google-sync` -> creates event entries in user's Google Calendar.

### Infrastructure Impact
Google API Console credentials configuration (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`) in environment variables.

## Acceptance Criteria
- [ ] `.ics` file downloads cleanly and imports into Apple Calendar, Outlook, and Google Calendar without formatting errors.
- [ ] Events contain correct start/end times, topic descriptions, and prep reminders.
- [ ] Google Calendar sync creates an "OpenPrep AI" secondary calendar to prevent cluttering primary calendars.
- [ ] OAuth token refresh handled transparently when sync tokens expire.

## Edge Cases
- [ ] User revokes Google Calendar access -> clear invalid token gracefully and prompt for re-auth.
- [ ] Overlapping study blocks -> format event titles cleanly with subject labels.

## Security Considerations
Store OAuth refresh tokens encrypted in DB (`crypto` AES-256-GCM) and restrict Google API scopes strictly to `https://www.googleapis.com/auth/calendar.events`.

## Accessibility Considerations
Ensure dropdown buttons and calendar sync progress status support full keyboard navigation.

## Performance Considerations
Batch Google Calendar API event creation requests using batch endpoints to avoid hitting API quota limits during 30-day schedule syncs.

## Testing Requirements

### Unit Tests
- [ ] Test `calendarService` `.ics` string generation for valid VCALENDAR/VEVENT formatting.

### Manual Testing
- [ ] Download `.ics` and verify import on macOS Calendar and Google Calendar web app.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] Study Planner
- [x] Database

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 2 (Medium / Intermediate) (ECSoC26-L2)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Manual calendar imports verified
- [ ] Setup guide updated with Google Calendar API keys instruction
- [ ] Ready for production
