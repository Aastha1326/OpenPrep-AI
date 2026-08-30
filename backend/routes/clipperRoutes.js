/**
 * @fileoverview API routes for the Smart Web Clipper.
 */
const express = require('express');
const router = express.Router();
const clipperController = require('../controllers/clipperController');

/**
 * @route   POST /api/clipper/ingest-url
 * @desc    Ingests a web URL, parses clean text, and returns structured draft notes
 * @access  Private
 */
router.post('/ingest-url', clipperController.ingestUrl);

/**
 * @route   POST /api/clipper/save-note
 * @desc    Saves the clipped note directly into the user's chosen Subject notebook
 * @access  Private
 */
router.post('/save-note', clipperController.saveNote);

module.exports = router;
