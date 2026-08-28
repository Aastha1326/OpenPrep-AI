/**
 * @fileoverview API routes for Real-Time Collaborative Document Editing.
 */
const express = require('express');
const router = express.Router();
const collaborativeDocController = require('../controllers/collaborativeDocController');

/**
 * @route   GET /api/collaborative-docs/:docId
 * @desc    Fetch the current state of a shared document
 * @access  Private
 */
router.get('/:docId', collaborativeDocController.getDocument);

/**
 * @route   POST /api/collaborative-docs/:docId/versions
 * @desc    Save a snapshot of the document state for version history
 * @access  Private
 */
router.post('/:docId/versions', collaborativeDocController.saveVersion);

module.exports = router;
