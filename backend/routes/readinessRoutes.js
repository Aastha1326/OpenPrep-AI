const express = require('express');
const { protect } = require('../middleware/auth');
const { getSubjectReadiness, recalculateReadiness } = require('../controllers/readinessController');

const router = express.Router();

router.get('/summary', protect, getSubjectReadiness);
router.post('/recalculate', protect, recalculateReadiness);

// Keep root endpoint for backward compatibility with basic ReadinessWidget
router.get('/', protect, getSubjectReadiness);

module.exports = router;
