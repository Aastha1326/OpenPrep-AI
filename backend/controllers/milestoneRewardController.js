/**
 * @fileoverview Express controller for the Study Milestone & Achievement
 * Reward system API endpoints.
 */
const milestoneService = require('../services/milestoneService');
const ActivityLog = require('../models/ActivityLog');

// ---------------------------------------------------------------------------
// Milestone Definition Management (Admin-ish)
// ---------------------------------------------------------------------------

// @desc    Create a new milestone definition
// @route   POST /api/milestones
// @access  Private
exports.createMilestone = async (req, res, next) => {
  try {
    const {
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
    } = req.body;

    if (!name || !metricType || !thresholds) {
      return res.status(400).json({
        success: false,
        error: 'name, metricType, and thresholds are required',
      });
    }

    if (!Array.isArray(thresholds) || thresholds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'thresholds must be a non-empty array of { target, label } objects',
      });
    }

    for (let i = 0; i < thresholds.length; i++) {
      if (thresholds[i].target === undefined || thresholds[i].target === null) {
        return res.status(400).json({
          success: false,
          error: `Threshold ${i + 1} is missing a numeric "target" value`,
        });
      }
    }

    const milestone = await milestoneService.createMilestone({
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
    });

    res.status(201).json({ success: true, data: milestone });
  } catch (error) {
    if (error.message && error.message.includes('already exists')) {
      return res.status(409).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    List all milestones (with optional category filter)
// @route   GET /api/milestones
// @access  Private
exports.listMilestones = async (req, res, next) => {
  try {
    const { category, isActive, page, limit } = req.query;

    const result = await milestoneService.listMilestones({
      category,
      isActive:
        isActive === 'true'
          ? true
          : isActive === 'false'
            ? false
            : undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50,
    });

    res.status(200).json({
      success: true,
      count: result.milestones.length,
      ...result.pagination,
      data: result.milestones,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single milestone by ID
// @route   GET /api/milestones/:id
// @access  Private
exports.getMilestone = async (req, res, next) => {
  try {
    const milestone = await milestoneService.getMilestoneById(req.params.id);
    if (!milestone) {
      return res.status(404).json({ success: false, error: 'Milestone not found' });
    }
    res.status(200).json({ success: true, data: milestone });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single milestone by slug
// @route   GET /api/milestones/slug/:slug
// @access  Private
exports.getMilestoneBySlug = async (req, res, next) => {
  try {
    const milestone = await milestoneService.getMilestoneBySlug(req.params.slug);
    if (!milestone) {
      return res.status(404).json({ success: false, error: 'Milestone not found' });
    }
    res.status(200).json({ success: true, data: milestone });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a milestone definition
// @route   PUT /api/milestones/:id
// @access  Private
exports.updateMilestone = async (req, res, next) => {
  try {
    const milestone = await milestoneService.updateMilestone(
      req.params.id,
      req.body
    );
    if (!milestone) {
      return res.status(404).json({ success: false, error: 'Milestone not found' });
    }
    res.status(200).json({ success: true, data: milestone });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate (soft-delete) a milestone
// @route   DELETE /api/milestones/:id
// @access  Private
exports.deactivateMilestone = async (req, res, next) => {
  try {
    const milestone = await milestoneService.deactivateMilestone(req.params.id);
    if (!milestone) {
      return res.status(404).json({ success: false, error: 'Milestone not found' });
    }
    res.status(200).json({ success: true, data: milestone });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// User Milestone Progress
// ---------------------------------------------------------------------------

// @desc    Get all milestone progress for the current user
// @route   GET /api/milestones/progress
// @access  Private
exports.getUserProgress = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const result = await milestoneService.getUserMilestoneProgress(req.user.id, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50,
    });

    res.status(200).json({
      success: true,
      count: result.progress.length,
      ...result.pagination,
      data: result.progress,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get progress for a specific milestone
// @route   GET /api/milestones/:id/progress
// @access  Private
exports.getUserMilestoneProgressById = async (req, res, next) => {
  try {
    const progress = await milestoneService.getUserMilestoneById(
      req.user.id,
      req.params.id
    );
    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'No progress record found for this milestone',
      });
    }
    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger manual evaluation of all milestones for the current user
// @route   POST /api/milestones/evaluate
// @access  Private
exports.evaluateMilestones = async (req, res, next) => {
  try {
    const results =
      await milestoneService.evaluateAllMilestonesForUser(req.user.id);

    const advanced = results.filter((r) => r.tiersAdvanced > 0);

    // Award rewards for any advances
    const allRewards = [];
    for (const r of advanced) {
      const rewards = await milestoneService.awardMilestoneRewards(
        req.user.id,
        r.milestone,
        r.tiersAdvanced
      );
      allRewards.push(...rewards);
    }

    res.status(200).json({
      success: true,
      data: {
        evaluated: results.length,
        tiersAdvanced: advanced.reduce((sum, r) => sum + r.tiersAdvanced, 0),
        newlyCompleted: results.filter((r) => r.newlyCompleted).length,
        rewards: allRewards,
        details: results.map((r) => ({
          milestoneId: r.milestone?.id,
          name: r.milestone?.name,
          currentValue: r.metricsValue,
          tiersAdvanced: r.tiersAdvanced,
          newlyCompleted: r.newlyCompleted,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Claim the reward for a completed milestone
// @route   POST /api/milestones/:id/claim
// @access  Private
exports.claimReward = async (req, res, next) => {
  try {
    const { userMilestone, rewards } =
      await milestoneService.claimMilestoneReward(req.user.id, req.params.id);

    await ActivityLog.create({
      user: req.user.id,
      activityType: 'milestone_reward_claimed',
      description: `Claimed reward for milestone: "${userMilestone.milestoneRef?.name || 'Unknown'}"`,
    });

    res.status(200).json({
      success: true,
      data: { userMilestone, rewards },
    });
  } catch (error) {
    if (
      error.message &&
      (error.message.includes('not found') ||
        error.message.includes('not yet complete') ||
        error.message.includes('already been claimed'))
    ) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Get the user's milestone dashboard summary
// @route   GET /api/milestones/dashboard
// @access  Private
exports.getDashboard = async (req, res, next) => {
  try {
    const dashboard =
      await milestoneService.getUserMilestoneDashboard(req.user.id);
    res.status(200).json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually evaluate milestones for all users (admin/batch)
// @route   POST /api/milestones/evaluate-all
// @access  Private (should be admin-only in production)
exports.evaluateAll = async (req, res, next) => {
  try {
    const { batchSize, delayMs } = req.body || {};
    const stats = await milestoneService.evaluateAllUsers({
      batchSize: batchSize || 100,
      delayMs: delayMs || 500,
    });
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
