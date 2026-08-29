const assert = require('assert');
const redis = require('../../config/redis');
const { addToQueue, QUEUE_KEY } = require('../../services/matchmakingService');
const { runMatchmakerCycle, BASE_THRESHOLD } = require('../../workers/matchmakerDaemon');
const socketProxy = require('../../config/socket');

async function testMatchmakerDaemon() {
  console.log('Testing Matchmaker Daemon pairing bounds & Socket emissions...');

  if (typeof redis._resetInMemoryStore === 'function') {
    redis._resetInMemoryStore();
  }

  const emittedEvents = [];
  const mockIo = {
    to: (roomId) => ({
      emit: (event, data) => {
        emittedEvents.push({ target: roomId, event, data });
      },
    }),
  };
  socketProxy.setIO(mockIo);

  // Scenario 1: Players with ELO diff > 50 (new joiners, waitTime = 0) => Should NOT match
  await addToQueue('user-A', 1200);
  await addToQueue('user-B', 1300); // Diff 100 > BASE_THRESHOLD 50

  await runMatchmakerCycle();

  let queue = await redis.zRangeWithScores(QUEUE_KEY, 0, -1);
  assert.strictEqual(queue.length, 2, 'Players with ELO diff > threshold should remain in queue');
  assert.strictEqual(emittedEvents.length, 0, 'No match events should be emitted');

  // Scenario 2: Dynamic expansion when wait time increases (5 seconds wait time => threshold expands to 100)
  // Modify joinTime for user-A to 6 seconds ago
  const now = Date.now();
  const playerAEntry = queue.find((item) => JSON.parse(item.value).userId === 'user-A');
  await redis.zRem(QUEUE_KEY, playerAEntry.value);
  await redis.zAdd(QUEUE_KEY, {
    score: 1200,
    value: JSON.stringify({ userId: 'user-A', joinTime: now - 6000 }),
  });

  await runMatchmakerCycle();

  queue = await redis.zRangeWithScores(QUEUE_KEY, 0, -1);
  assert.strictEqual(queue.length, 0, 'Both matched players should be removed from queue');

  assert.strictEqual(emittedEvents.length, 2, 'Should emit 2 match_found events');
  assert.strictEqual(emittedEvents[0].event, 'match_found');
  assert.strictEqual(emittedEvents[1].event, 'match_found');

  assert.strictEqual(emittedEvents[0].target, 'user-A');
  assert.strictEqual(emittedEvents[0].data.opponent, 'user-B');
  assert.ok(emittedEvents[0].data.room.startsWith('battle:'));

  assert.strictEqual(emittedEvents[1].target, 'user-B');
  assert.strictEqual(emittedEvents[1].data.opponent, 'user-A');
  assert.strictEqual(emittedEvents[1].data.room, emittedEvents[0].data.room);

  console.log('✅ Matchmaker Daemon tests passed successfully!');
}

if (require.main === module) {
  testMatchmakerDaemon().catch((err) => {
    console.error('❌ Matchmaker Daemon tests failed:', err);
    process.exit(1);
  });
}

module.exports = testMatchmakerDaemon;
