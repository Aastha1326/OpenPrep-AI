const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const flashcardRoutes = require('../../routes/flashcardRoutes');
const errorHandler = require('../../middleware/error');
const { sequelize, User, Exam, Subject, Flashcard } = require('../../models');

const app = express();
app.use(express.json());
app.use('/api/flashcards', flashcardRoutes);
app.use(errorHandler);

describe('POST /api/flashcards/batch-sync', () => {
  let token;
  let cardId;
  let testUser;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_batch_sync';

    testUser = await User.create({
      name: 'Sync Tester',
      email: `sync-${uuidv4()}@openprep.ai`,
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
      name: 'Test Exam',
      user: testUser.id,
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    const subject = await Subject.create({
      name: 'Test Subject',
      exam: exam.id,
      user: testUser.id,
    });
    const card = await Flashcard.create({
      front: 'Q?',
      back: 'A!',
      user: testUser.id,
      subject: subject.id,
      interval: 1,
      repetitions: 0,
      efactor: 2.5,
    });
    cardId = card.id;
  });

  afterAll(async () => {
    await Flashcard.destroy({ where: { user: testUser.id } });
    await testUser.destroy();
    delete process.env.JWT_SECRET;
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/flashcards/batch-sync').send({ reviews: [] });
    expect(res.status).toBe(401);
  });

  it('returns 400 if reviews array is empty', async () => {
    const res = await request(app)
      .post('/api/flashcards/batch-sync')
      .set('Authorization', `Bearer ${token}`)
      .send({ reviews: [] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('syncs a valid review and updates SM-2 fields', async () => {
    const res = await request(app)
      .post('/api/flashcards/batch-sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        reviews: [{ cardId, score: 4, reviewedAt: new Date().toISOString() }],
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.synced).toBe(1);
    expect(res.body.data.skipped).toBe(0);

    const updated = await Flashcard.findByPk(cardId);
    expect(updated.repetitions).toBe(1);
  });

  it('skips reviews for non-existent cards gracefully', async () => {
    const res = await request(app)
      .post('/api/flashcards/batch-sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        reviews: [{ cardId: uuidv4(), score: 3, reviewedAt: new Date().toISOString() }],
      });
    expect(res.status).toBe(200);
    expect(res.body.data.synced).toBe(0);
    expect(res.body.data.skipped).toBe(1);
  });

  it('skips reviews with invalid score', async () => {
    const res = await request(app)
      .post('/api/flashcards/batch-sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        reviews: [{ cardId, score: 99, reviewedAt: new Date().toISOString() }],
      });
    expect(res.status).toBe(200);
    expect(res.body.data.skipped).toBe(1);
    expect(res.body.data.errors.length).toBe(1);
  });
});
