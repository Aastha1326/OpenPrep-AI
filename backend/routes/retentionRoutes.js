const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getRetentionForecast } = require('../controllers/retentionController');

router.get('/retention', protect, getRetentionForecast);

module.exports = router;
