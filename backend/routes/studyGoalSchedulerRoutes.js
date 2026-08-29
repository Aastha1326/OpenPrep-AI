const express = require('express');
const { protect } = require('../middleware/auth');
const {
  generateSchedule,
  getCurrentSchedule,
  rescheduleBlock,
  detectConflicts,
  getSubjectPriorities,
  getFlashcardLoad,
  getAdherence,
  getOptimalBlockDuration,
} = require('../controllers/studyGoalSchedulerController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Study Scheduler
 *   description: Weekly study schedule generation, optimization, and adherence tracking
 */

/**
 * @swagger
 * /api/study-scheduler/generate:
 *   post:
 *     summary: Generate a personalized weekly study schedule
 *     tags: [Study Scheduler]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               availability:
 *                 type: array
 *                 description: Daily availability windows (0=Sunday, 6=Saturday)
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 6
 *                     startHour:
 *                       type: number
 *                     endHour:
 *                       type: number
 *               dailyHours:
 *                 type: number
 *                 minimum: 0.5
 *                 maximum: 12
 *                 description: Target daily study hours
 *               examId:
 *                 type: string
 *                 format: uuid
 *               weekStartDate:
 *                 type: string
 *                 format: date
 *                 description: Monday of target week
 *               blockMinutes:
 *                 type: integer
 *                 minimum: 15
 *                 maximum: 120
 *     responses:
 *       201:
 *         description: Weekly schedule generated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.post('/generate', protect, generateSchedule);

/**
 * @swagger
 * /api/study-scheduler/current:
 *   get:
 *     summary: Get current or most recently generated weekly schedule
 *     tags: [Study Scheduler]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weekStart
 *         schema:
 *           type: string
 *           format: date
 *         description: Specific week to retrieve (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Current schedule
 */
router.get('/current', protect, getCurrentSchedule);

/**
 * @swagger
 * /api/study-scheduler/reschedule:
 *   put:
 *     summary: Move a study block to a new time slot
 *     tags: [Study Scheduler]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [blockId, newDate, newStartHour, currentSchedule]
 *             properties:
 *               blockId:
 *                 type: string
 *                 format: uuid
 *               newDate:
 *                 type: string
 *                 format: date
 *               newStartHour:
 *                 type: number
 *                 description: Decimal hour (e.g. 14.5 = 2:30 PM)
 *               currentSchedule:
 *                 type: object
 *                 description: The current schedule object
 *     responses:
 *       200:
 *         description: Block rescheduled successfully
 *       400:
 *         description: Conflict or validation error
 */
router.put('/reschedule', protect, rescheduleBlock);

/**
 * @swagger
 * /api/study-scheduler/detect-conflicts:
 *   post:
 *     summary: Detect time conflicts in a set of blocks
 *     tags: [Study Scheduler]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [blocks]
 *             properties:
 *               blocks:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Conflict analysis results
 */
router.post('/detect-conflicts', protect, detectConflicts);

/**
 * @swagger
 * /api/study-scheduler/priorities:
 *   get:
 *     summary: Get subject priority scores for scheduling
 *     tags: [Study Scheduler]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: examId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Subject priorities with rationale
 */
router.get('/priorities', protect, getSubjectPriorities);

/**
 * @swagger
 * /api/study-scheduler/flashcard-load:
 *   get:
 *     summary: Get flashcard review load for scheduling
 *     tags: [Study Scheduler]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: examId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Flashcard review load per subject
 */
router.get('/flashcard-load', protect, getFlashcardLoad);

/**
 * @swagger
 * /api/study-scheduler/adherence:
 *   get:
 *     summary: Get schedule adherence report for a specific week
 *     tags: [Study Scheduler]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weekStart
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Monday of the week to analyze (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Adherence report with daily breakdown
 *       400:
 *         description: Missing weekStart parameter
 */
router.get('/adherence', protect, getAdherence);

/**
 * @swagger
 * /api/study-scheduler/optimal-block:
 *   get:
 *     summary: Get the optimal study block duration based on focus session data
 *     tags: [Study Scheduler]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Optimal block duration recommendation
 */
router.get('/optimal-block', protect, getOptimalBlockDuration);

module.exports = router;
