const express = require('express');
const { protect } = require('../middleware/auth');
const { startSession, respondSession, evaluateSession } = require('../controllers/vivaController');

const router = express.Router();

router.post('/start', protect, startSession);
router.post('/respond', protect, respondSession);
router.post('/evaluate', protect, evaluateSession);

module.exports = router;
