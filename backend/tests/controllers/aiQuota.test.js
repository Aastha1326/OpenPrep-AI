const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { checkAiQuota } = require('../../middleware/aiQuotaMiddleware');
const errorHandler = require('../../middleware/error');

const app = express();
app.use(express.json());

// Mock endpoint that applies the quota check middleware
app.post('/api/ai/test-quota', (req, res, next) => {
  // Inject mock user to req object
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (e) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
  }
  next();
}, checkAiQuota, (req, res) => {
  res.status(200).json({ success: true, message: 'Quota allowed' });
});

app.use(errorHandler);

describe('AI Quota Middleware & Controls', () => {
  let testUser;
  let authToken;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_quota';
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
    
    testUser = await User.create({
      name: 'Quota Student',
      email: 'quotastudent@example.com',
      password: 'password123',
      role: 'student',
      dailyAiUsageCount: 0,
      lastAiUsageReset: new Date()
    });

    authToken = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);
  });

  it('should allow requests within quota limit and increment usage count on success', async () => {
    // Set x-test-rate-limit to bypass the test bypass flag in middleware
    const res = await request(app)
      .post('/api/ai/test-quota')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-rate-limit', 'true')
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['x-ratelimit-limit']).toBe('15'); // Student limit
    expect(res.headers['x-ratelimit-remaining']).toBe('14');
  });

  it('should block requests when quota is fully exhausted', async () => {
    const user = await User.findByPk(testUser.id);
    user.dailyAiUsageCount = 15; // Set to standard student limit
    await user.save();

    const res = await request(app)
      .post('/api/ai/test-quota')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-rate-limit', 'true')
      .send();

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('AI daily usage quota exceeded');
    expect(res.body.remainingQuota).toBe(0);
    expect(res.body.retryInSeconds).toBeDefined();
    expect(res.headers['retry-after']).toBeDefined();
  });

  it('should reset usage count if last reset timestamp is yesterday', async () => {
    const user = await User.findByPk(testUser.id);
    user.dailyAiUsageCount = 15;
    // Set lastReset to 24 hours ago
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    user.lastAiUsageReset = yesterday;
    await user.save();

    const res = await request(app)
      .post('/api/ai/test-quota')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-rate-limit', 'true')
      .send();

    // Check it rollovers and resets the quota
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    const updatedUser = await User.findByPk(testUser.id);
    // Count should roll back because of the reset
    expect(updatedUser.dailyAiUsageCount).toBe(0); 
  });
});
