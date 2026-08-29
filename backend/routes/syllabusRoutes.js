const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const {
  uploadSyllabus,
  createSyllabus,
  getGapAnalysis,
  generateNotesForGap,
  getSyllabusCatalog,
  updateMastery,
  getProgress
} = require('../controllers/syllabusController');

const router = express.Router();

// Configure multer for PDF uploads
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf)$/)) {
      return cb(new Error('Please upload a PDF document.'));
    }
    cb(null, true);
  },
});

/**
 * @route   POST /api/syllabus/upload
 * @desc    Upload and parse a PDF syllabus file
 * @access  Private
 */
router.post('/upload', protect, upload.single('syllabus'), uploadSyllabus);

/**
 * @route   POST /api/syllabus
 * @desc    Create a new structured syllabus from raw text
 * @access  Private
 */
router.post('/', protect, createSyllabus);

/**
 * @route   GET /api/syllabus
 * @desc    Get syllabus catalog for current user
 * @access  Private
 */
router.get('/', protect, getSyllabusCatalog);

/**
 * @route   GET /api/syllabus/:id/gap-analysis
 * @desc    Get gap analysis for a specific syllabus
 * @access  Private
 */
router.get('/:id/gap-analysis', protect, getGapAnalysis);

/**
 * @route   PUT /api/syllabus/mastery
 * @desc    Update the mastery level of a specific subtopic
 * @access  Private
 */
router.put('/mastery', protect, updateMastery);

/**
 * @route   POST /api/syllabus/topics/:topicId/generate-notes
 * @desc    Generate study notes for a specific syllabus gap
 * @access  Private
 */
router.post('/topics/:topicId/generate-notes', protect, generateNotesForGap);

/**
 * @route   GET /api/syllabus/:syllabusId/progress
 * @desc    Fetch syllabus progress and predicted completion date
 * @access  Private
 */
router.get('/:syllabusId/progress', protect, getProgress);

module.exports = router;
