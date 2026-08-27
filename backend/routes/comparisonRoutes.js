/**
 * @fileoverview API routes for Document Comparison features.
 */
const express = require('express');
const router = express.Router();
const comparisonController = require('../controllers/comparisonController');

/**
 * @route   POST /api/comparison/analyze
 * @desc    Compare two text documents for overlap and gaps
 * @access  Private
 */
router.post('/analyze', comparisonController.compareDocs);

module.exports = router;
