const express = require('express');
const { protect } = require('../middleware/auth');
const {
  subscribe,
  unsubscribe,
  updatePreferences,
  getPublicKey
} = require('../controllers/notificationController');

const router = express.Router();

router.use(protect);

router.get('/vapid-public-key', getPublicKey);
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
router.put('/preferences', updatePreferences);

module.exports = router;
