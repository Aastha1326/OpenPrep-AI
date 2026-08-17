const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateStudySummary, generateCertificate } = require('../controllers/reportController');

router.get('/study-summary', protect, generateStudySummary);
router.get('/certificate', protect, generateCertificate);

module.exports = router;
