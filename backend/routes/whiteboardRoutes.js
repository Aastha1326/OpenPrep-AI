/**
 * @fileoverview API routes for collaborative whiteboard management.
 */
const express = require('express');
const router = express.Router();
const whiteboardController = require('../controllers/whiteboardController');

/**
 * @route   GET /api/squads/:squadId/whiteboards
 * @desc    Fetch all whiteboards for a specific study squad
 * @access  Private
 */
router.get('/squads/:squadId/whiteboards', whiteboardController.getSquadWhiteboards);

/**
 * @route   POST /api/squads/:squadId/whiteboards
 * @desc    Create a new whiteboard for a study squad
 * @access  Private
 */
router.post('/squads/:squadId/whiteboards', whiteboardController.createWhiteboard);

/**
 * @route   PUT /api/whiteboards/:id/snapshot
 * @desc    Save a serialized JSON snapshot of the canvas state
 * @access  Private
 */
router.put('/whiteboards/:id/snapshot', whiteboardController.saveWhiteboardSnapshot);

/**
 * @route   DELETE /api/whiteboards/:id
 * @desc    Archive or permanently delete a whiteboard
 * @access  Private
 */
router.delete('/whiteboards/:id', whiteboardController.deleteWhiteboard);

module.exports = router;

