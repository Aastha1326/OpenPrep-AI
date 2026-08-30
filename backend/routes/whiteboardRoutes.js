/**
 * @fileoverview API routes for collaborative whiteboard management.
 */
const express = require('express');
const router = express.Router();
const whiteboardController = require('../controllers/whiteboardController');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/squads/:squadId/whiteboards
 * @desc    Fetch all whiteboards for a specific study squad
 * @access  Private
 */
router.get('/squads/:squadId/whiteboards', protect, whiteboardController.getSquadWhiteboards);

/**
 * @route   POST /api/squads/:squadId/whiteboards
 * @desc    Create a new whiteboard for a study squad
 * @access  Private
 */
router.post('/squads/:squadId/whiteboards', protect, whiteboardController.createWhiteboard);

/**
 * @route   GET /api/whiteboard/:roomId/state
 * @desc    Retrieves the full canvas state for a specific room
 * @access  Private
 */
router.get('/whiteboard/:roomId/state', protect, whiteboardController.getWhiteboardState);

/**
 * @route   POST /api/whiteboard/:roomId/snapshot
 * @desc    Save a serialized JSON snapshot of the canvas state and thumbnail
 * @access  Private
 */
router.post('/whiteboard/:roomId/snapshot', protect, whiteboardController.saveWhiteboardSnapshot);

/**
 * @route   POST /api/whiteboard/ocr
 * @desc    Perform AI handwriting OCR on sketch to output LaTeX formula
 * @access  Private
 */
router.post('/whiteboard/ocr', protect, whiteboardController.transcribeMathOCR);

/**
 * @route   DELETE /api/whiteboards/:id
 * @desc    Archive or permanently delete a whiteboard
 * @access  Private
 */
router.delete('/whiteboards/:id', protect, whiteboardController.deleteWhiteboard);

module.exports = router;
