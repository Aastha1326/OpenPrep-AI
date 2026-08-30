const { SavedSession } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Controller managing auto-save and restoration of active study sessions.
 */

// POST /session/save or POST /api/session/save
exports.saveSession = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    const { payload, expiresAt, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required to save session.' });
    }

    if (!payload || (typeof payload === 'object' && Object.keys(payload).length === 0)) {
      return res.status(400).json({ success: false, error: 'Session payload cannot be empty.' });
    }

    // Default expiration: 7 days
    const expirationDate = expiresAt
      ? new Date(expiresAt)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Delete previous un-restored saved session for this user
    try {
      await SavedSession.destroy({
        where: {
          userId,
          restored: false,
        },
      });
    } catch (cleanErr) {
      logger.warn('Error clearing old saved sessions', { userId, error: cleanErr.message });
    }

    // Create new saved session record
    const savedRecord = await SavedSession.create({
      userId,
      payload: {
        ...payload,
        savedReason: reason || 'AUTO_SAVE_PRE_EXPIRY',
        savedAt: new Date().toISOString(),
      },
      expiresAt: expirationDate,
      restored: false,
    });

    logger.info('Session auto-saved to DB', { userId, sessionId: savedRecord.id, reason });

    return res.status(200).json({
      success: true,
      message: 'Session state saved successfully.',
      sessionId: savedRecord.id,
      savedAt: savedRecord.createdAt,
      expiresAt: savedRecord.expiresAt,
    });
  } catch (err) {
    logger.error('Failed to save session state', { error: err.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to auto-save session state.',
      details: err.message,
    });
  }
};

// GET /session/saved or GET /api/session/saved
exports.getSavedSession = async (req, res) => {
  try {
    const userId = req.user?.id || req.query?.userId;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }

    const activeSession = await SavedSession.findOne({
      where: {
        userId,
        restored: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!activeSession) {
      return res.status(200).json({
        success: true,
        hasSavedSession: false,
        session: null,
      });
    }

    return res.status(200).json({
      success: true,
      hasSavedSession: true,
      session: {
        id: activeSession.id,
        payload: activeSession.payload,
        createdAt: activeSession.createdAt,
        expiresAt: activeSession.expiresAt,
      },
    });
  } catch (err) {
    logger.error('Failed to retrieve saved session', { error: err.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to query saved session.',
      details: err.message,
    });
  }
};

// POST /session/restore or DELETE /session/saved
exports.restoreSession = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    const { sessionId, action = 'restore' } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }

    const query = { userId };
    if (sessionId) {
      query.id = sessionId;
    } else {
      query.restored = false;
    }

    if (action === 'discard') {
      await SavedSession.destroy({ where: query });
      logger.info('Saved session discarded', { userId, sessionId });
      return res.status(200).json({ success: true, message: 'Saved session discarded.' });
    }

    const [updatedCount] = await SavedSession.update(
      { restored: true },
      { where: query }
    );

    logger.info('Saved session marked restored', { userId, sessionId, updatedCount });

    return res.status(200).json({
      success: true,
      message: 'Session state restored successfully.',
      restoredCount: updatedCount,
    });
  } catch (err) {
    logger.error('Failed to process session restore', { error: err.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to process session restore.',
      details: err.message,
    });
  }
};
