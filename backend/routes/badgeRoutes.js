const express = require('express');
const router = express.Router();
const {
  getAllBadges,
  getUserBadges,
  evaluateUserBadges,
  getLeaderboardData,
  initializeBadges,
} = require('../controllers/badgeController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getAllBadges);
router.route('/user').get(protect, getUserBadges);
router.route('/evaluate').post(protect, evaluateUserBadges);
router.route('/leaderboard').get(protect, getLeaderboardData);
router.route('/initialize').post(protect, initializeBadges);

module.exports = router;
