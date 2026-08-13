const express = require('express');
const { protect } = require('../middleware/auth');
const { rescheduleOverdueTasks } = require('../controllers/studyPlannerController');

const router = express.Router();

router.post('/reschedule', protect, rescheduleOverdueTasks);

module.exports = router;
