 feat/dynamic-rate-limiter-1790
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

const redisService = require('../services/redisService');
const { BattleSession, Quiz } = require('../models');
const logger = require('../utils/logger');

let intervalId = null;

async function findMatches() {
  if (!redisService.isReady || !redisService.client) return;

  try {
    const queue = await redisService.client.zrange('matchmaking:queue', 0, -1, 'WITHSCORES');
    if (!queue || queue.length < 4) return; // Need at least 2 players (each entry is [member, score])

    const players = [];
    for (let i = 0; i < queue.length; i += 2) {
      players.push({
        userId: queue[i],
        elo: Number(queue[i + 1]),
      });
    }

    const now = Date.now();
    // Resolve wait times and allowed brackets
    for (const p of players) {
      const joinTimeStr = await redisService.client.get(`matchmaking:joined:${p.userId}`);
      const joinedTime = joinTimeStr ? Number(joinTimeStr) : now;
      p.waitSec = (now - joinedTime) / 1000;
      // Widen bracket by 50 points for every 5 seconds they wait
      p.allowedDiff = 50 + Math.floor(p.waitSec / 5) * 50;
    }

    // Sort by ELO to match closest players
    players.sort((a, b) => a.elo - b.elo);

    const matchedUserIds = new Set();
    const matchedPairs = [];

    for (let i = 0; i < players.length - 1; i++) {
      const A = players[i];
      const B = players[i + 1];

      if (matchedUserIds.has(A.userId) || matchedUserIds.has(B.userId)) continue;

      const eloDiff = Math.abs(A.elo - B.elo);
      const maxAllowed = Math.max(A.allowedDiff, B.allowedDiff);

      if (eloDiff <= maxAllowed) {
        matchedPairs.push({ player1: A, player2: B });
        matchedUserIds.add(A.userId);
        matchedUserIds.add(B.userId);
        i++; // Skip B on next cycle
      }
    }

    for (const pair of matchedPairs) {
      const { player1, player2 } = pair;

      // Remove from matchmaking queues in Redis
      await redisService.client.zrem('matchmaking:queue', player1.userId, player2.userId);
      await redisService.client.del(`matchmaking:joined:${player1.userId}`);
      await redisService.client.del(`matchmaking:joined:${player2.userId}`);

      // Locate a default quiz to associate
      const quiz = await Quiz.findOne();
      const roomCode = 'RANKED_' + Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create BattleSession
      await BattleSession.create({
        roomCode,
        roomName: 'Ranked Battle Arena',
        hostUserId: player1.userId,
        status: 'waiting',
        questionCount: 5,
        timePerQuestion: 15,
        quiz: quiz ? quiz.id : null,
      });

      logger.info('[MatchmakerDaemon] Match found!', {
        p1: player1.userId,
        p2: player2.userId,
        roomCode,
      });

      // Publish connection details to Pub/Sub channel
      await redisService.client.publish(
        'matchmaking:matched',
        JSON.stringify({
          player1: player1.userId,
          player2: player2.userId,
          roomCode,
        })
      );
    }
  } catch (err) {
    logger.error('[MatchmakerDaemon] Find matches iteration failed:', err.message);
  }
}

function startMatchmakerDaemon() {
  if (intervalId) return;
  logger.info('[MatchmakerDaemon] Matchmaker background daemon starting...');
  intervalId = setInterval(findMatches, 2000);
}

function stopMatchmakerDaemon() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('[MatchmakerDaemon] Matchmaker background daemon stopped.');
  }
}

module.exports = {
  findMatches,
  startMatchmakerDaemon,
  stopMatchmakerDaemon,
 main
};
