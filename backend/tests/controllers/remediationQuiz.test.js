const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const errorHandler = require('../../middleware/error');
const { protect } = require('../../middleware/auth');
const { generateRemediationQuiz } = require('../../controllers/quizController');
const { validateGenerateRemediationQuiz } = require('../../middleware/validators');
const { aiLimiter } = require('../../middleware/rateLimiter');
const { checkAiQuota } = require('../../middleware/aiQuotaMiddleware');
const { sequelize, User, Exam, Subject, Flashcard } = require('../../models');

// Build a minimal app with only the remediation route
const app = express();
app.use(express.json());
app.post(
  '/api/quizzes/generate-remediation',
  protect,
  validateGenerateRemediationQuiz,
  generateRemediationQuiz
);
app.use(errorHandler);

describe('POST /api/quizzes/generate-remediation', () => {
  let token;
  let testUser;
  let subjectId;
  let cardId1;
  let cardId2;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_remediation';

    testUser = await User.create({
      name: 'Remediation Tester',
      email: `remediation-${uuidv4()}@openprep.ai`,
      password: 'Password123!',
      role: 'student',
      isEmailVerified: true,
    });
    token = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);
  });

  beforeEach(async () => {
    await Flashcard.destroy({ where: { user: testUser.id } });
    await Subject.destroy({ where: { user: testUser.id } });
    await Exam.destroy({ where: { user: testUser.id } });

    const exam = await Exam.create({
      name: 'Remediation Exam',
      user: testUser.id,
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    const subject = await Subject.create({
      name: 'Organic Chemistry',
      exam: exam.id,
      user: testUser.id,
    });
    subjectId = subject.id;

    const [c1, c2] = await Promise.all([
      Flashcard.create({
        front: 'What is an aldehyde?',
        back: 'A compound with CHO group',
        user: testUser.id,
        subject: subjectId,
        interval: 1,
        repetitions: 0,
        efactor: 2.5,
      }),
      Flashcard.create({
        front: 'What is a ketone?',
        back: 'A compound with CO between two carbons',
        user: testUser.id,
        subject: subjectId,
        interval: 1,
        repetitions: 0,
        efactor: 2.5,
      }),
    ]);
    cardId1 = c1.id;
    cardId2 = c2.id;
  });

  afterAll(async () => {
    await Flashcard.destroy({ where: { user: testUser.id } });
    await testUser.destroy();
    delete process.env.JWT_SECRET;
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/quizzes/generate-remediation').send({
      deckId: subjectId,
      failedCardIds: [cardId1, cardId2],
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 if only 1 failedCardId is provided (validator)', async () => {
    const res = await request(app)
      .post('/api/quizzes/generate-remediation')
      .set('Authorization', `Bearer ${token}`)
      .send({ deckId: subjectId, failedCardIds: [cardId1] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 if failedCardIds is missing', async () => {
    const res = await request(app)
      .post('/api/quizzes/generate-remediation')
      .set('Authorization', `Bearer ${token}`)
      .send({ deckId: subjectId });
    expect(res.status).toBe(400);
  });

  it('returns 404 if deckId does not belong to user', async () => {
    const res = await request(app)
      .post('/api/quizzes/generate-remediation')
      .set('Authorization', `Bearer ${token}`)
      .send({ deckId: uuidv4(), failedCardIds: [cardId1, cardId2] });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('generates remediation quiz with correct sourceType when Gemini responds', async () => {
    const res = await request(app)
      .post('/api/quizzes/generate-remediation')
      .set('Authorization', `Bearer ${token}`)
      .send({ deckId: subjectId, failedCardIds: [cardId1, cardId2], count: 5 });

    // Accept 201 or 429 (Gemini quota in CI) or 503 (Gemini server error in CI)
    if (res.status === 429 || res.status === 503) {
      return;
    }

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sourceType).toBe('REMEDIATION');
    expect(res.body.data.linkedDeckId).toBe(subjectId);
    expect(Array.isArray(res.body.data.questions)).toBe(true);
  });
});
