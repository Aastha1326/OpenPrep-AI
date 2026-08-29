const { vapidPublicKey } = require('../services/smartNotificationService');

/**
 * Endpoint to get the VAPID public key for the frontend to subscribe to Web Push.
 */
exports.getVapidKey = (req, res) => {
  res.status(200).json({ publicKey: vapidPublicKey });
};

/**
 * Registers browser VAPID push subscription.
 */
exports.subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    
    // In a real application, we would update the user record in the DB:
    // await User.findByIdAndUpdate(req.user.id, { pushSubscription: subscription });
    
    res.status(201).json({ message: 'Push subscription created successfully.' });
  } catch (error) {
    console.error('Failed to subscribe:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Configures quiet hours and reminder frequencies.
 */
exports.updatePreferences = async (req, res) => {
  try {
    const { quietHours, frequency } = req.body;
    
    // In a real application, we would update the user's preferences in the DB:
    // await User.findByIdAndUpdate(req.user.id, { 
    //   notificationPreferences: { quietHours, frequency } 
    // });

    res.status(200).json({ message: 'Notification preferences updated.' });
  } catch (error) {
    console.error('Failed to update preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
