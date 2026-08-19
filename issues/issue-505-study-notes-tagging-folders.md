---
title: '[FEAT]: Peer-to-Peer Study Material Tagging, Bookmarking, & Nested Folder System'
labels: 'ECSoC26, ECSoC26-L2, feature, frontend, backend, ui/ux'
assignees: ''
---

## Issue Type
Feature / Frontend / UI/UX

## Priority
P2 Medium

## Summary
Add a hierarchical nested folder, custom multi-color tag, and quick bookmarking system for study notes, flashcards, and PYQ documents.

## Problem Statement
As students create dozens of notes, flashcard decks, and quiz sets, the workspace list view becomes cluttered. Students lack a nested folder structure and color-coded tag organization system to group materials by Subject, Semester, or Exam module.

## Current Behavior
Study items are presented in flat, unorganized list views filtered only by basic text search.

## Expected Behavior
A sidebar directory tree allowing users to create nested folders (e.g. `Semester 4 > Data Structures > Trees`), attach color-coded tags (`#Important`, `#ExamPrep`, `#Formula`), and click star icons to bookmark favorite study materials for 1-click access.

## User Story
As an organized student  
I want to create nested folders and color-coded tags for my study notes and flashcards  
So that I can quickly organize and locate revision materials by subject and semester  

## Proposed Solution
1. Create `Folder` model in PostgreSQL with self-referencing `parentId` foreign key for infinite nesting.
2. Build frontend `FolderTreeSidebar.jsx` and `TagChipGroup.jsx` components.
3. Support drag-and-drop item movement into folders using `@hello-pangea/dnd` or `dnd-kit`.
4. Add quick "Bookmarked Materials" tab on Dashboard.

## Technical Scope

### Frontend Impact
- New Components: `frontend/src/components/common/FolderTreeSidebar.jsx`, `frontend/src/components/common/TagSelectorModal.jsx`, `frontend/src/components/dashboard/BookmarkedSection.jsx`.
- Updates to `NotesPage.jsx` and `FlashcardsPage.jsx`.

### Backend Impact
- New Controller: `backend/controllers/folderController.js`.
- Routes: `backend/routes/folderRoutes.js`.

### Database Impact
- New Model: `Folder` (`id`, `userId`, `parentId`, `name`, `color`, `icon`).
- Update `Note`, `FlashcardDeck`, `Quiz` models: add `folderId` and `tags` (ARRAY of strings) fields.

### API Impact
- `GET /api/folders/tree` -> returns nested folder hierarchy JSON.
- `POST /api/folders` -> create new folder.
- `PATCH /api/folders/:id/move` -> move folder or item to new parent folder.

### Infrastructure Impact
Uses standard PostgreSQL relational keys.

## Acceptance Criteria
- [ ] Sidebar renders expandable/collapsible nested folder tree.
- [ ] Users can drag and drop notes or flashcard decks into folders.
- [ ] Adding tags allows multi-tag filtering across search views.
- [ ] Bookmarking items displays them instantly on the Dashboard quick-access panel.

## Edge Cases
- [ ] Deleting parent folder -> prompt user: "Move contents to root or delete sub-items?".

## Security Considerations
Ensure folder ownership validations prevent users from moving items into another user's folder hierarchy.

## Accessibility Considerations
Ensure folder tree supports keyboard navigation (ArrowUp, ArrowDown, ArrowRight to expand, ArrowLeft to collapse).

## Performance Considerations
Optimize recursive folder queries using PostgreSQL Common Table Expressions (CTEs) or CTE hierarchy queries.

## Testing Requirements

### Unit Tests
- [ ] Test recursive nested folder tree builder algorithm (`buildTreeStructure`).

### Manual Testing
- [ ] Create 3-level deep folder hierarchy, drag 2 notes into subfolder, add tags `#Exam`, verify multi-filter search.

## Affected Areas
- [x] Frontend
- [x] Backend
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
