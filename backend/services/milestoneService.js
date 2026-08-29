/**
 * @fileoverview Service layer for the Study Milestone & Achievement Reward system.
 * Evaluates user progress against defined milestones, detects tier advances,
 * and triggers reward distribution (XP bonuses, badge unlocks).
 *
 * Milestone definitions live in the `study_milestones` table and each one
 * declares:
 *   - `metricType` — the name of the metric to query (e.g. "quizzesTaken")
 *   - `thresholds` — a sorted array of tier objects with a numeric `target`
 *
 * The service does NOT own the metric collection; it consumes metrics already
 * tracked elsewhere in the system (quiz attempts, focus sessions, streak data).
 */
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const StudyMilestone = require('../models/StudyMilestone');
const UserMilestone = require('../models/UserMilestone');
const User = require('../models/User');
const QuizAttempt = require('../models/QuizAttempt');
const StudyGoalProgress = require('../models/StudyGoalProgress');
const Flashcard = require('../models/Flashcard');
const FocusSession = require('../models/FocusSession');
const Note = require('../models/Note');
const ActivityLog = require('../models/ActivityLog');

// ---------------------------------------------------------------------------
// Metric Collectors
// ---------------------------------------------------------------------------

/**
 * Each collector is keyed by the `metricType` value stored on a milestone
 * definition.  The collector returns a numeric value representing the user's
 * cumulative progress for that metric.
 */
const metricCollectors = {
  /**
   * Total number of quiz attempts the user has completed.
   */
  quizzesTaken: async (userId) => {
    return QuizAttempt.count({
      where: {
        user: userId,
        completed: { [Op.ne]: false },
      },
    });
  },

  /**
   * Cumulative study minutes recorded via progress entries whose source is
   * a focus session.  Falls back to summing all progress values.
   */
  totalStudyMinutes: async (userId) => {
    const result = await StudyGoalProgress.sum('value', {
      where: { user: userId },
    });
    // Values are stored as hours in the progress model — convert to minutes
    return Math.round((result || 0) * 60);
  },

  /**
   * Number of distinct days on which the user recorded at least one progress
   * entry — proxies for "active study days".
   */
  activeDays: async (userId) => {
    const entries = await StudyGoalProgress.findAll({
      where: { user: userId },
      attributes: ['recordedAt'],
    });
    const days = new Set();
    for (const entry of entries) {
      days.add(new Date(entry.recordedAt).toISOString().split('T')[0]);
    }
    return days.size;
  },

  /**
   * Total number of flashcards the user has created or reviewed.
   */
  flashcardsReviewed: async (userId) => {
    return Flashcard.count({ where: { user: userId } });
  },

  /**
   * Total number of notes the user has created.
   */
  notesCreated: async (userId) => {
    return Note.count({ where: { user: userId } });
  },

  /**
   * Number of focus sessions completed (study_sessions-like records).
   */
  focusSessionsCompleted: async (userId) => {
    return FocusSession.count({ where: { user: userId } });
  },

  /**
   * Best streak value pulled from the user's StudyGoal streak metrics.
   * This is a snapshot — the actual streak calculation lives in
   * studyGoalService.getStreakMetrics.
   */
  bestStreakDays: async (userId) => {
    // Delegate to StudyGoal's stored streak info
    const StudyGoal = require('../models/StudyGoal');
    const best = await StudyGoal.max('bestStreak', {
      where: { user: userId },
    });
    return best || 0;
  },

  /**
   * Combined score from quiz accuracy and study activity — a composite
   * "engagement score" for social / gamification milestones.
   */
  engagementScore: async (userId) => {
    const quizzes = await QuizAttempt.count({
      where: { user: userId, completed: { [Op.ne]: false } },
    });
    const notes = await Note.count({ where: { user: userId } });
    const flashcards = await Flashcard.count({ where: { user: userId } });
    // Weighted combination
    return quizzes * 2 + notes * 3 + flashcards * 1;
  },
};

// ---------------------------------------------------------------------------
// Core Evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate a single milestone for a single user.  Returns the updated
 * UserMilestone record (created or updated) plus a summary object.
 *
 * @param {string} userId
 * @param {string} milestoneId  UUID of the StudyMilestone to evaluate
 * @returns {{ userMilestone, tiersAdvanced, newlyCompleted, metricsValue }}
 */
