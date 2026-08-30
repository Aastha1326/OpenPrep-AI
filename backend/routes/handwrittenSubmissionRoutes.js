const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  uploadHandwrittenSubmission,
  getEvaluation,
} = require('../controllers/handwrittenSubmissionController');

router.post('/handwritten-upload', protect, upload.array('photos', 5), uploadHandwrittenSubmission);
router.get('/:id/evaluation', protect, getEvaluation);

module.exports = router;
