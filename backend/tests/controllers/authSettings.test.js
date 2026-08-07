const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authRoutes = require('../../routes/authRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Auth Controller - SM-2 Settings API Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_auth_settings';

    testUser = await User.create({
      name: 'Settings Test User',
      email: 'settings_test@example.com',
      password: 'password123',
      isEmailVerified: true, // Bypass verification constraint
    });

    authToken = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    delete process.env.JWT_SECRET;
    await User.destroy({ where: { id: testUser.id } });
  });

  describe('PUT /api/auth/sm2-settings', () => {
    it('should update SM-2 settings with valid parameters', async () => {
      const res = await request(app)
        .put('/api/auth/sm2-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sm2EasyFactorModifier: 1.5,
          sm2IntervalModifier: 2.0,
          sm2Step1Interval: 3,
          sm2Step2Interval: 12,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.sm2EasyFactorModifier).toBe(1.5);
      expect(res.body.user.sm2IntervalModifier).toBe(2.0);
      expect(res.body.user.sm2Step1Interval).toBe(3);
      expect(res.body.user.sm2Step2Interval).toBe(12);

      // Verify DB storage
      const dbUser = await User.findByPk(testUser.id);
      expect(dbUser.sm2EasyFactorModifier).toBe(1.5);
      expect(dbUser.sm2IntervalModifier).toBe(2.0);
      expect(dbUser.sm2Step1Interval).toBe(3);
      expect(dbUser.sm2Step2Interval).toBe(12);
    });

    it('should return 400 for negative modifier values', async () => {
      const res = await request(app)
        .put('/api/auth/sm2-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sm2EasyFactorModifier: -0.5,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for negative step intervals', async () => {
      const res = await request(app)
        .put('/api/auth/sm2-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sm2Step1Interval: 0,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for non-integer step intervals', async () => {
      const res = await request(app)
        .put('/api/auth/sm2-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sm2Step2Interval: 6.5,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/sm2-settings/reset', () => {
    it('should reset SM-2 settings back to standard defaults', async () => {
      // Setup non-default values first
      const u = await User.findByPk(testUser.id);
      u.sm2EasyFactorModifier = 2.0;
      u.sm2IntervalModifier = 3.0;
      u.sm2Step1Interval = 5;
      u.sm2Step2Interval = 15;
      await u.save();

      const res = await request(app)
        .post('/api/auth/sm2-settings/reset')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.sm2EasyFactorModifier).toBe(1.0);
      expect(res.body.user.sm2IntervalModifier).toBe(1.0);
      expect(res.body.user.sm2Step1Interval).toBe(1);
      expect(res.body.user.sm2Step2Interval).toBe(6);

      // Verify DB storage is reset
      const dbUser = await User.findByPk(testUser.id);
      expect(dbUser.sm2EasyFactorModifier).toBe(1.0);
      expect(dbUser.sm2IntervalModifier).toBe(1.0);
      expect(dbUser.sm2Step1Interval).toBe(1);
      expect(dbUser.sm2Step2Interval).toBe(6);
    });
  });
});
