const User = require('../models/User');

exports.getPublicKey = (req, res) => {
  res.status(200).json({
    success: true,
    publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB-5c0J09X9vD_sUj0W0g1zKs' // Fallback for dev if not set
  });
};

exports.subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription) {
      return res.status(400).json({ success: false, error: 'Subscription is required' });
    }
    
    await User.update(
      { pushSubscription: subscription },
      { where: { id: req.user.id } }
    );
    
    res.status(201).json({ success: true, data: 'Subscribed successfully' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    await User.update(
      { pushSubscription: null },
      { where: { id: req.user.id } }
    );
    
    res.status(200).json({ success: true, data: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { dailyReminderTime } = req.body;
    
    // Validate format like "18:00"
    if (dailyReminderTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(dailyReminderTime)) {
      return res.status(400).json({ success: false, error: 'Invalid time format. Use HH:MM' });
    }
    
    await User.update(
      { dailyReminderTime },
      { where: { id: req.user.id } }
    );
    
    res.status(200).json({ success: true, data: { dailyReminderTime } });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
