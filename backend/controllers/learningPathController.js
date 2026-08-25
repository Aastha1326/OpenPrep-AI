const { LearningPath, User } = require('../models');
const learningAnalytics = require('../services/learningAnalytics');

// @desc    Get user's current adaptive learning path (generates default if none exists)
// @route   GET /api/learning-path or GET /user/learning-path
// @access  Private
exports.getCurrentPath = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let path = await LearningPath.findOne({
      where: { userId, status: 'active' },
      order: [['createdAt', 'DESC']],
    });

    if (!path) {
      path = await learningAnalytics.generatePath(userId, 'General Mastery & Exam Prep');
    }

    res.status(200).json({
      success: true,
      data: path,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerate adaptive learning path based on latest quiz results and goal
// @route   POST /api/learning-path/generate
// @access  Private
exports.generateNewPath = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { goal = 'General Mastery & Exam Prep' } = req.body;

    // Archive previous active paths
    await LearningPath.update(
      { status: 'archived' },
      { where: { userId, status: 'active' } }
    );

    const newPath = await learningAnalytics.generatePath(userId, goal);

    res.status(201).json({
      success: true,
      data: newPath,
      message: 'Adaptive learning path generated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update path item status (pending, in_progress, completed, skipped)
// @route   PATCH /api/learning-path/item/:itemId
// @access  Private
exports.updatePathItemStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'in_progress', 'completed', 'skipped'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const path = await LearningPath.findOne({
      where: { userId, status: 'active' },
      order: [['createdAt', 'DESC']],
    });

    if (!path) {
      return res.status(404).json({ success: false, error: 'Active learning path not found.' });
    }

    let itemFound = false;
    const updatedItems = (path.pathItems || []).map((item) => {
      if (item.itemId === itemId) {
        itemFound = true;
        return { ...item, status };
      }
      return item;
    });

    if (!itemFound) {
      return res.status(404).json({ success: false, error: 'Path item not found.' });
    }

    const completedCount = updatedItems.filter(
      (item) => item.status === 'completed' || item.status === 'skipped'
    ).length;
    const overallProgress = updatedItems.length > 0 ? Math.round((completedCount / updatedItems.length) * 100) : 0;

    path.pathItems = updatedItems;
    path.overallProgress = overallProgress;
    if (overallProgress === 100) {
      path.status = 'completed';
    }

    await path.save();

    res.status(200).json({
      success: true,
      data: path,
    });
  } catch (error) {
    next(error);
  }
};
