const crypto = require('crypto');
const { StudySquad, SquadMember, SquadChallenge, User } = require('../models');

// @desc    Create a new Study Squad
// @route   POST /api/squads
// @access  Private
exports.createSquad = async (req, res, next) => {
  try {
    const { name, description, isPublic } = req.body;
    
    const joinCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const squad = await StudySquad.create({
      name,
      description,
      joinCode,
      ownerId: req.user.id,
      isPublic: isPublic !== false,
    });

    // Add creator as admin member
    await SquadMember.create({
      squadId: squad.id,
      userId: req.user.id,
      role: 'admin',
    });

    res.status(201).json({ success: true, data: squad });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, error: 'Squad name already exists' });
    }
    next(error);
  }
};

// @desc    Get user's squads
// @route   GET /api/squads
// @access  Private
exports.getSquads = async (req, res, next) => {
  try {
    const memberships = await SquadMember.findAll({
      where: { userId: req.user.id },
      include: [{ model: StudySquad }]
    });
    
    const squads = memberships.map(m => m.StudySquad);
    res.status(200).json({ success: true, data: squads });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a squad by join code
// @route   POST /api/squads/join
// @access  Private
exports.joinSquad = async (req, res, next) => {
  try {
    const { joinCode } = req.body;

    const squad = await StudySquad.findOne({ where: { joinCode: joinCode.toUpperCase() } });
    if (!squad) {
      return res.status(404).json({ success: false, error: 'Invalid join code or squad not found' });
    }

    const existingMember = await SquadMember.findOne({
      where: { squadId: squad.id, userId: req.user.id }
    });

    if (existingMember) {
      return res.status(400).json({ success: false, error: 'You are already in this squad' });
    }

    await SquadMember.create({
      squadId: squad.id,
      userId: req.user.id,
      role: 'member'
    });

    res.status(200).json({ success: true, data: squad });
  } catch (error) {
    next(error);
  }
};

// @desc    Get squad details and leaderboard
// @route   GET /api/squads/:id
// @access  Private
exports.getSquadDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify user is in squad
    const membership = await SquadMember.findOne({
      where: { squadId: id, userId: req.user.id }
    });

    if (!membership) {
      return res.status(403).json({ success: false, error: 'You do not have access to this squad' });
    }

    const squad = await StudySquad.findByPk(id, {
      include: [
        {
          model: SquadMember,
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar'] }]
        },
        { model: SquadChallenge }
      ]
    });

    res.status(200).json({ success: true, data: squad });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a squad challenge
// @route   POST /api/squads/:id/challenges
// @access  Private (Admin only)
exports.createChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, targetGoal, deadline, rewardPoints } = req.body;

    const membership = await SquadMember.findOne({
      where: { squadId: id, userId: req.user.id, role: 'admin' }
    });

    if (!membership) {
      return res.status(403).json({ success: false, error: 'Only squad admins can create challenges' });
    }

    const challenge = await SquadChallenge.create({
      squadId: id,
      title,
      description,
      targetGoal,
      deadline,
      rewardPoints: rewardPoints || 100
    });

    res.status(201).json({ success: true, data: challenge });
  } catch (error) {
    next(error);
  }
};
