/**
 * @fileoverview API routes for Study Guide PDF Export.
 */
const express = require('express');
const router = express.Router();
const studyGuideController = require('../controllers/studyGuideController');

/**
 * @route   POST /api/study-guides/export-pdf
 * @desc    Compiles selected content into a downloadable PDF document stream
 * @access  Private
 */
router.post('/export-pdf', studyGuideController.exportPDF);

module.exports = router;
