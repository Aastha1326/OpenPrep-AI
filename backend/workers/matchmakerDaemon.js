const redis = require('../config/redis');
const { QUEUE_KEY, removeFromQueue } = require('../services/matchmakingService');
const io = require('../config/socket');
const crypto = require('crypto');

const BASE_THRESHOLD = 50;

/**
 * Single execution cycle for the matchmaking worker.
 * Scans the Redis queue sorted by ELO, checks wait time for dynamic tolerance window expansion,
 * pairs eligible players, removes them from the queue, and emits match_found socket notifications.
 */
async function runMatchmakerCycle() {
  const queue = await redis.zRangeWithScores(QUEUE_KEY, 0, -1);
  if (!queue || queue.length < 2) return;

  const handledItems = new Set();

  for (let i = 0; i < queue.length; i++) {
    const playerA = queue[i];
    if (!playerA || handledItems.has(playerA.value)) continue;

    let parsedA;
    try {
      parsedA = typeof playerA.value === 'string' ? JSON.parse(playerA.value) : playerA.value;
    } catch (err) {
      continue;
    }

    const waitTimeSec = Math.max(0, (Date.now() - (parsedA.joinTime || Date.now())) / 1000);
    const dynamicWindow = BASE_THRESHOLD + Math.floor(waitTimeSec / 5) * 50;

    for (let j = i + 1; j < queue.length; j++) {
      const playerB = queue[j];
      if (!playerB || handledItems.has(playerB.value)) continue;

      let parsedB;
      try {
        parsedB = typeof playerB.value === 'string' ? JSON.parse(playerB.value) : playerB.value;
      } catch (err) {
        continue;
      }

      const eloDiff = Math.abs(Number(playerA.score) - Number(playerB.score));

      if (eloDiff <= dynamicWindow) {
        // Remove both from the Redis queue set safely
        await removeFromQueue(playerA.value);
        await removeFromQueue(playerB.value);

        handledItems.add(playerA.value);
        handledItems.add(playerB.value);

        // Generate a cryptographically secure workspace/battle room ID
        const battleRoomId = `battle:${crypto.randomBytes(8).toString('hex')}`;

        // Instruct Socket.io clients to join the newly created room
        if (io && typeof io.to === 'function') {
          io.to(parsedA.userId).emit('match_found', { room: battleRoomId, opponent: parsedB.userId });
          io.to(parsedB.userId).emit('match_found', { room: battleRoomId, opponent: parsedA.userId });
        }

        break; // Match found for Player A, proceed to next unhandled player
      }
    }
  }
}

let daemonInterval = null;

function startDaemon(intervalMs = 2000) {
  if (daemonInterval) return daemonInterval;
  daemonInterval = setInterval(() => {
    runMatchmakerCycle().catch((err) => console.error('Matchmaker daemon error:', err));
  }, intervalMs);
  return daemonInterval;
}

function stopDaemon() {
  if (daemonInterval) {
    clearInterval(daemonInterval);
    daemonInterval = null;
  }
}

// Auto-start daemon loop unless in test mode
if (process.env.NODE_ENV !== 'test') {
  startDaemon();
}

module.exports = {
  runMatchmakerCycle,
  startDaemon,
  stopDaemon,
  BASE_THRESHOLD,
};
