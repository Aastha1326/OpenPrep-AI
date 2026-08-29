 feat/real-time-matchmaker-1794
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

const { joinQueue, leaveQueue, calculateEloChange } = require('../../services/matchmakingService');
const { findMatches } = require('../../workers/matchmakerDaemon');
const redisService = require('../../services/redisService');
const { BattleSession, Quiz } = require('../../models');

vi.mock('../../services/redisService', () => {
  const mockClient = {
    zadd: vi.fn().mockResolvedValue(1),
    zrem: vi.fn().mockResolvedValue(1),
    zrange: vi.fn(),
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn(),
    del: vi.fn().mockResolvedValue(1),
    publish: vi.fn().mockResolvedValue(1),
  };
  return {
    isReady: true,
    client: mockClient,
  };
});

vi.mock('../../models', () => ({
  BattleSession: {
    create: vi.fn().mockResolvedValue({ id: 'battle-session-uuid' }),
  },
  Quiz: {
    findOne: vi.fn().mockResolvedValue({ id: 'quiz-uuid' }),
  },
}));

describe('Gamified Matchmaker & ELO Rank Battle Arena', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('calculateEloChange updates ratings correctly based on outcomes', () => {
    // 1. Equal ratings, player A wins
    const result1 = calculateEloChange(1200, 1200, 1);
    expect(result1.newEloA).toBeGreaterThan(1200);
    expect(result1.newEloB).toBeLessThan(1200);

    // 2. Equal ratings, Draw
    const result2 = calculateEloChange(1200, 1200, 0.5);
    expect(result2.newEloA).toBe(1200);
    expect(result2.newEloB).toBe(1200);
  });

  test('joinQueue registers user in Redis Sorted Set', async () => {
    await joinQueue('user-111', 1300);

    expect(redisService.client.zadd).toHaveBeenCalledWith('matchmaking:queue', 1300, 'user-111');
    expect(redisService.client.set).toHaveBeenCalledWith('matchmaking:joined:user-111', expect.any(Number));
  });

  test('findMatches pairs adjacent players in ELO and widens tolerances', async () => {
    // Mock queue with 2 players close in ELO (1200 and 1220)
    // zrange returns flat array of [user, score]
    redisService.client.zrange.mockResolvedValue(['user-111', '1200', 'user-222', '1220']);

    // Mock join times (joined 1 second ago, allowed diff: 50)
    redisService.client.get.mockImplementation(async (key) => {
      if (key.includes('user-111') || key.includes('user-222')) {
        return String(Date.now() - 1000);
      }
      return null;
    });

    await findMatches();

    // Verify match triggers database session creation and pub/sub notifications
    expect(redisService.client.zrem).toHaveBeenCalledWith('matchmaking:queue', 'user-111', 'user-222');
    expect(BattleSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        hostUserId: 'user-111',
        status: 'waiting',
      })
    );
    expect(redisService.client.publish).toHaveBeenCalledWith(
      'matchmaking:matched',
      expect.stringContaining('user-111')
    );
  });
});
 main
