const express = require('express');
const {
  generateAIPlan,
  getActivePlan,
  toggleTaskCompletion,
  moveTaskDate,
  getPlans,
  getWeaknessAnalysis,
  rescheduleAdaptivePlan,
  rescheduleOverdueTasks,
} = require('../controllers/studyPlanController');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { checkQuota } = require('../middleware/quotaMiddleware');
const {
  validateGenerateAIPlan,
  validateToggleTask,
  validateMoveTaskDate,
} = require('../middleware/validators');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Study Plans
 *   description: AI-generated and manual study plan management
 */

/**
 * @swagger
 * /api/study-plans/generate-ai:
 *   post:
 *     summary: Generate an AI-powered study plan
 *     tags: [Study Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - examId
 *               - startDate
 *             properties:
 *               examId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-06-15"
 *     responses:
 *       201:
 *         description: Study plan generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudyPlan'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Exam not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.post('/generate-ai', protect, aiLimiter, checkQuota, validateGenerateAIPlan, generateAIPlan);
router.get('/:id/export-ics', protect, studyPlanController.exportStudyPlanIcs);

/**
 * @swagger
 * /api/study-plans/active:
 *   get:
 *     summary: Get the active study plan for the authenticated user
 *     tags: [Study Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active study plan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudyPlan'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No active study plan found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get('/active', protect, getActivePlan);

/**
 * @swagger
 * /api/study-plans/plans:
 *   get:
 *     summary: Get all study plans for the authenticated user
 *     tags: [Study Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of study plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StudyPlan'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get('/plans', protect, getPlans);

/**
 * @swagger
 * /api/study-plans/weakness-analysis:
 *   get:
 *     summary: Get weakness analysis for the authenticated user
 *     tags: [Study Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weakness analysis data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     weakTopics:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           topic:
 *                             type: string
 *                           subject:
 *                             type: string
 *                           score:
 *                             type: number
 *                     strongTopics:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           topic:
 *                             type: string
 *                           subject:
 *                             type: string
 *                           score:
 *                             type: number
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get('/weakness-analysis', protect, aiLimiter, getWeaknessAnalysis);

/**
 * @swagger
 * /api/study-plans/reschedule-adaptive:
 *   post:
 *     summary: Reschedule adaptive study plan based on performance
 *     tags: [Study Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Study plan rescheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudyPlan'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No active study plan found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.post('/reschedule-adaptive', protect, rescheduleAdaptivePlan);

/**
 * @swagger
 * /api/study-plans/{planId}/tasks/{taskId}:
 *   put:
 *     summary: Toggle task completion status
 *     tags: [Study Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Study plan ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - completed
 *             properties:
 *               completed:
 *                 type: boolean
 *               studyTimeMinutes:
 *                 type: integer
 *                 minimum: 0
 *                 example: 60
 *     responses:
 *       200:
 *         description: Task status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudyPlan'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Study plan or task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.put('/:planId/tasks/:taskId', protect, validateToggleTask, toggleTaskCompletion);
router.put('/:planId/tasks/:taskId/date', protect, validateMoveTaskDate, moveTaskDate);

/**
 * @swagger
 * /api/study-plans/{id}/reschedule:
 *   post:
 *     summary: Reschedule overdue tasks for a study plan
 *     tags: [Study Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Study plan ID
 *     responses:
 *       200:
 *         description: Overdue tasks rescheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudyPlan'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Study plan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/reschedule', protect, aiLimiter, checkQuota, rescheduleOverdueTasks);

module.exports = router;
