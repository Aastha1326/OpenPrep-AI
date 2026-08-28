/**
 * @fileoverview API routes for Collaborative Note Highlighting and Discussions.
 */
const express = require('express');
const router = express.Router();
const noteDiscussionController = require('../controllers/noteDiscussionController');

/**
 * @route   GET /api/notes/:noteId/highlights
 * @desc    Fetch all highlights and discussions for a specific note
 * @access  Private
 */
router.get('/notes/:noteId/highlights', noteDiscussionController.getNoteHighlights);

/**
 * @route   POST /api/notes/highlights
 * @desc    Create a new highlight with an optional initial comment
 * @access  Private
 */
router.post('/notes/highlights', noteDiscussionController.createHighlight);

/**
 * @route   POST /api/notes/highlights/:highlightId/replies
 * @desc    Add a reply to a highlight discussion thread
 * @access  Private
 */
router.post('/notes/highlights/:highlightId/replies', noteDiscussionController.addDiscussionReply);

/**
 * @route   PUT /api/notes/highlights/:highlightId/moderate
 * @desc    Resolve or delete a highlight (owner/moderator only)
 * @access  Private
 */
router.put('/notes/highlights/:highlightId/moderate', noteDiscussionController.moderateHighlight);

module.exports = router;
