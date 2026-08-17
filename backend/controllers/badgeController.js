const { Badge, UserBadge, User } = require('../models');
const { BADGES, BADGE_LIST } = require('../config/badges');

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

// @desc    Get user's earned badges
// @route   GET /api/badges/user
// @access  Private
exports.getUserBadges = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userBadges = await UserBadge.findAll({
      where: { userId },
      include: [
        {
          model: Badge,
          as: 'badge',
          where: { isActive: true },
          required: true,
        },
      ],
      order: [['unlockedAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: userBadges,
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
      const [badge] = await Badge.findOrCreate({
        where: { id: badgeConfig.id },
        defaults: {
          id: badgeConfig.id,
          name: badgeConfig.name,
          description: badgeConfig.description,
          icon: badgeConfig.icon,
          svgIcon: badgeConfig.svgIcon || null,
          category: getCategoryForBadge(badgeConfig.id),
          isActive: true,
        },
      });

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
