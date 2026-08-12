const express = require('express');
const {
  updateAvatar,
  deleteAvatar,
  getQuota,
  getExamCountdownPreferences,
  updateExamCountdownPreferences,
} = require('../controllers/userController');const { protect } = require('../middleware/auth');
const avatarUpload = require('../middleware/avatarUpload');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management endpoints
 */

/**
 * @swagger
 * /api/users/quota:
 *   get:
 *     summary: Get remaining daily AI requests quota
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quota retrieved successfully
 */

/**
 * @swagger
 * /api/users/avatar:
 *   put:
 *     summary: Upload or replace the authenticated user's avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar updated successfully
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
 *                     avatar:
 *                       type: string
 *                       example: "/uploads/avatars/avatar-1a2b3c-169900.png"
 *       400:
 *         description: No file uploaded or invalid file type
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
 *   delete:
 *     summary: Remove the authenticated user's avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar removed successfully
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Get remaining daily AI requests quota
router.get('/quota', protect, getQuota);
// Exam countdown preferences
router.get('/exam-countdown', protect, getExamCountdownPreferences);
router.put('/exam-countdown', protect, updateExamCountdownPreferences);
// Upload/replace the authenticated user's avatar
router.put('/avatar', protect, avatarUpload.single('avatar'), updateAvatar);

// Remove the authenticated user's avatar
router.delete('/avatar', protect, deleteAvatar);

module.exports = router;
