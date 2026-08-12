const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const calendarService = require('../services/calendarService');
const StudyPlan = require('../models/StudyPlan');
const User = require('../models/User');

// Initiates Google OAuth flow or triggers sync if already authorized
router.post('/google-sync', protect, async (req, res) => {
  try {
    const { planId } = req.body;
    
    // Check if user already has a refresh token
    const user = await User.findByPk(req.user.id);
    if (!user.googleCalendarRefreshToken) {
      // Need to authorize
      const auth = calendarService.getOAuthClient();
      const authUrl = auth.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // Force consent to get refresh token
        scope: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar'],
        state: planId, // Pass planId in state to sync it after callback
      });
      return res.json({ success: true, authUrl });
    }

    // Already authorized, perform sync
    const plan = await StudyPlan.findOne({
      where: { id: planId, user: req.user.id },
    });
    
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Study plan not found' });
    }

    await calendarService.syncToGoogleCalendar(plan, user);
    
    res.json({ success: true, message: 'Successfully synced to Google Calendar.' });
  } catch (error) {
    console.error('Google Sync Error:', error);
    if (error.message.includes('refresh token') || error.message.includes('invalid_grant')) {
      // Token might be revoked, clear it
      await User.update({ googleCalendarRefreshToken: null, syncGoogleCalendar: false }, { where: { id: req.user.id } });
      return res.status(401).json({ success: false, error: 'Calendar authorization revoked. Please try again.' });
    }
    res.status(500).json({ success: false, error: 'Failed to sync with Google Calendar' });
  }
});

// OAuth Callback
router.get('/google-callback', protect, async (req, res) => {
  try {
    const { code, state: planId } = req.query;
    
    if (!code) {
      return res.status(400).json({ success: false, error: 'No authorization code provided' });
    }

    await calendarService.linkGoogleCalendar(code, req.user.id);

    if (planId) {
      const plan = await StudyPlan.findOne({
        where: { id: planId, user: req.user.id },
      });
      const user = await User.findByPk(req.user.id);
      
      if (plan) {
        await calendarService.syncToGoogleCalendar(plan, user);
      }
    }

    // Return a script that closes the popup and refreshes the parent page
    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage('google_calendar_sync_success', '*');
          window.close();
        } else {
          window.location.href = '/dashboard';
        }
      </script>
    `);
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    res.status(500).send(`
      <script>
        if (window.opener) {
          window.opener.postMessage('google_calendar_sync_error', '*');
          window.close();
        } else {
          document.write('Error syncing with Google Calendar. You can close this window.');
        }
      </script>
    `);
  }
});

module.exports = router;