async function evaluateMilestoneForUser(userId, milestoneId) {
  const milestone = await StudyMilestone.findByPk(milestoneId);
  if (!milestone) {
    throw new Error(`Milestone ${milestoneId} not found`);
  }

  // Ensure thresholds are sorted ascending by target
  const sorted = [...(milestone.thresholds || [])].sort(
    (a, b) => a.target - b.target
  );

  if (sorted.length === 0) {
    return {
      userMilestone: null,
      tiersAdvanced: 0,
      newlyCompleted: false,
      metricsValue: 0,
    };
  }

  // Collect the current metric value
  const collector = metricCollectors[milestone.metricType];
  let metricsValue = 0;
  if (collector) {
    metricsValue = await collector(userId);
  } else {
    // Unknown metric — fall back to 0 and skip
    return {
      userMilestone: null,
      tiersAdvanced: 0,
      newlyCompleted: false,
      metricsValue: 0,
    };
  }

  // Determine which tier the user currently qualifies for
  let newTier = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (metricsValue >= sorted[i].target) {
      newTier = i + 1; // tier count (0 = no tier, 1 = first tier, etc.)
    } else {
      break;
    }
  }

  // Find or create UserMilestone
  let [userMilestone, created] = await UserMilestone.findOrCreate({
    where: { userId, milestoneId },
    defaults: {
      currentValue: metricsValue,
      currentTier: newTier,
      highestTierReached: newTier,
      lastEvaluatedAt: new Date(),
      isComplete: newTier >= sorted.length,
      completedAt: newTier >= sorted.length ? new Date() : null,
    },
  });

  let tiersAdvanced = 0;
  let newlyCompleted = false;

  if (!created) {
    const previousTier = userMilestone.currentTier;
    tiersAdvanced = Math.max(0, newTier - previousTier);
    newlyCompleted =
      newTier >= sorted.length && userMilestone.currentTier < sorted.length;

    userMilestone.currentValue = metricsValue;
    userMilestone.currentTier = newTier;
    if (newTier > userMilestone.highestTierReached) {
      userMilestone.highestTierReached = newTier;
    }
    userMilestone.lastEvaluatedAt = new Date();
    if (newlyCompleted) {
      userMilestone.isComplete = true;
      userMilestone.completedAt = new Date();
    }
    await userMilestone.save();
  } else {
    tiersAdvanced = newTier;
    newlyCompleted = newTier >= sorted.length;
  }

  return { userMilestone, tiersAdvanced, newlyCompleted, metricsValue };
}

/**
 * Evaluate ALL active milestones for a single user.  Returns an array of
 * evaluation results.
 *
 * @param {string} userId
 * @returns {Array<{ milestone, userMilestone, tiersAdvanced, newlyCompleted, metricsValue }>}
 */
