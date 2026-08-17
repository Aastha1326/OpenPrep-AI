const express = require('express');
const { protect } = require('../middleware/auth');
const { getSummary, useStreakFreeze } = require('../controllers/gamificationController');

const router = express.Router();

router.use(protect);

router.get('/summary', getSummary);
router.post('/streak-freeze/use', useStreakFreeze);

module.exports = router;
