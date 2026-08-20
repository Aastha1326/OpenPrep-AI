const { SquadChallenge, SquadMember } = require('../models');

async function createChallenge(req, res, next) {
  try {
    const { squadId } = req.params;
    const { targetXp, startDate, endDate } = req.body;

    if (!targetXp || !startDate || !endDate) {
      return res.status(400).json({ error: 'targetXp, startDate, and endDate are required' });
    }

    const member = await SquadMember.findOne({ where: { squadId, userId: req.user.id } });
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Only squad admins can create challenges' });
    }

    // Check if an active challenge already exists
    const existingActive = await SquadChallenge.findOne({ where: { squadId, status: 'active' } });
    if (existingActive) {
      return res.status(400).json({ error: 'An active challenge already exists for this squad' });
    }

    const challenge = await SquadChallenge.create({
      squadId,
      targetXp,
      startDate,
      endDate,
      status: 'active'
    });

    res.status(201).json(challenge);
  } catch (err) {
    next(err);
  }
}

async function updateChallenge(req, res, next) {
  try {
    const { squadId, challengeId } = req.params;
    const { targetXp, endDate, status } = req.body;

    const member = await SquadMember.findOne({ where: { squadId, userId: req.user.id } });
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Only squad admins can update challenges' });
    }

    const challenge = await SquadChallenge.findOne({ where: { id: challengeId, squadId } });
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (targetXp) challenge.targetXp = targetXp;
    if (endDate) challenge.endDate = endDate;
    if (status) challenge.status = status;

    await challenge.save();
    res.status(200).json(challenge);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createChallenge,
  updateChallenge
};