async function evaluateAllMilestonesForUser(userId) {
  const milestones = await StudyMilestone.findAll({
    where: { isActive: true },
    order: [['sortOrder', 'ASC']],
  });

  const results = [];
  for (const milestone of milestones) {
    const result = await evaluateMilestoneForUser(userId, milestone.id);
    results.push({ milestone, ...result });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Reward Distribution
// ---------------------------------------------------------------------------

/**
 * Award XP and optionally unlock a badge for a newly completed milestone.
 * This is called after evaluation detects that tiers were advanced.
 */
async function awardMilestoneRewards(userId, milestone, tiersAdvanced) {
  const rewards = [];

  if (milestone.rewardXp > 0 && tiersAdvanced > 0) {
    // Scale XP by tiers advanced — each tier grants a fraction of total reward
    const sorted = [...(milestone.thresholds || [])].sort(
      (a, b) => a.target - b.target
    );
    const xpPerTier =
      sorted.length > 0
        ? Math.ceil(milestone.rewardXp / sorted.length)
        : milestone.rewardXp;
    const xpToAward = xpPerTier * tiersAdvanced;

    // Add XP to user via the gamification system
    const user = await User.findByPk(userId);
    if (user) {
      const currentXp = user.xp || 0;
      user.xp = currentXp + xpToAward;
      await user.save();
      rewards.push({ type: 'xp', amount: xpToAward, totalXp: user.xp });
    }
  }

  // Badge unlock is handled by the badge evaluation service for
  // the highest tier only
  if (milestone.rewardBadgeCode) {
    rewards.push({
      type: 'badge_unlock',
      badgeCode: milestone.rewardBadgeCode,
      note: 'Will be evaluated by nightly badge evaluator cron',
    });
  }

  // Log the milestone progress event
  await ActivityLog.create({
    user: userId,
    activityType: 'milestone_progress',
    description: `Advanced ${tiersAdvanced} tier(s) on milestone: "${milestone.name}" (${milestone.iconEmoji || '🏆'})`,
  });

  return rewards;
}

// ---------------------------------------------------------------------------
// CRUD — Milestone Definitions
// ---------------------------------------------------------------------------

/**
 * Create a new milestone definition.
 */
async function createMilestone({
  name,
  slug,
  description,
  category,
  metricType,
  thresholds,
  rewardXp,
  rewardBadgeCode,
  iconEmoji,
  sortOrder,
  metadata,
}) {
  if (!name || !metricType || !thresholds || thresholds.length === 0) {
    throw new Error('name, metricType, and at least one threshold are required');
  }

  // Validate thresholds are sorted and numeric
  const sorted = [...thresholds].sort((a, b) => a.target - b.target);
  for (let i = 0; i < sorted.length; i++) {
    if (typeof sorted[i].target !== 'number' || sorted[i].target <= 0) {
      throw new Error(`Threshold ${i + 1} has an invalid target value`);
    }
    sorted[i].level = i + 1;
  }

  const computedSlug =
    slug ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  return StudyMilestone.create({
    name,
    slug: computedSlug,
    description: description || '',
    category: category || 'general',
    metricType,
    thresholds: sorted,
    rewardXp: rewardXp || 0,
    rewardBadgeCode: rewardBadgeCode || null,
    iconEmoji: iconEmoji || '🏆',
    sortOrder: sortOrder || 0,
    metadata: metadata || {},
  });
}

/**
 * Get a milestone definition by ID.
 */
async function getMilestoneById(milestoneId) {
  return StudyMilestone.findByPk(milestoneId);
}

/**
 * Get a milestone definition by slug.
 */
async function getMilestoneBySlug(slug) {
  return StudyMilestone.findOne({ where: { slug } });
}

/**
 * Get all milestones, optionally filtered.
 */
async function listMilestones({ category, isActive, page = 1, limit = 50 } = {}) {
  const where = {};
  if (category) where.category = category;
  if (isActive !== undefined) where.isActive = isActive;

  const offset = (Math.max(1, page) - 1) * limit;
  const { count, rows } = await StudyMilestone.findAndCountAll({
    where,
    order: [['sortOrder', 'ASC']],
    offset,
    limit,
  });

  return {
    milestones: rows,
    pagination: {
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      limit,
    },
  };
}

/**
 * Update a milestone definition (only metadata fields, not thresholds logic).
 */
async function updateMilestone(milestoneId, updates) {
  const milestone = await StudyMilestone.findByPk(milestoneId);
  if (!milestone) return null;

  const allowed = [
    'name',
    'description',
    'category',
    'metricType',
    'thresholds',
    'rewardXp',
    'rewardBadgeCode',
    'iconEmoji',
    'isActive',
    'sortOrder',
    'metadata',
  ];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      milestone[key] = updates[key];
    }
  }
  await milestone.save();
  return milestone;
}

/**
 * Soft-delete a milestone by deactivating it.
 */
async function deactivateMilestone(milestoneId) {
  const milestone = await StudyMilestone.findByPk(milestoneId);
  if (!milestone) return null;
  milestone.isActive = false;
  await milestone.save();
  return milestone;
}

// ---------------------------------------------------------------------------
// User Progress Queries
// ---------------------------------------------------------------------------

/**
 * Get all milestone progress records for a user, including the milestone
 * definition for each.
 */
async function getUserMilestoneProgress(userId, { page = 1, limit = 50 } = {}) {
  const offset = (Math.max(1, page) - 1) * limit;

  const { count, rows } = await UserMilestone.findAndCountAll({
    where: { userId },
    include: [
      {
        model: StudyMilestone,
        as: 'milestoneRef',
        where: { isActive: true },
        required: true,
      },
    ],
    order: [
      ['isComplete', 'ASC'],
      ['currentTier', 'DESC'],
    ],
    offset,
    limit,
  });

  return {
    progress: rows,
    pagination: {
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      limit,
    },
  };
}

/**
 * Get a single user milestone progress record (with milestone definition).
 */
async function getUserMilestoneById(userId, milestoneId) {
  return UserMilestone.findOne({
    where: { userId, milestoneId },
    include: [
      {
        model: StudyMilestone,
        as: 'milestoneRef',
      },
    ],
  });
}

/**
 * Claim the reward for a completed milestone.
 */
