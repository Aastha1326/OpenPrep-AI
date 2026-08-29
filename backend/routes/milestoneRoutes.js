/**
 * @fileoverview Express router for the Study Milestone & Achievement Reward
 * system. All routes require JWT authentication.
 */
const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createMilestone,
  listMilestones,
  getMilestone,
  getMilestoneBySlug,
  updateMilestone,
  deactivateMilestone,
  getUserProgress,
  getUserMilestoneProgressById,
  evaluateMilestones,
  claimReward,
  getDashboard,
  evaluateAll,
} = require('../controllers/milestoneController');

const router = express.Router();

// ── Dashboard ────────────────────────────────────────────────────────────
router.get('/dashboard', protect, getDashboard);

// ── User Progress ────────────────────────────────────────────────────────
router.get('/progress', protect, getUserProgress);
router.post('/evaluate', protect, evaluateMilestones);
router.post('/evaluate-all', protect, evaluateAll);

// ── Milestone CRUD ───────────────────────────────────────────────────────
router.post('/', protect, createMilestone);
router.get('/', protect, listMilestones);

// Sub-routes with specific path patterns BEFORE parameterized routes
router.get('/slug/:slug', protect, getMilestoneBySlug);

router.get('/:id', protect, getMilestone);
router.put('/:id', protect, updateMilestone);
router.delete('/:id', protect, deactivateMilestone);

// ── Per-Milestone Progress & Reward Claim ────────────────────────────────
router.get('/:id/progress', protect, getUserMilestoneProgressById);
router.post('/:id/claim', protect, claimReward);

module.exports = router;
