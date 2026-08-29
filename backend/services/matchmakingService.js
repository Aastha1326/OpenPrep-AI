const redis = require('../config/redis');

const QUEUE_KEY = 'matchmaking:queue';

/**
 * Adds a user to the Redis sorted matchmaking queue by their ELO rating.
 *
 * @param {string} userId - The unique identifier of the user
 * @param {number} elo - User's ELO rating (defaults to 1200)
 * @returns {Promise<boolean>} Success indicator
 */
async function addToQueue(userId, elo = 1200) {
  const joinTime = Date.now();
  const member = JSON.stringify({ userId, joinTime });

  await redis.zAdd(QUEUE_KEY, { score: Number(elo), value: member });
  return true;
}

/**
 * Removes a player member entry from the Redis sorted matchmaking queue.
 *
 * @param {string|object} memberString - Stringified member payload or member object
 * @returns {Promise<boolean>} Success indicator
 */
async function removeFromQueue(memberString) {
  const targetVal = typeof memberString === 'string' ? memberString : JSON.stringify(memberString);
  await redis.zRem(QUEUE_KEY, targetVal);
  return true;
}

module.exports = { addToQueue, removeFromQueue, QUEUE_KEY };
