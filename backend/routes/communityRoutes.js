const express = require('express');
const {
  submitFeedback,
  getFeedbackList,
  upvoteFeedback,
  getPublicRoadmap,
} = require('../controllers/communityController');
const { protect } = require('../middleware/auth');
const { validateSubmitFeedback } = require('../middleware/validators');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Community
 *   description: Feedback and roadmap endpoints
 */

/**
 * @swagger
 * /api/community/feedback:
 *   post:
 *     summary: Submit feedback
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 100
 *                 example: "Add dark mode support"
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 example: "It would be great to have a dark mode option for late-night studying."
 *               category:
 *                 type: string
 *                 enum: [Feature, Bug, Improvement, Other]
 *                 example: Feature
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Feedback'
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
 */

router.post('/feedback', protect, validateSubmitFeedback, submitFeedback);

/**
 * @swagger
 * /api/community/feedback:
 *   get:
 *     summary: Get all feedback submitted by the authenticated user
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's feedback
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
 *                     $ref: '#/components/schemas/Feedback'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get('/feedback', protect, getFeedbackList);

/**
 * @swagger
 * /api/community/feedback/{id}/upvote:
 *   put:
 *     summary: Upvote a feedback item
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback upvoted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Feedback'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Feedback not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.put('/feedback/:id/upvote', protect, upvoteFeedback);

/**
 * @swagger
 * /api/community/roadmap:
 *   get:
 *     summary: Get public roadmap
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Public roadmap items
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [Planned, In Progress, Completed, Cancelled]
 *                       category:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get('/roadmap', protect, getPublicRoadmap);

module.exports = router;
