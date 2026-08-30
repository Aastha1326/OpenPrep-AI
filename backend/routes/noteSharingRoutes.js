/**
 * @fileoverview API routes for Peer-to-Peer Note Sharing.
 */
const express = require('express');
const router = express.Router();
const noteSharingController = require('../controllers/noteSharingController');

/**
 * @route   GET /api/shared-notes
 * @desc    Fetch a list of public shared notes
 * @access  Public
 */
router.get('/', noteSharingController.getSharedNotes);

/**
 * @route   POST /api/shared-notes/:noteId/annotations
 * @desc    Add a new collaborative annotation to a note
 * @access  Private
 */
router.post('/:noteId/annotations', noteSharingController.addAnnotation);

/**
 * @route   DELETE /api/shared-notes/:noteId/annotations/:annotationId
 * @desc    Delete a specific annotation
 * @access  Private
 */
router.delete('/:noteId/annotations/:annotationId', noteSharingController.deleteAnnotation);

module.exports = router;
