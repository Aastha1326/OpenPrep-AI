const { SquadActivity, SquadActivityReaction, SquadMember, User } = require('../models');

async function logSquadActivity(userId, type, description, metadata = {}) {
  // Find all squads the user is a member of
  const memberships = await SquadMember.findAll({ where: { userId } });
  
  for (const member of memberships) {
    await SquadActivity.create({
      squadId: member.squadId,
      userId,
      activityType: type,
      description,
      metadata
    });

    if (global.io) {
      global.io.to(`squad:${member.squadId}`).emit('squad:new_activity', {
        squadId: member.squadId,
        userId,
        type,
        description
      });
    }
  }
}

async function getActivityFeed(squadId, requestingUserId, limit = 50, offset = 0) {
  const activities = await SquadActivity.findAll({
    where: { squadId },
    order: [['timestamp', 'DESC']],
    limit,
    offset,
    include: [
      {
        model: User,
        as: 'userRef',
        attributes: ['id', 'name', 'avatar']
      },
      {
        model: SquadActivityReaction,
        as: 'SquadActivityReactions',
        include: [{ model: User, as: 'userRef', attributes: ['name'] }]
      }
    ]
  });

  return activities;
}

const SUPPORTED_EMOJIS = ['🔥', '👏', '🎉', '💪', '❤️'];

async function reactToActivity(activityId, userId, emoji) {
  if (!SUPPORTED_EMOJIS.includes(emoji)) {
    throw new Error('Unsupported reaction emoji');
  }

  const activity = await SquadActivity.findByPk(activityId);
  if (!activity) {
    throw new Error('Activity not found');
  }

  // Find or create reaction
  const [reaction, created] = await SquadActivityReaction.findOrCreate({
    where: { activityId, userId, emoji }
  });

  if (!created) {
    // Toggle reaction off
    await reaction.destroy();
    return { action: 'removed', emoji };
  }

  return { action: 'added', emoji };
}

module.exports = { logSquadActivity, getActivityFeed, reactToActivity };
