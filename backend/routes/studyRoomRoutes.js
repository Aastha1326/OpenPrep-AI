/**
 * @fileoverview API routes for Collaborative Study Room management.
 */
const express = require('express');
const router = express.Router();
const studyRoomController = require('../controllers/studyRoomController');

/**
 * @route   POST /api/study-rooms
 * @desc    Create a new collaborative study room
 * @access  Public (or Private with auth middleware)
 */
router.post('/', studyRoomController.createStudyRoom);

/**
 * @route   GET /api/study-rooms/:roomCode
 * @desc    Validate a room code before joining via WebSocket
 * @access  Public
 */
router.get('/:roomCode', studyRoomController.joinStudyRoom);

/**
 * @route   POST /api/study-rooms/:roomId/close
 * @desc    Persist final whiteboard and chat state upon room closure
 * @access  Public (or Private with room owner validation)
 */
router.post('/:roomId/close', studyRoomController.closeStudyRoom);

module.exports = router;
