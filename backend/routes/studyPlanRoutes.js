const express = require('express');
const {
  generateAIPlan,
  getActivePlan,
  toggleTaskCompletion,
  getPlans,
  getWeaknessAnalysis,
  rescheduleAdaptivePlan,
} = require('../controllers/studyPlanController');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { checkQuota } = require('../middleware/quotaMiddleware');
const {
  validateGenerateAIPlan,
  validateToggleTask,
} = require('../middleware/validators');

const router = express.Router();

router.post('/generate-ai', protect, aiLimiter, checkQuota, validateGenerateAIPlan, generateAIPlan);
router.get('/active', protect, getActivePlan);
router.get('/plans', protect, getPlans);
router.get('/weakness-analysis', protect, aiLimiter, getWeaknessAnalysis);
router.post('/reschedule-adaptive', protect, rescheduleAdaptivePlan);
router.put('/:planId/tasks/:taskId', protect, validateToggleTask, toggleTaskCompletion);

module.exports = router;
