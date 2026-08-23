const integrationService = require('../services/integrationService');
const notionSyncService = require('../services/notionSyncService');
const iCalExportService = require('../services/iCalExportService');

/**
 * @desc    Get Google OAuth authorization URL
 * @route   GET /api/integrations/google/auth
 * @access  Private
 */
exports.getGoogleAuthUrl = (req, res) => {
  try {
    const url = integrationService.getGoogleAuthUrl(req.user.id);
    return res.json({ success: true, url });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Sync sessions to Google Calendar
 * @route   POST /api/integrations/google/sync
 * @access  Private
 */
exports.syncGoogleCalendar = async (req, res) => {
  try {
    const { tokens, events } = req.body;
    if (!tokens) return res.status(400).json({ message: 'Google OAuth tokens required' });

    const result = await integrationService.syncToGoogleCalendar(tokens, events || []);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Sync sessions to Notion Database
 * @route   POST /api/integrations/notion/sync
 * @access  Private
 */
exports.syncNotion = async (req, res) => {
  try {
    const { apiKey, databaseId, events } = req.body;
    const result = await notionSyncService.syncToNotion(apiKey, databaseId, events || []);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Export .ics Calendar feed
 * @route   GET /api/integrations/calendar/feed.ics
 * @access  Public (or token-based)
 */
exports.getICalFeed = (req, res) => {
  try {
    const feed = iCalExportService.generateICalendarFeed();
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="openprep-schedule.ics"');
    return res.send(feed);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
