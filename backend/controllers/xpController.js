const User = require('../models/User');
const xpService = require('../services/xpService');

function checkAndResetMonthlyStreakFreezes(user) {
  const currentMonth = new Date().toISOString().substring(0, 7); // "YYYY-MM"
  if (user.lastStreakFreezeEquipMonth !== currentMonth) {
    user.lastStreakFreezeEquipMonth = currentMonth;
    user.streakFreezesEquippedThisMonth = 0;
  }
}

exports.getXPStatus = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      level: user.level || 1,
      totalXP: user.xp || 0,
      skillPoints: user.skillPoints || 0,
      unlockedNodes: user.unlockedNodes || ['root'],
    });
  } catch (error) {
    next(error);
  }
};

exports.awardXP = async (req, res, next) => {
  try {
    const { activityType, amount } = req.body;
    if (!activityType || !amount || typeof amount !== 'number') {
      return res.status(400).json({ success: false, error: 'activityType and numeric amount are required' });
    }

    const result = await xpService.addXP(req.user, amount);

    res.status(200).json({
      success: true,
      message: `Awarded ${amount} XP for ${activityType}`,
      progression: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.unlockSkillNode = async (req, res, next) => {
  try {
    const { nodeId } = req.body;
    if (!nodeId) {
      return res.status(400).json({ success: false, error: 'nodeId is required' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const unlocked = user.unlockedNodes || ['root'];
    if (unlocked.includes(nodeId)) {
      return res.status(400).json({ success: false, error: 'Node already unlocked' });
    }

    const cost = 1;
    if ((user.skillPoints || 0) < cost) {
      return res.status(400).json({ success: false, error: 'Insufficient Skill Points' });
    }

    user.skillPoints -= cost;
    user.unlockedNodes = [...unlocked, nodeId];
    await user.save();

    res.status(200).json({
      success: true,
      message: `Successfully unlocked ${nodeId}`,
      unlockedNodes: user.unlockedNodes,
      skillPointsRemaining: user.skillPoints,
    });
  } catch (error) {
    next(error);
  }
};

exports.equipStreakFreeze = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    checkAndResetMonthlyStreakFreezes(user);

    if (user.streakFreezesEquippedThisMonth >= 2) {
      return res.status(400).json({
        success: false,
        error: 'You have already equipped the maximum limit of 2 Streak Freezes for this month.',
      });
    }

    user.streakFreezes = (user.streakFreezes || 0) + 1;
    user.streakFreezesEquippedThisMonth += 1;
    await user.save();

    res.status(200).json({
      success: true,
      streakFreezes: user.streakFreezes,
      equippedThisMonth: user.streakFreezesEquippedThisMonth,
    });
  } catch (error) {
    next(error);
  }
};
