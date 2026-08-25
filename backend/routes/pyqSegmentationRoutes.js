/**
 * @fileoverview API routes for PYQ Auto-Segmentation and OCR.
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const pyqSegmentationController = require('../controllers/pyqSegmentationController');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

/**
 * @route   POST /api/pyq/auto-segment
 * @desc    Uploads raw PDF, triggers OCR and bounding-box segmentation
 * @access  Private
 */
router.post('/auto-segment', upload.single('pdf'), pyqSegmentationController.autoSegment);

/**
 * @route   GET /api/pyq/segmented-questions/:jobId
 * @desc    Fetches parsed questions for review and editing before publishing
 * @access  Private
 */
router.get('/segmented-questions/:jobId', pyqSegmentationController.getSegmentedQuestions);

module.exports = router;
