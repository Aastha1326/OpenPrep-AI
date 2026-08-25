/**
 * @fileoverview API routes for Peer-to-Peer Study Group features.
 */
const express = require('express');
const router = express.Router();
const studyGroupController = require('../controllers/studyGroupController');

/**
 * @route   POST /api/study-groups
 * @desc    Create a new study group
 * @access  Private
 */
router.post('/', studyGroupController.createGroup);

/**
 * @route   GET /api/study-groups/recommendations
 * @desc    Get recommended study groups based on subject and exam date
 * @access  Private
 */
router.get('/recommendations', studyGroupController.getRecommendations);

/**
 * @route   POST /api/study-groups/:groupId/join
 * @desc    Join an existing study group
 * @access  Private
 */
router.post('/:groupId/join', studyGroupController.joinGroup);

module.exports = router;
