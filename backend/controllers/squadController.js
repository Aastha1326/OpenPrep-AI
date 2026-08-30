const squadService = require('../services/squadService');
const { StudySquad, SquadMember, User, SquadChallenge, SquadAchievement, SquadChallengeContribution } = require('../models');

async function createSquad(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Squad name is required' });
    }
    const squad = await squadService.createSquad(req.user.id, name);
    res.status(201).json(squad);
  } catch (err) {
    next(err);
  }
}

async function joinSquad(req, res, next) {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }
    const squad = await squadService.joinSquad(req.user.id, inviteCode);
    res.status(200).json(squad);
  } catch (err) {
    if (err.message === 'Invalid invite code' || err.message === 'User is already a member of this squad') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

async function leaveSquad(req, res, next) {
  try {
    const { id } = req.params;
    await squadService.leaveSquad(req.user.id, id);
    res.status(200).json({ message: 'Left squad successfully' });
  } catch (err) {
    if (err.message === 'Not a member of this squad') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

async function getSquadDashboard(req, res, next) {
  try {
    const { id } = req.params;
    
    // Check membership
    const member = await SquadMember.findOne({ where: { squadId: id, userId: req.user.id } });
    if (!member) {
      return res.status(403).json({ error: 'Not authorized to view this squad' });
    }

    const squad = await StudySquad.findByPk(id, {
      include: [
        {
          model: SquadMember,
          as: 'SquadMembers',
          include: [{ model: User, as: 'userRef', attributes: ['id', 'name', 'avatar'] }]
        },
        {
          model: SquadChallenge,
          as: 'SquadChallenges',
          where: { status: 'active' },
          required: false,
          include: [{ model: SquadChallengeContribution, as: 'SquadChallengeContributions' }]
        },
        {
          model: SquadAchievement,
          as: 'SquadAchievements'
        }
      ]
    });

    if (!squad) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    res.status(200).json({ squad, currentUserRole: member.role });
  } catch (err) {
    next(err);
  }
}

async function getMySquads(req, res, next) {
  try {
    const memberships = await SquadMember.findAll({
      where: { userId: req.user.id },
      include: [{ model: StudySquad, as: 'squadRef' }]
    });
    const squads = memberships.map(m => m.squadRef);
    res.status(200).json(squads);
  } catch (err) {
    next(err);
  }
}

async function getAudioStatus(req, res, next) {
  try {
    const { id } = req.params;

    // Verify squad membership
    const member = await SquadMember.findOne({ where: { squadId: id, userId: req.user.id } });
    if (!member) {
      return res.status(403).json({ error: 'Not authorized to access this squad' });
    }

    const audioSignalingSocket = require('../services/audioSignalingSocket');
    const participants = audioSignalingSocket.getParticipants(id);

    res.status(200).json({ success: true, participants });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createSquad,
  joinSquad,
  leaveSquad,
  getSquadDashboard,
  getMySquads,
  getAudioStatus,
};