async function claimMilestoneReward(userId, milestoneId) {
  const userMilestone = await UserMilestone.findOne({
    where: { userId, milestoneId },
    include: [
      {
        model: StudyMilestone,
        as: 'milestoneRef',
      },
    ],
  });

  if (!userMilestone) {
    throw new Error('Milestone progress record not found');
  }

  if (!userMilestone.isComplete) {
    throw new Error('Milestone is not yet complete — cannot claim reward');
  }

  if (userMilestone.rewardClaimed) {
    throw new Error('Reward has already been claimed');
  }

  const rewards = await awardMilestoneRewards(
    userId,
    userMilestone.milestoneRef,
    1
  );

  userMilestone.rewardClaimed = true;
  userMilestone.rewardClaimedAt = new Date();
  await userMilestone.save();

  return { userMilestone, rewards };
}

/**
 * Get a summary dashboard for a user's milestone status.
 */
async function getUserMilestoneDashboard(userId) {
  const allMilestones = await StudyMilestone.findAll({
    where: { isActive: true },
    order: [['sortOrder', 'ASC']],
  });

  const userProgress = await UserMilestone.findAll({
    where: { userId },
  });

  const progressMap = {};
  for (const p of userProgress) {
    progressMap[p.milestoneId] = p;
  }

  const summary = {
    totalMilestones: allMilestones.length,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    totalXpEarned: 0,
    tiersAdvancedTotal: 0,
    milestones: [],
  };

  for (const milestone of allMilestones) {
    const progress = progressMap[milestone.id];
    const sorted = [...(milestone.thresholds || [])].sort(
      (a, b) => a.target - b.target
    );
    const totalTiers = sorted.length;

    if (!progress) {
      summary.notStarted++;
      summary.milestones.push({
        milestone,
        progress: null,
        percentComplete: 0,
        currentTierLabel: null,
        nextTierLabel: sorted.length > 0 ? sorted[0].label : null,
        nextTierTarget: sorted.length > 0 ? sorted[0].target : null,
      });
      continue;
    }

    if (progress.isComplete) {
      summary.completed++;
    } else {
      summary.inProgress++;
    }

    summary.tiersAdvancedTotal += progress.currentTier;
    if (progress.rewardClaimed) {
      summary.totalXpEarned += milestone.rewardXp;
    }

    const nextTier =
      progress.currentTier < totalTiers
        ? sorted[progress.currentTier]
        : null;
    const currentTierData =
      progress.currentTier > 0 ? sorted[progress.currentTier - 1] : null;

    summary.milestones.push({
      milestone,
      progress,
      percentComplete:
        totalTiers > 0
          ? Math.round((progress.currentTier / totalTiers) * 100)
          : 0,
      currentTierLabel: currentTierData ? currentTierData.label : null,
      nextTierLabel: nextTier ? nextTier.label : null,
      nextTierTarget: nextTier ? nextTier.target : null,
    });
  }

  return summary;
}

// ---------------------------------------------------------------------------
// Batch Evaluation (for scheduled jobs)
// ---------------------------------------------------------------------------

/**
 * Evaluate milestones for all active users.  Intended to run from a cron
 * job or background worker.
 *
 * @param {Object} options
 * @param {number} options.batchSize  Users per batch
 * @param {number} options.delayMs    Delay between batches to avoid DB pressure
 * @returns {{ evaluated, advanced, completed }}
 */
async function evaluateAllUsers({ batchSize = 100, delayMs = 500 } = {}) {
  const stats = { evaluated: 0, advanced: 0, completed: 0 };
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const users = await User.findAll({
      attributes: ['id'],
      limit: batchSize,
      offset,
      order: [['createdAt', 'ASC']],
    });

    if (users.length === 0) {
      hasMore = false;
      break;
    }

    for (const user of users) {
      try {
        const results = await evaluateAllMilestonesForUser(user.id);
        stats.evaluated++;
        for (const r of results) {
          if (r.tiersAdvanced > 0) {
            stats.advanced++;
            await awardMilestoneRewards(user.id, r.milestone, r.tiersAdvanced);
          }
          if (r.newlyCompleted) {
            stats.completed++;
          }
        }
      } catch (err) {
        // Silently skip individual user errors in batch mode
      }
    }

    offset += batchSize;

    if (delayMs > 0 && users.length === batchSize) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return stats;
}

module.exports = {
  // Core
  evaluateMilestoneForUser,
  evaluateAllMilestonesForUser,
  awardMilestoneRewards,

  // Milestone CRUD
  createMilestone,
  getMilestoneById,
  getMilestoneBySlug,
  listMilestones,
  updateMilestone,
  deactivateMilestone,

  // User Progress
  getUserMilestoneProgress,
  getUserMilestoneById,
  claimMilestoneReward,
  getUserMilestoneDashboard,

  // Batch
  evaluateAllUsers,

  // Expose collectors for testing
  metricCollectors,
};
