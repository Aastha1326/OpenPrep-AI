const { smartRateLimiter, consumeTokens, localBuckets, localBlacklist, localFailedLogins } = require('../../middleware/smartRateLimiter');
const redisService = require('../../services/redisService');
const auditLogMiddleware = require('../../middleware/auditLogMiddleware');

describe('Smart Rate Limiter Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    vi.restoreAllMocks();
    localBuckets.clear();
    localBlacklist.clear();
    localFailedLogins.clear();

    process.env.ENABLE_RATE_LIMIT_TESTS = 'true'; // force limiter execution in test env

    req = {
      ip: '192.168.1.100',
      headers: { 'user-agent': 'Chrome' },
      socket: { remoteAddress: '192.168.1.100' },
      body: {},
      user: null
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
    };

    next = vi.fn();
  });

  test('consumeTokens deducts tokens correctly and handles replenishments', async () => {
    redisService.isReady = false; // test local map fallback

    // Start with 10 tokens, deduct 3
    const res1 = await consumeTokens('test-key', 3, 10, 1);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(7);

    // Deduct 5 (remains 2)
    const res2 = await consumeTokens('test-key', 5, 10, 1);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(2);

    // Try to deduct 3 (fails, not enough tokens)
    const res3 = await consumeTokens('test-key', 3, 10, 1);
    expect(res3.allowed).toBe(false);
    expect(res3.remaining).toBe(2);
  });

  test('blacklists IP after 5 login failures and returns HTTP 429', async () => {
    redisService.isReady = false;
    vi.spyOn(auditLogMiddleware, 'logSecurityEvent').mockResolvedValue(true);

    const limiter = smartRateLimiter({ cost: 1, maxTokens: 10, eventType: 'user_login' });

    // Mock response send to trigger failed login tracking callback
    const runLimiterAndFail = async () => {
      let nextCalled = false;
      const mockNext = () => { nextCalled = true; };
      
      await limiter(req, res, mockNext);
      
      // Simulate failed login status returned by controller
      res.statusCode = 401;
      res.send({ success: false });
      return nextCalled;
    };

    // Trigger 5 failed login attempts
    for (let i = 0; i < 5; i++) {
      await runLimiterAndFail();
    }

    // Next request should be blacklisted immediately with 429
    await limiter(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('blacklisted')
      })
    );
    expect(next).not.toHaveBeenCalled();
    expect(auditLogMiddleware.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'failed_login_spike', severity: 'CRITICAL' })
    );
  });
});
