const User = require('../models/User');
// Required as a namespace rather than destructured so the service functions
// remain replaceable in tests without mocking the module graph.
const accountDataService = require('../services/accountDataService');

/**
 * Typed instead of a password for accounts that authenticate through an OAuth
 * provider and therefore have no password to re-enter.
 */
const DELETE_CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';

const filenameTimestamp = (date = new Date()) => date.toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// @desc    Download every piece of data the account owns as a JSON archive
// @route   GET /api/users/me/export
// @access  Private
// ---------------------------------------------------------------------------
exports.exportAccountData = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const archive = await accountDataService.buildAccountExport(user);

    // Served as an attachment so the browser saves it rather than rendering a
    // wall of JSON; the date in the name keeps successive exports distinct.
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="openprep-export-${filenameTimestamp()}.json"`
    );
    // A personal data archive must never be cached by a shared proxy.
    res.setHeader('Cache-Control', 'no-store, private');

    return res.status(200).json(archive);
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Permanently delete the authenticated account and all owned data
// @route   DELETE /api/users/me
// @access  Private
// ---------------------------------------------------------------------------
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { password, confirmation } = req.body || {};
    const hasLocalPassword = Boolean(user.password);

    if (hasLocalPassword) {
      if (!password) {
        return res.status(400).json({
          success: false,
          error: 'Password confirmation is required to delete your account',
        });
      }

      const matches = await user.matchPassword(password);
      if (!matches) {
        // Deliberately does not distinguish a wrong password from any other
        // rejection, and never reveals whether the account has a password set.
        return res.status(401).json({ success: false, error: 'Incorrect password' });
      }
    } else if (confirmation !== DELETE_CONFIRMATION_PHRASE) {
      // OAuth-only account: there is no password to check, so require the
      // phrase to be typed exactly.
      return res.status(400).json({
        success: false,
        error: `Type "${DELETE_CONFIRMATION_PHRASE}" to confirm account deletion`,
      });
    }

    const result = await accountDataService.deleteAccount(user);

    if (req.log) {
      req.log.info('account deleted', {
        deletedCounts: result.deletedCounts,
        filesRemoved: result.filesRemoved,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        message: 'Your account and all associated data have been permanently deleted.',
        deleted: result.deletedCounts,
        filesRemoved: result.filesRemoved,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.DELETE_CONFIRMATION_PHRASE = DELETE_CONFIRMATION_PHRASE;
exports.EXPORT_SCHEMA_VERSION = accountDataService.EXPORT_SCHEMA_VERSION;
