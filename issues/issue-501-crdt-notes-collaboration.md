---
title: '[FEAT]: Multi-User Study Notes Real-Time Collaboration with Conflict Resolution'
labels: 'ECSoC26, ECSoC26-L3, feature, frontend, backend, ui/ux'
assignees: ''
---

## Issue Type
Feature / Architecture / Real-Time

## Priority
P1 High

## Summary
Implement real-time multi-user collaborative study note editing using `Yjs` (CRDT) and `Socket.io`, enabling classmates to edit notes simultaneously with live cursor indicators and automatic conflict resolution.

## Problem Statement
Students working in study groups must edit notes individually and share static PDF/text copies. There is no real-time Google Docs-style co-editing interface for shared lecture notes.

## Current Behavior
Notes editor is strictly single-user with overwrite-on-save logic.

## Expected Behavior
Multiple students opening a shared note view live user presence avatars, colored cursor markers showing peer cursor positions, and simultaneous typed text updates synchronized via Yjs CRDTs over WebSockets.

## User Story
As a member of a study group  
I want to collaborate on lecture notes simultaneously with my peers  
So that we can build comprehensive study guides together in real time  

## Proposed Solution
1. Integrate `yjs` and `y-websocket` (or custom Socket.io provider) in backend.
2. Refactor frontend rich text editor (TipTap / Slate / Quill) using `@hocuspocus/provider` or `y-prosemirror`.
3. Display live peer avatars and color-coded selection highlights in note header (`CollaboratorAvatars.jsx`).
4. Persist Yjs document binary states asynchronously into PostgreSQL database.

## Technical Scope

### Frontend Impact
- Packages: `yjs`, `y-prosemirror`, `y-protocols`.
- New Component: `frontend/src/components/notes/CollaborativeEditor.jsx`, `frontend/src/components/notes/CollaboratorAvatars.jsx`.

### Backend Impact
- Packages: `yjs`.
- New Provider: `backend/socket/crdtHandler.js`.
- Controller Update: `backend/controllers/noteController.js`.

### Database Impact
- Update `Note` model: add `docState` (BYTEA / BLOB) and `isCollaborative` (BOOLEAN).

### API Impact
- `POST /api/notes/:id/share` -> generates invite link for shared note collaboration.

### Infrastructure Impact
WebSocket connection persistence required.

## Acceptance Criteria
- [ ] Concurrent edits from 2+ users merge seamlessly without text loss or cursor jumps.
- [ ] Peer cursor positions and names display in real time with distinct user colors.
- [ ] Disconnecting and reconnecting syncs missing edits automatically.
- [ ] Note state is saved reliably to PostgreSQL on editor idle.

## Edge Cases
- [ ] Network disconnect -> retain offline edit queue in Yjs local IndexedDB provider and sync on reconnect.

## Security Considerations
Validate authorization token on socket handshake; restrict collaboration privileges to invited group members.

## Accessibility Considerations
Ensure keyboard navigation and screen reader announcements for collaborator join/leave events.

## Performance Considerations
Lightweight binary CRDT diffs transmitted over WebSocket (<1KB per typing event).

## Testing Requirements

### Unit Tests
- [ ] Test Yjs document serialization and DB storage/retrieval functions.

### Integration Tests
- [ ] Simulate 2 WebSocket client connections making concurrent edits to test convergence.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] UI/UX

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 3 (Hard / Advanced) (ECSoC26-L3)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Multi-client manual testing verified
- [ ] Architecture documentation updated
- [ ] Ready for production
