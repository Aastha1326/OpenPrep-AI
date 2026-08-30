const assert = require('assert');
const dynamicRateLimiter = require('../../middleware/dynamicRateLimiter');

async function testDynamicRateLimiter() {
  console.log('Testing Dynamic Rate Limiter & Abuse Mitigation Engine...');

  if (typeof dynamicRateLimiter._resetInMemoryStore === 'function') {
    dynamicRateLimiter._resetInMemoryStore();
  }

  // Mock Request/Response helper
  function createMockReqRes(user = null, ip = '192.168.1.50', cost = 1) {
    const headers = {};
    let statusCode = 200;
    let jsonBody = null;
    let nextCalled = false;

    const req = {
      user,
      ip,
      originalUrl: '/api/v1/test-route',
    };

    const res = {
      setHeader: (name, val) => {
        headers[name] = val;
      },
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (body) => {
        jsonBody = body;
        return res;
      },
    };

    const next = () => {
      nextCalled = true;
    };

    return { req, res, next, getHeaders: () => headers, getStatus: () => statusCode, getBody: () => jsonBody, isNextCalled: () => nextCalled };
  }

  // Test 1: Admin bypass
  {
    const middleware = dynamicRateLimiter({ cost: 10 });
    const { req, res, next, isNextCalled } = createMockReqRes({ id: 'admin-1', role: 'admin' });
    await middleware(req, res, next);
    assert.strictEqual(isNextCalled(), true, 'Admin should bypass rate limiter directly');
  }

  // Test 2: Unauthenticated User Tier (Max 30 tokens)
  {
    dynamicRateLimiter._resetInMemoryStore();
    const middleware = dynamicRateLimiter({ cost: 20 });
    const ctx = createMockReqRes(null, '203.0.113.199');
    await middleware(ctx.req, ctx.res, ctx.next);

    assert.strictEqual(ctx.isNextCalled(), true, 'First 20 token request should be allowed');
    assert.strictEqual(ctx.getHeaders()['X-RateLimit-Limit'], 30, 'Unauthenticated limit should be 30');
    assert.strictEqual(ctx.getHeaders()['X-RateLimit-Remaining'], 10, 'Remaining tokens should be 10');
  }

  // Test 3: Exhaustion & HTTP 429 Status with Retry-After Header
  {
    const middleware = dynamicRateLimiter({ cost: 15 });
    const ctx = createMockReqRes(null, '203.0.113.199'); // Only 10 remaining from previous test
    await middleware(ctx.req, ctx.res, ctx.next);

    assert.strictEqual(ctx.isNextCalled(), false, 'Request exceeding remaining tokens should not call next()');
    assert.strictEqual(ctx.getStatus(), 429, 'Depleted bucket should return 429 status code');
    assert.ok(ctx.getHeaders()['Retry-After'] !== undefined, 'Retry-After header should be present');
    assert.strictEqual(ctx.getBody().error, 'Too Many Requests');
  }

  // Test 4: Contributor Tier (Max 120 tokens)
  {
    dynamicRateLimiter._resetInMemoryStore();
    const middleware = dynamicRateLimiter({ cost: 50 });
    const ctx = createMockReqRes({ id: 'contrib-1', role: 'contributor' });
    await middleware(ctx.req, ctx.res, ctx.next);

    assert.strictEqual(ctx.isNextCalled(), true);
    assert.strictEqual(ctx.getHeaders()['X-RateLimit-Limit'], 120, 'Contributor limit should be 120');
    assert.strictEqual(ctx.getHeaders()['X-RateLimit-Remaining'], 70);
  }

  // Test 5: Abuse mitigation logging (3 violations trigger SecurityAuditLog)
  {
    dynamicRateLimiter._resetInMemoryStore();
    const middleware = dynamicRateLimiter({ cost: 100 }); // Exceeds student max of 60

    for (let i = 1; i <= 3; i++) {
      const ctx = createMockReqRes({ id: 'abuser-user-1', role: 'student' }, '10.0.0.1');
      await middleware(ctx.req, ctx.res, ctx.next);
      assert.strictEqual(ctx.getStatus(), 429, `Attempt ${i} should be rate limited (429)`);
    }
  }

  console.log('✅ Dynamic Rate Limiter unit tests passed successfully!');
}

if (require.main === module) {
  testDynamicRateLimiter().catch((err) => {
    console.error('❌ Dynamic Rate Limiter unit tests failed:', err);
    process.exit(1);
  });
}

module.exports = testDynamicRateLimiter;
