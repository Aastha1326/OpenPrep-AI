const express = require('express');
const {
  getStats,
  getAnalytics,
  getUsers,
  getQueueStatus,
  updateUserRole,
  deleteUser,
  getAdminBadges,
  createAdminBadge,
  updateAdminBadge,
  deleteAdminBadge,
} = require('../controllers/adminController');
const { liftShadowBan } = require('../controllers/discussionController');
const { protect, requireAdmin } = require('../middleware/auth');
const {
  getSecurityLogs,
  exportSecurityLogs,
  getThreatSummary,
} = require('../controllers/securityController');

const { getRedisStatus } = require('../controllers/redisController');

const router = express.Router();

// Apply protect and requireAdmin globally to all admin routes
router.use(protect);
router.use(requireAdmin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/queues/status', getQueueStatus);
router.get('/redis/status', getRedisStatus);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Moderation. Nothing cleared isShadowBanned before, so once the column was
// honoured an automatic ban would have been permanent with no appeal path.
router.patch('/users/:id/shadow-ban', liftShadowBan);

// Security Audit Logging
router.get('/security/logs', getSecurityLogs);
router.get('/security/export', exportSecurityLogs);
router.get('/security/threat-summary', getThreatSummary);

// Badge Criteria Management
router.get('/badges', getAdminBadges);
router.post('/badges', createAdminBadge);
router.put('/badges/:id', updateAdminBadge);
router.delete('/badges/:id', deleteAdminBadge);

module.exports = router;
