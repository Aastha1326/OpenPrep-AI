const User = require('../models/User');

function calculateLevel(xp) {
  // L = Math.floor(xp / 1000) + 1
  const level = Math.floor(xp / 1000) + 1;
  return Math.min(50, Math.max(1, level));
}

function getNextLevelXP(level) {
  if (level >= 50) return 50000;
  return level * 1000;
}

async function addXP(userRecord, amount) {
  const userId = userRecord.id;
  const user = await User.findByPk(userId);
  if (!user) return { leveledUp: false };

  const previousLevel = user.level || 1;
  const currentXP = (user.xp || 0) + amount;
  user.xp = currentXP;

  const currentLevel = calculateLevel(currentXP);
  let leveledUp = false;
  if (currentLevel > previousLevel) {
    user.level = currentLevel;
    user.skillPoints = (user.skillPoints || 0) + (currentLevel - previousLevel);
    leveledUp = true;
  }

  await user.save();
  return {
    xp: user.xp,
    level: user.level,
    skillPoints: user.skillPoints,
    leveledUp,
    nextLevelXP: getNextLevelXP(user.level),
  };
}

module.exports = {
  calculateLevel,
  getNextLevelXP,
  addXP,
};
