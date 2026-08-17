const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const readinessRoutes = require('../../routes/readinessRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Subject = require('../../models/Subject');
const QuizAttempt = require('../../models/QuizAttempt');

const app = express();
app.use(express.json());
app.use('/api/readiness', readinessRoutes);
app.use(errorHandler);

describe('Readiness Controller - Integration Tests', () => {
  let testUser;
  let authToken;
  let testSubject;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_readiness';

    testUser = await User.create({
      name: 'Readiness User',
      email: 'readiness@example.com',
      password: 'StrongPass1!',
    });

    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET);

    testSubject = await Subject.create({
      name: 'Anatomy and Physiology',
      description: 'Anatomy tests',
      user: testUser.id,
      exam: '00000000-0000-0000-0000-000000000000', // Dummy UUID
    });
  });

  afterAll(async () => {
    await testSubject.destroy();
    await testUser.destroy();
  });

  describe('GET /api/readiness/summary', () => {
    it('should return insufficientData flag if user has taken no quizzes', async () => {
      const res = await request(app)
        .get('/api/readiness/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.insufficientData).toBe(true);
    });

    it('should return ERI scores and trajectories after taking a quiz', async () => {
      // Create a dummy quiz attempt
      const attempt = await QuizAttempt.create({
        user: testUser.id,
        quiz: '00000000-0000-0000-0000-000000000000',
        score: 9,
        totalQuestions: 10,
      });

      const res = await request(app)
        .get('/api/readiness/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.insufficientData).toBe(false);
      expect(res.body.data.overallReadiness).toBeDefined();
      expect(res.body.data.trajectory).toBeInstanceOf(Array);

      await attempt.destroy();
    });
  });

  describe('POST /api/readiness/recalculate', () => {
    it('forces fresh ERI computations', async () => {
      const res = await request(app)
        .post('/api/readiness/recalculate')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });
});
