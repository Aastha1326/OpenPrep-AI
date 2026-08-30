const { Badge, UserBadge, User, QuizAttempt, Flashcard, FocusSession, Note } = require('../models');
const { BADGE_LIST } = require('../config/badges');

// @desc    Get all available badges
// @route   GET /api/badges
// @access  Private
exports.getAllBadges = async (req, res, next) => {
  try {
    const badges = await Badge.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['name', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: badges,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's earned badges and progress
// @route   GET /api/badges/user or GET /user/badges
// @access  Private
exports.getUserBadges = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch user and all active badges
    const user = await User.findByPk(userId);
    const allBadges = await Badge.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['name', 'ASC']],
    });

    const userBadges = await UserBadge.findAll({
      where: { userId },
    });

    const unlockedMap = new Map(userBadges.map((ub) => [ub.badgeCode, ub.unlockedAt]));

    // Gather user metrics for progress calculations
    const streakDays = user?.currentStreak || 0;
    const quizzesCompleted = (await QuizAttempt?.count?.({ where: { user: userId } })) || 0;
    const perfectQuizzes = (await QuizAttempt?.count?.({ where: { user: userId, score: 100 } })) || 0;
    const flashcardsCreated = (await Flashcard?.count?.({ where: { user: userId } })) || 0;
    let flashcardsReviewed = 0;
    if (Flashcard?.sum) {
      flashcardsReviewed = (await Flashcard.sum('timesReviewed', { where: { user: userId } })) || 0;
    }
    let focusMinutes = 0;
    if (FocusSession?.sum) {
      focusMinutes = (await FocusSession.sum('duration', { where: { userId, completed: true } })) || 0;
    }
    const notesCreated = (await Note?.count?.({ where: { user: userId } })) || 0;

    const userMetrics = {
      streak_days: streakDays,
      quizzes_completed: quizzesCompleted,
      perfect_quizzes: perfectQuizzes,
      flashcards_created: flashcardsCreated,
      flashcards_reviewed: flashcardsReviewed,
      focus_minutes: focusMinutes,
      notes_created: notesCreated,
    };

    const formattedBadges = allBadges.map((badge) => {
      const unlockedAt = unlockedMap.get(badge.id) || null;
      const isUnlocked = !!unlockedAt;

      const currentVal = userMetrics[badge.criteriaType] || 0;
      const threshold = badge.criteriaThreshold || 1;
      const progress = isUnlocked ? 100 : Math.min(100, Math.round((currentVal / threshold) * 100));

      return {
        id: badge.id,
        badgeCode: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        svgIcon: badge.svgIcon,
        category: badge.category,
        criteriaType: badge.criteriaType,
        criteriaThreshold: badge.criteriaThreshold,
        unlocked: isUnlocked,
        unlockedAt,
        currentValue: currentVal,
        progress,
        badge: badge.toJSON(),
      };
    });

    res.status(200).json({
      success: true,
      data: formattedBadges,
      earnedCount: unlockedMap.size,
      totalCount: allBadges.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initialize badges in database
// @route   POST /api/badges/initialize
// @access  Admin
exports.initializeBadges = async (req, res, next) => {
  try {
    const initializedBadges = [];

    for (const badgeConfig of BADGE_LIST) {
      const [badge, created] = await Badge.findOrCreate({
        where: { id: badgeConfig.id },
        defaults: {
          id: badgeConfig.id,
          name: badgeConfig.name,
          description: badgeConfig.description,
          icon: badgeConfig.icon,
          svgIcon: badgeConfig.svgIcon || null,
          category: badgeConfig.category || getCategoryForBadge(badgeConfig.id),
          criteriaType: badgeConfig.criteriaType || 'streak_days',
          criteriaThreshold: badgeConfig.criteriaThreshold || 1,
          isActive: true,
        },
      });

      if (!created) {
        await badge.update({
          criteriaType: badgeConfig.criteriaType || badge.criteriaType,
          criteriaThreshold: badgeConfig.criteriaThreshold || badge.criteriaThreshold,
        });
      }

      initializedBadges.push(badge);
    }

    res.status(200).json({
      success: true,
      data: initializedBadges,
      message: 'Badges initialized successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Evaluate milestone achievements and award new badges
// @route   POST /api/badges/evaluate
// @access  Private
exports.evaluateUserBadges = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const leaderboardService = require('../services/leaderboardService');

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const allBadges = await Badge.findAll({ where: { isActive: true } });
    const existingBadges = await UserBadge.findAll({ where: { userId } });
    const existingCodes = new Set(existingBadges.map((b) => b.badgeCode));

    // Gather metrics
    const streakDays = user.currentStreak || 0;
    const quizzesCompleted = (await QuizAttempt?.count?.({ where: { user: userId } })) || 0;
    const perfectQuizzes = (await QuizAttempt?.count?.({ where: { user: userId, score: 100 } })) || 0;
    const flashcardsCreated = (await Flashcard?.count?.({ where: { user: userId } })) || 0;
    const flashcardsReviewed = (await Flashcard?.sum?.('timesReviewed', { where: { user: userId } })) || 0;
    const focusMinutes = (await FocusSession?.sum?.('duration', { where: { userId, completed: true } })) || 0;
    const notesCreated = (await Note?.count?.({ where: { user: userId } })) || 0;

    const metrics = {
      streak_days: streakDays,
      quizzes_completed: quizzesCompleted,
      perfect_quizzes: perfectQuizzes,
      flashcards_created: flashcardsCreated,
      flashcards_reviewed: flashcardsReviewed,
      focus_minutes: focusMinutes,
      notes_created: notesCreated,
      high_interview_score: 88,
      total_points: user.xp || 0,
    };

    const newlyUnlocked = [];

    for (const badge of allBadges) {
      if (existingCodes.has(badge.id)) continue;

      const userVal = metrics[badge.criteriaType] || 0;
      if (userVal >= (badge.criteriaThreshold || 1)) {
        const newUb = await UserBadge.create({
          userId,
          badgeCode: badge.id,
          unlockedAt: new Date(),
        });

        // Award points bonus
        const pointsBonus = badge.pointsValue || 100;
        await user.increment('xp', { by: pointsBonus });

        newlyUnlocked.push({
          badge: badge.toJSON(),
          pointsBonus,
          unlockedAt: newUb.unlockedAt,
        });
      }
    }

    res.status(200).json({
      success: true,
      newlyUnlocked,
      newlyUnlockedCount: newlyUnlocked.length,
      message: newlyUnlocked.length > 0 ? `Unlocked ${newlyUnlocked.length} new badges!` : 'No new badges unlocked.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get global leaderboard rankings
// @route   GET /api/badges/leaderboard or GET /api/leaderboard
// @access  Private
exports.getLeaderboardData = async (req, res, next) => {
  try {
    const leaderboardService = require('../services/leaderboardService');
    const timeframe = req.query.timeframe || 'all';
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const currentUserId = req.user?.id;

    const result = await leaderboardService.getLeaderboard(timeframe, limit, currentUserId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

function getCategoryForBadge(badgeId) {
  if (badgeId.includes('streak') || badgeId.includes('warrior')) return 'streak';
  if (badgeId.includes('quiz') || badgeId.includes('sharpshooter') || badgeId.includes('perfect')) return 'quiz';
  if (badgeId.includes('card') || badgeId.includes('century')) return 'flashcard';
  if (badgeId.includes('interview') || badgeId.includes('ace')) return 'interview';
  if (badgeId.includes('study') || badgeId.includes('early') || badgeId.includes('night') || badgeId.includes('marathon')) return 'study';
  return 'achievement';
}

