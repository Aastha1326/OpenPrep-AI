const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const flashcardRoutes = require('../../routes/flashcardRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Exam = require('../../models/Exam');
const Subject = require('../../models/Subject');
const Topic = require('../../models/Topic');
const Flashcard = require('../../models/Flashcard');

const app = express();
app.use(express.json());
app.use('/api/flashcards', flashcardRoutes);
app.use(errorHandler);

describe('Flashcard Controller - SM-2 Algorithm Tests', () => {
  let testUser;
  let testSubject;
  let testTopic;
  let authToken;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_flashcards';

    testUser = await User.create({
      name: 'Flashcard User',
      email: 'flashcard@example.com',
      password: 'password123',
    });

    authToken = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);

    const testExam = await Exam.create({
      name: 'Flashcard Exam',
      description: 'Exam for flashcard tests',
      date: new Date(),
      user: testUser.id,
    });

    testSubject = await Subject.create({
      name: 'Test Subject',
      description: 'Subject for flashcards',
      exam: testExam.id,
      user: testUser.id,
    });

    testTopic = await Topic.create({
      name: 'Test Topic',
      description: 'Topic for flashcards',
      subject: testSubject.id,
      user: testUser.id,
    });
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  describe('POST /api/flashcards (manual creation)', () => {
    it('should create a manual flashcard', async () => {
      const res = await request(app)
        .post('/api/flashcards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subjectId: testSubject.id,
          topicId: testTopic.id,
          front: 'What is the capital of France?',
          back: 'Paris',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.front).toBe('What is the capital of France?');
      expect(res.body.data.back).toBe('Paris');
      expect(res.body.data.interval).toBe(1);
      expect(res.body.data.repetitions).toBe(0);
      expect(res.body.data.efactor).toBe(2.5);
    });

    it('should create a flashcard without a topic', async () => {
      const res = await request(app)
        .post('/api/flashcards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subjectId: testSubject.id,
          front: 'Question without topic?',
          back: 'Answer without topic',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.topic).toBeNull();
    });
  });

  describe('GET /api/flashcards', () => {
    beforeEach(async () => {
      await Flashcard.destroy({ where: {} });
    });

    it('should return empty list when no flashcards exist', async () => {
      const res = await request(app)
        .get('/api/flashcards')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
    });

    it('should return flashcards filtered by subject', async () => {
      await Flashcard.create({
        user: testUser.id,
        subject: testSubject.id,
        front: 'Q1',
        back: 'A1',
      });

      const res = await request(app)
        .get('/api/flashcards')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ subjectId: testSubject.id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });
  });

  describe('PUT /api/flashcards/:id/review (SM-2 Algorithm)', () => {
    let card;

    beforeEach(async () => {
      card = await Flashcard.create({
        user: testUser.id,
        subject: testSubject.id,
        topic: testTopic.id,
        front: 'SM-2 Test Question?',
        back: 'SM-2 Test Answer',
      });
    });

    it('should return 400 for invalid quality score (< 0)', async () => {
      const res = await request(app)
        .put(`/api/flashcards/${card.id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quality: -1 });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid quality score (> 5)', async () => {
      const res = await request(app)
        .put(`/api/flashcards/${card.id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quality: 6 });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing quality score', async () => {
      const res = await request(app)
        .put(`/api/flashcards/${card.id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should set interval=1 and repetitions=0 for failed review (quality < 3)', async () => {
      const res = await request(app)
        .put(`/api/flashcards/${card.id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quality: 1 });

      expect(res.body.data.repetitions).toBe(0);
      expect(res.body.data.interval).toBe(1);
    });

    it('should increment repetitions and set interval=1 on first pass (quality >= 3, reps=0)', async () => {
      const res = await request(app)
        .put(`/api/flashcards/${card.id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quality: 4 });

      expect(res.body.data.repetitions).toBe(1);
      expect(res.body.data.interval).toBe(1);
    });

    it('should set interval=6 on second successful review (quality >= 3, reps=1)', async () => {
      // First review
      card.repetitions = 1;
      card.interval = 1;
      await card.save();

      const res = await request(app)
        .put(`/api/flashcards/${card.id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quality: 4 });

      expect(res.body.data.repetitions).toBe(2);
      expect(res.body.data.interval).toBe(6);
    });

    it('should multiply interval by efactor on third+ successful review', async () => {
      // Simulate card with existing repetitions and interval
      card.repetitions = 2;
      card.interval = 6;
      card.efactor = 2.5;
      await card.save();

      const res = await request(app)
        .put(`/api/flashcards/${card.id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quality: 4 });

      expect(res.body.data.repetitions).toBe(3);
      expect(res.body.data.interval).toBe(15); // 6 * 2.5 = 15
    });

    it('should not let efactor drop below 1.3', async () => {
      const res = await request(app)
        .put(`/api/flashcards/${card.id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quality: 0 });

      expect(res.body.data.efactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should set nextReviewDate in the future for successful review', async () => {
      const before = Date.now();

      const res = await request(app)
        .put(`/api/flashcards/${card.id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quality: 5 });

      const nextDate = new Date(res.body.data.nextReviewDate).getTime();
      expect(nextDate).toBeGreaterThan(before);
    });
  });

  describe('DELETE /api/flashcards/:id', () => {
    it('should delete an existing flashcard', async () => {
      const c = await Flashcard.create({
        user: testUser.id,
        subject: testSubject.id,
        front: 'Delete me?',
        back: 'Deleted',
      });

      const res = await request(app)
        .delete(`/api/flashcards/${c.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent flashcard', async () => {
      const fakeId = uuidv4();
      const res = await request(app)
        .delete(`/api/flashcards/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Custom User SM-2 Parameters', () => {
    let customCard;

    beforeEach(async () => {
      // Set custom SM-2 parameters on test user
      testUser.sm2EasyFactorModifier = 1.5;
      testUser.sm2IntervalModifier = 2.0;
      testUser.sm2Step1Interval = 3;
      testUser.sm2Step2Interval = 8;
      await testUser.save();

      customCard = await Flashcard.create({
        user: testUser.id,
        subject: testSubject.id,
        topic: testTopic.id,
        front: 'Custom SM-2 Question?',
        back: 'Custom SM-2 Answer',
        interval: 1,
        repetitions: 0,
        efactor: 2.5,
      });
    });

    afterEach(async () => {
      // Reset user to default values
      testUser.sm2EasyFactorModifier = 1.0;
      testUser.sm2IntervalModifier = 1.0;
      testUser.sm2Step1Interval = 1;
      testUser.sm2Step2Interval = 6;
      await testUser.save();
    });

    it('should use custom step1Interval on first pass', async () => {
      const res = await request(app)
        .put(`/api/flashcards/${customCard.id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quality: 4 });

      expect(res.body.data.repetitions).toBe(1);
      expect(res.body.data.interval).toBe(3); // sm2Step1Interval = 3
    });

    it('should use custom step2Interval on second successful review', async () => {
      customCard.repetitions = 1;
      customCard.interval = 1;
      await customCard.save();

      const res = await request(app)
        .put(`/api/flashcards/${customCard.id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quality: 4 });

      expect(res.body.data.repetitions).toBe(2);
      expect(res.body.data.interval).toBe(8); // sm2Step2Interval = 8
    });

    it('should scale third+ intervals using custom sm2IntervalModifier', async () => {
      customCard.repetitions = 2;
      customCard.interval = 6;
      customCard.efactor = 2.5;
      await customCard.save();

      const res = await request(app)
        .put(`/api/flashcards/${customCard.id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quality: 4 });

      expect(res.body.data.repetitions).toBe(3);
      // Math.round(6 * 2.5 * 2.0) = 30
      expect(res.body.data.interval).toBe(30);
    });

    it('should adjust E-Factor using custom sm2EasyFactorModifier', async () => {
      const res = await request(app)
        .put(`/api/flashcards/${customCard.id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quality: 5 });

      // Standard deltaEF for quality=5 is 0.1
      // With modifier 1.5, change is 0.1 * 1.5 = 0.15
      // 2.5 + 0.15 = 2.65
      expect(res.body.data.efactor).toBeCloseTo(2.65, 2);
    });
  });
});
