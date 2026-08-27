/**
 * @fileoverview API routes for Concept Map and Knowledge Graph features.
 */
const express = require('express');
const router = express.Router();
const conceptMapController = require('../controllers/conceptMapController');

/**
 * @route   POST /api/concept-map/generate
 * @desc    Generate a knowledge graph from study text or topics
 * @access  Private
 */
router.post('/generate', conceptMapController.generateConceptMap);

module.exports = router;
