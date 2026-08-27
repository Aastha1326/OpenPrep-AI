const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getGoogleAuthUrl,
  syncGoogleCalendar,
  syncNotion,
  getICalFeed,
} = require('../controllers/integrationController');

router.get('/google/auth', protect, getGoogleAuthUrl);
router.post('/google/sync', protect, syncGoogleCalendar);
router.post('/notion/sync', protect, syncNotion);
router.get('/calendar/feed.ics', getICalFeed);

module.exports = router;
