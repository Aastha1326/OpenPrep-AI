const express = require('express');
const { evaluate, getAll, getStats, claim, getById } = require('../controllers/milestoneRewardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/** @swagger tags: [{ name: 'Milestones', description: 'Learning milestone rewards and achievements' }] */

router.post('/evaluate', protect, evaluate);
router.get('/stats', protect, getStats);
router.get('/', protect, getAll);
router.get('/:id', protect, getById);
router.put('/:id/claim', protect, claim);

module.exports = router;
