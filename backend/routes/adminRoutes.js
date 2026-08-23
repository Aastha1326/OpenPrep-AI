const express = require('express');
const {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getAdminBadges,
  createAdminBadge,
  updateAdminBadge,
  deleteAdminBadge,
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply protect and requireAdmin globally to all admin routes
router.use(protect);
router.use(requireAdmin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Badge Criteria Management
router.get('/badges', getAdminBadges);
router.post('/badges', createAdminBadge);
router.put('/badges/:id', updateAdminBadge);
router.delete('/badges/:id', deleteAdminBadge);

module.exports = router;
