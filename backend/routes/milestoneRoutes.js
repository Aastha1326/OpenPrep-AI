const express = require('express');
const { getMilestones, claimMilestone } = require('../controllers/milestoneController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/').get(protect, getMilestones);
router.route('/:id/claim').put(protect, claimMilestone);

module.exports = router;
