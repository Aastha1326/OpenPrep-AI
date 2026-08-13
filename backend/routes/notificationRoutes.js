const express = require('express');
const {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  subscribePushNotifications,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Real-time notification center and Web Push subscription endpoints
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Retrieve recent notifications and unread count for current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications retrieved successfully
 */
router.get('/', protect, getUserNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/:id/read', protect, markNotificationRead);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications for current user as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/read-all', protect, markAllNotificationsRead);

/**
 * @swagger
 * /api/notifications/subscribe-push:
 *   post:
 *     summary: Register browser Web Push VAPID subscription
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *               - keys
 *             properties:
 *               endpoint:
 *                 type: string
 *               keys:
 *                 type: object
 *                 properties:
 *                   p256dh:
 *                     type: string
 *                   auth:
 *                     type: string
 *     responses:
 *       201:
 *         description: Push subscription saved successfully
 */
router.post('/subscribe-push', protect, subscribePushNotifications);

module.exports = router;
