const webpush = require('web-push');
const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');

// Configure VAPID keys if provided in environment, or fallback to dummy keys for dev/testing
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa45ffc77g0N7i431r9g0p89a5_mock_public_key';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'mock_private_key_1234567890abcdef';

try {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@openprep.ai',
    vapidPublicKey,
    vapidPrivateKey
  );
} catch (err) {
  console.warn('Web Push VAPID setup warning (using mock keys):', err.message);
}

/**
 * Create a new in-app notification, emit WebSocket event, and attempt Web Push delivery
 */
async function createNotification(userId, title, message, type = 'general', link = null, io = null) {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      link,
      isRead: false,
    });

    // Emit Socket.io real-time event if io instance is supplied
    if (io) {
      io.to(`user:${userId}`).emit('NOTIF_NEW', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        link: notification.link,
        createdAt: notification.createdAt,
      });
    }

    // Trigger Web Push payload asynchronously
    sendWebPushNotification(userId, {
      title,
      body: message,
      icon: '/icon-192.png',
      data: { link: link || '/dashboard' },
    }).catch((err) => console.warn('Web Push send error:', err.message));

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

/**
 * Send Web Push notification to user's registered browser endpoints
 */
async function sendWebPushNotification(userId, payload) {
  try {
    const subscriptions = await PushSubscription.findAll({ where: { user: userId } });
    if (!subscriptions || subscriptions.length === 0) return;

    const pushPayload = JSON.stringify(payload);

    for (const sub of subscriptions) {
      try {
        const pushConfig = {
          endpoint: sub.endpoint,
          keys: sub.keys,
        };
        await webpush.sendNotification(pushConfig, pushPayload);
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Expired or invalid subscription - clean up
          await sub.destroy();
        }
      }
    }
  } catch (error) {
    console.warn('Web push delivery failed:', error.message);
  }
}

module.exports = {
  createNotification,
  sendWebPushNotification,
};
