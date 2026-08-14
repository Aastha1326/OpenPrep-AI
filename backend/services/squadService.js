const crypto = require('crypto');
const { StudySquad, SquadMember, User } = require('../models');
const { Op } = require('sequelize');

function generateInviteCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
}

async function createSquad(userId, name) {
  let inviteCode;
  let isUnique = false;
  
  while (!isUnique) {
    inviteCode = generateInviteCode();
    const existing = await StudySquad.findOne({ where: { inviteCode } });
    if (!existing) {
      isUnique = true;
    }
  }

  const squad = await StudySquad.create({
    name,
    inviteCode,
    adminUserId: userId
  });

  await SquadMember.create({
    squadId: squad.id,
    userId,
    role: 'admin'
  });

  return squad;
}

async function joinSquad(userId, inviteCode) {
  const squad = await StudySquad.findOne({ where: { inviteCode } });
  if (!squad) {
    throw new Error('Invalid invite code');
  }

  const existingMember = await SquadMember.findOne({
    where: { squadId: squad.id, userId }
  });

  if (existingMember) {
    throw new Error('User is already a member of this squad');
  }

  const member = await SquadMember.create({
    squadId: squad.id,
    userId,
    role: 'member'
  });

  return squad;
}

async function leaveSquad(userId, squadId) {
  const member = await SquadMember.findOne({
    where: { squadId, userId }
  });

  if (!member) {
    throw new Error('Not a member of this squad');
  }

  await member.destroy();

  // If the admin left, assign a new admin or delete the squad
  const squad = await StudySquad.findByPk(squadId);
  if (squad && squad.adminUserId === userId) {
    const nextMember = await SquadMember.findOne({ where: { squadId } });
    if (nextMember) {
      squad.adminUserId = nextMember.userId;
      await squad.save();
      nextMember.role = 'admin';
      await nextMember.save();
    } else {
      await squad.destroy();
    }
  }

  return true;
}

module.exports = {
  createSquad,
  joinSquad,
  leaveSquad,
  generateInviteCode
};
