const express = require('express');
const { protect } = require('../middleware/auth');
const { getWeeklyLeaderboard } = require('../controllers/leaderboardController');

const router = express.Router();

/**
 * @swagger
 * /api/leaderboard:
 *   get:
 *     summary: Get the weekly study leaderboard (top performers this week)
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weekly leaderboard retrieved successfully
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
 *                     weekStart:
 *                       type: string
 *                       format: date-time
 *                     weekEnd:
 *                       type: string
 *                       format: date-time
 *                     entries:
 *                       type: array
 *                       description: Top 10 students ranked by composite score
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: integer
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           isAnonymous:
 *                             type: boolean
 *                           weeklyHours:
 *                             type: number
 *                           quizzesCompleted:
 *                             type: integer
 *                           flashcardsReviewed:
 *                             type: integer
 *                           score:
 *                             type: number
 *                     currentUser:
 *                       type: object
 *                       nullable: true
 *                       description: The requesting user's own rank and stats
 *                     totalParticipants:
 *                       type: integer
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Weekly study leaderboard (protected)
router.get('/', protect, getWeeklyLeaderboard);

module.exports = router;
