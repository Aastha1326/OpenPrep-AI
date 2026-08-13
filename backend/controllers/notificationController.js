const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');

// @desc    Get user notifications & unread count
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { user: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const unreadCount = await Notification.count({
      where: { user: req.user.id, isRead: false },
    });

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    const unreadCount = await Notification.count({
      where: { user: req.user.id, isRead: false },
    });

    res.status(200).json({
      success: true,
      unreadCount,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all user notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { user: req.user.id, isRead: false } }
    );

    res.status(200).json({
      success: true,
      unreadCount: 0,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save browser Web Push subscription
// @route   POST /api/notifications/subscribe-push
// @access  Private
exports.subscribePushNotifications = async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        error: 'Valid push subscription endpoint and keys are required',
      });
    }

    let sub = await PushSubscription.findOne({
      where: { user: req.user.id, endpoint },
    });

    if (sub) {
      sub.keys = keys;
      await sub.save();
    } else {
      sub = await PushSubscription.create({
        user: req.user.id,
        endpoint,
        keys,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Web Push subscription registered successfully',
      data: sub,
    });
  } catch (error) {
    next(error);
  }
};
