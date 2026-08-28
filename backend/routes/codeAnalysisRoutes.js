const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  analyzeCodeReview,
  checkCodeSimilarity,
} = require('../controllers/codeAnalysisController');

router.post('/review', protect, analyzeCodeReview);
router.post('/check-similarity', protect, checkCodeSimilarity);

module.exports = router;
