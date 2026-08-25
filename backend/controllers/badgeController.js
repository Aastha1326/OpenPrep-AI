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

function getCategoryForBadge(badgeId) {
  if (badgeId.includes('streak') || badgeId.includes('warrior')) return 'streak';
  if (badgeId.includes('quiz') || badgeId.includes('sharpshooter') || badgeId.includes('perfect')) return 'quiz';
  if (badgeId.includes('card') || badgeId.includes('century')) return 'flashcard';
  if (badgeId.includes('study') || badgeId.includes('early') || badgeId.includes('night') || badgeId.includes('marathon')) return 'study';
  return 'achievement';
}
