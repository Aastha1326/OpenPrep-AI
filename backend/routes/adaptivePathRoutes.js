/**
 * @fileoverview API routes for Adaptive Study Path management.
 */
const express = require('express');
const router = express.Router();
const adaptivePathController = require('../controllers/adaptivePathController');

/**
 * @route   POST /api/adaptive-paths
 * @desc    Generate a new AI-powered personalized study path
 * @access  Private
 */
router.post('/', adaptivePathController.createAdaptivePath);

/**
 * @route   PUT /api/adaptive-paths/:pathId/update
 * @desc    Update an existing study path based on quiz performance
 * @access  Private
 */
router.put('/:pathId/update', adaptivePathController.updateAdaptivePath);

module.exports = router;
