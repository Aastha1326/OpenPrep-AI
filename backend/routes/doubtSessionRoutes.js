/**
 * @fileoverview API routes for the AI Academic Doubt Solver with Socratic hints.
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { startSession, revealHint, sendMessage } = require('../controllers/doubtSolverController');
const { protect } = require('../middleware/auth');

// Configure multer for memory storage (max 5MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed.'), false);
        }
    }
});

/**
 * @route   POST /api/doubts/start
 * @desc    Start a new doubt-solving session with progressive Socratic hints
 * @access  Private
 */
router.post('/start', protect, upload.single('image'), startSession);

/**
 * @route   POST /api/doubts/:id/message
 * @desc    Send a follow-up message in a doubt session
 * @access  Private
 */
router.post('/:id/message', protect, sendMessage);

/**
 * @route   POST /api/doubts/:id/reveal-step
 * @desc    Reveal the next hint/step for an existing session
 * @access  Private
 */
router.post('/:id/reveal-step', protect, revealHint);

module.exports = router;
