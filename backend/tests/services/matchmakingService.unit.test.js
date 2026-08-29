const assert = require('assert');
const redis = require('../../config/redis');
const { addToQueue, removeFromQueue, QUEUE_KEY } = require('../../services/matchmakingService');

async function testMatchmakingService() {
  console.log('Testing Matchmaking Service queue operations...');

  if (typeof redis._resetInMemoryStore === 'function') {
    redis._resetInMemoryStore();
  }

  // Test 1: Add user to queue
  const success = await addToQueue('user-101', 1250);
  assert.strictEqual(success, true, 'addToQueue should return true');

  let queue = await redis.zRangeWithScores(QUEUE_KEY, 0, -1);
  assert.strictEqual(queue.length, 1, 'Queue length should be 1');
  assert.strictEqual(queue[0].score, 1250, 'Stored score should match ELO');

  const parsed = JSON.parse(queue[0].value);
  assert.strictEqual(parsed.userId, 'user-101');
  assert.strictEqual(typeof parsed.joinTime, 'number');

  // Test 2: Add second user with different ELO
  await addToQueue('user-102', 1400);
  queue = await redis.zRangeWithScores(QUEUE_KEY, 0, -1);
  assert.strictEqual(queue.length, 2, 'Queue length should be 2');
  assert.strictEqual(queue[0].score, 1250, 'First entry should be lowest ELO');
  assert.strictEqual(queue[1].score, 1400, 'Second entry should be higher ELO');

  // Test 3: Remove from queue
  await removeFromQueue(queue[0].value);
  queue = await redis.zRangeWithScores(QUEUE_KEY, 0, -1);
  assert.strictEqual(queue.length, 1, 'Queue length should be 1 after removal');
  assert.strictEqual(JSON.parse(queue[0].value).userId, 'user-102');

  console.log('✅ Matchmaking Service tests passed successfully!');
}

if (require.main === module) {
  testMatchmakingService().catch((err) => {
    console.error('❌ Matchmaking Service tests failed:', err);
    process.exit(1);
  });
}

module.exports = testMatchmakingService;
