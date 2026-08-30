/**
 * @fileoverview API routes for Skill Gap Analysis.
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const skillGapController = require('../controllers/skillGapController');

// Configure multer for memory storage (max 5MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and DOCX files are allowed.'), false);
        }
    }
});

/**
 * @route   POST /api/skill-gap/analyze
 * @desc    Upload resume and job description for analysis
 * @access  Private
 */
router.post('/analyze', upload.single('resume'), skillGapController.analyzeResume);

/**
 * @route   GET /api/skill-gap/history
 * @desc    Get historical skill gap analyses
 * @access  Private
 */
router.get('/history', skillGapController.getHistory);
/**
 * @route   GET /api/skill-gap/dependency-graph
 * @desc    Get the user's skill dependency graph and root-cause gaps
 * @access  Private
 */
router.get(
    '/dependency-graph',
    skillGapController.getDependencyGraph
);

/**
 * @route   POST /api/skill-gap/dependency
 * @desc    Create a prerequisite relationship between two skills
 * @access  Private
 */
router.post(
    '/dependency',
    skillGapController.createDependency
);
module.exports = router;
