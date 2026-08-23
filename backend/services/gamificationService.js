const User = require('../models/User');
const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const Quest = require('../models/Quest');

class GamificationService {
  /**
   * Adds XP to user and evaluates level milestones
   */
  async addXP(userId, amount) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    user.xp = (user.xp || 0) + amount;
    await user.save();
    return this.getLevelInfo(user.xp);
  }

  /**
   * Calculates current level, XP progress, and XP required for next level
   */
  getLevelInfo(xp = 0) {
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;
    const currentLevelBaseXP = Math.pow(level - 1, 2) * 100;
    const nextLevelBaseXP = Math.pow(level, 2) * 100;
    const levelXPProgress = xp - currentLevelBaseXP;
    const levelXPRequired = nextLevelBaseXP - currentLevelBaseXP;
    const progressPercent = Math.min(100, Math.round((levelXPProgress / levelXPRequired) * 100));

    return {
      level,
      currentXP: xp,
      levelXPProgress,
      levelXPRequired,
      progressPercent,
    };
  }

  /**
   * Evaluates criteria and awards eligible achievement badges
   */
  async checkAndAwardBadges(userId, actionType, metricValue) {
    const badges = await Badge.findAll({ where: { conditionType: actionType } });
    const userBadges = await UserBadge.findAll({ where: { userId } });
    const userBadgeIds = userBadges.map((ub) => ub.badgeId);

    const newlyUnlocked = [];

    for (const badge of badges) {
      if (!userBadgeIds.includes(badge.id) && metricValue >= badge.conditionValue) {
        await UserBadge.create({ userId, badgeId: badge.id });
        await this.addXP(userId, badge.xpReward);
        newlyUnlocked.push(badge);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Consumes or replenishes streak freezes
   */
  async useStreakFreeze(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    if ((user.streakFreezes || 0) <= 0) {
      throw new Error('No streak freezes available in inventory');
    }

    user.streakFreezes -= 1;
    await user.save();

    return { success: true, remainingFreezes: user.streakFreezes };
  }

  /**
   * Purchases a streak freeze using accumulated XP
   */
  async purchaseStreakFreeze(userId, costInXP = 300) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    if ((user.xp || 0) < costInXP) {
      throw new Error(`Insufficient XP. Required: ${costInXP}, Available: ${user.xp || 0}`);
    }

    user.xp -= costInXP;
    user.streakFreezes = (user.streakFreezes || 0) + 1;
    await user.save();

    return {
      success: true,
      streakFreezes: user.streakFreezes,
      remainingXP: user.xp,
    };
  }
}

module.exports = new GamificationService();
