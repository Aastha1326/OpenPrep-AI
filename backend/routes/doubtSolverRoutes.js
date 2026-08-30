/**
 * @fileoverview API routes for the Multi-Modal AI Doubt Solver.
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const doubtSolverController = require('../controllers/doubtSolverController');

// Configure multer for memory storage (max 5MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed.'), false);
        }
    }
});

/**
 * @route   POST /api/doubt-solver/solve
 * @desc    Upload an image and optional text to get an AI-powered step-by-step solution
 * @access  Private
 */
router.post('/solve', upload.single('image'), doubtSolverController.solveDoubt);

module.exports = router;
