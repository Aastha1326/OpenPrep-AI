const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const User = require('../models/User');
const avatarsDir = path.resolve(path.join(__dirname, '../uploads/avatars'));

// Safely remove a previously stored avatar file. Guards against path
// traversal (in case avatar ever held anything other than a value this
// controller generated) and silently ignores files that are already gone.
function deletePreviousAvatar(avatarUrl) {
  if (!avatarUrl) return;

  const filePath = path.resolve(path.join(__dirname, '..', avatarUrl));
  const relative = path.relative(avatarsDir, filePath);
  const isInside = relative && !relative.startsWith('..') && !path.isAbsolute(relative);

  if (!isInside) return;

  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Failed to delete previous avatar file:', err);
    }
  });
}

// ---------------------------------------------------------------------------
// @desc    Upload/replace the authenticated user's avatar
// @route   PUT /api/users/avatar
// @access  Private
// ---------------------------------------------------------------------------
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No avatar file uploaded' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const previousAvatar = user.avatar;
    const newAvatarUrl = `/uploads/avatars/${req.file.filename}`;

    user.avatar = newAvatarUrl;
    await user.save();

    // Only remove the old file after the new avatar is safely persisted, so
    // a failed save never leaves the user without any avatar file on disk.
    // This is the fix for #477: previously nothing ever unlinked the old
    // file here, so every re-upload left an orphaned image behind.
    if (previousAvatar && previousAvatar !== newAvatarUrl) {
      deletePreviousAvatar(previousAvatar);
    }

    res.status(200).json({
      success: true,
      data: { avatar: user.avatar },
    });
  } catch (error) {
    // Clean up the just-uploaded file if persisting the user record failed,
    // so a DB error doesn't leave an orphaned file either.
    if (req.file) {
      const filePath = path.join(avatarsDir, req.file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Remove the authenticated user's avatar
// @route   DELETE /api/users/avatar
// @access  Private
// ---------------------------------------------------------------------------
exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const previousAvatar = user.avatar;
    user.avatar = '';
    await user.save();

    if (previousAvatar) {
      deletePreviousAvatar(previousAvatar);
    }

    res.status(200).json({ success: true, data: { avatar: user.avatar } });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Get remaining daily AI requests quota
// @route   GET /api/users/quota
// @access  Private
// ---------------------------------------------------------------------------
exports.getQuota = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const now = new Date();
    const lastReset = user.lastAiUsageReset ? new Date(user.lastAiUsageReset) : null;
    const needsReset =
      !lastReset ||
      lastReset.getUTCFullYear() !== now.getUTCFullYear() ||
      lastReset.getUTCMonth() !== now.getUTCMonth() ||
      lastReset.getUTCDate() !== now.getUTCDate();

    if (needsReset) {
      user.dailyAiUsageCount = 0;
      user.lastAiUsageReset = now;
      await user.save();
    }

    const TIER_LIMITS = {
      student: 15,
      contributor: 50,
      admin: 100,
      premium: 100,
      default: 15,
    };

    const limit = TIER_LIMITS[user.role] || TIER_LIMITS.default;
    const remaining = Math.max(0, limit - user.dailyAiUsageCount);
    const tomorrowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const secondsUntilReset = Math.ceil((tomorrowUTC.getTime() - now.getTime()) / 1000);

    res.status(200).json({
      success: true,
      limit,
      remaining,
      used: user.dailyAiUsageCount,
      secondsUntilReset,
      resetTime: tomorrowUTC.toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
// ---------------------------------------------------------------------------
// @desc    Get exam countdown preferences
// @route   GET /api/users/exam-countdown
// @access  Private
// ---------------------------------------------------------------------------
exports.getExamCountdownPreferences = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['examCountdownPreferences'],
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user.examCountdownPreferences || {
        targetExamDate: null,
        targetScore: null,
        milestones: [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Update exam countdown preferences
// @route   PUT /api/users/exam-countdown
// @access  Private
// ---------------------------------------------------------------------------
exports.updateExamCountdownPreferences = async (req, res, next) => {
  try {
    const { targetExamDate, targetScore, milestones } = req.body;

    if (targetExamDate && Number.isNaN(new Date(targetExamDate).getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid target exam date',
      });
    }

    if (
      targetScore !== null &&
      targetScore !== undefined &&
      (Number.isNaN(Number(targetScore)) || Number(targetScore) < 0)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Target score must be a valid non-negative number',
      });
    }

    if (!Array.isArray(milestones)) {
      return res.status(400).json({
        success: false,
        error: 'Milestones must be an array',
      });
    }

    const normalizedMilestones = milestones
      .filter((milestone) => milestone?.title && milestone?.date)
      .map((milestone) => ({
        id: milestone.id || crypto.randomUUID(),
        title: String(milestone.title).trim().slice(0, 100),
        date: milestone.date,
        completed: Boolean(milestone.completed),
      }));

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.examCountdownPreferences = {
      targetExamDate: targetExamDate || null,
      targetScore: targetScore !== undefined && targetScore !== null
        ? Number(targetScore)
        : null,
      milestones: normalizedMilestones,
    };

    await user.save();

    res.status(200).json({
      success: true,
      data: user.examCountdownPreferences,
    });
  } catch (error) {
    next(error);
  }
};