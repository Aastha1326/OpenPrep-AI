const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const vivaRoutes = require('../../routes/vivaRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Subject = require('../../models/Subject');
const VivaSession = require('../../models/VivaSession');

const app = express();
app.use(express.json());
app.use('/api/viva', vivaRoutes);
app.use(errorHandler);

describe('Viva Controller - Integration Tests', () => {
  let testUser;
  let authToken;
  let testSubject;
  let testSession;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_vivas';

    testUser = await User.create({
      name: 'viva student',
      email: 'student@example.com',
      password: 'StrongPass1!',
    });

    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET);

    testSubject = await Subject.create({
      name: 'Computer Networks',
      user: testUser.id,
      exam: '00000000-0000-0000-0000-000000000000',
    });
  });

  afterAll(async () => {
    if (testSession) await testSession.destroy();
    await testSubject.destroy();
    await testUser.destroy();
  });

  describe('POST /api/viva/start', () => {
    it('initiates the viva session and returns the opening question', async () => {
      const res = await request(app)
        .post('/api/viva/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subjectId: testSubject.id });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBeDefined();
      expect(res.body.data.nextQuestion).toBeDefined();

      testSession = await VivaSession.findByPk(res.body.data.sessionId);
    });
  });

  describe('POST /api/viva/respond', () => {
    it('submits response, logs answer, and returns examiner follow-up', async () => {
      const res = await request(app)
        .post('/api/viva/respond')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: testSession.id,
          studentAnswer: 'IP address is a logical identifier in network layer.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nextQuestion).toBeDefined();
      expect(res.body.data.turns.length).toBe(3);
    });
  });

  describe('POST /api/viva/evaluate', () => {
    it('completes the session and generates final scorecard', async () => {
      const res = await request(app)
        .post('/api/viva/evaluate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sessionId: testSession.id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBeDefined();
      expect(res.body.data.conceptualDepth).toBeDefined();
      expect(res.body.data.feedback).toBeDefined();
    });
  });
});
