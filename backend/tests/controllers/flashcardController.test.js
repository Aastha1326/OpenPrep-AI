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
const geminiService = require('../../services/geminiService');
const app = express();
app.use(express.json());
app.use('/api/flashcards', flashcardRoutes);
app.use(errorHandler);

describe('Flashcard Controller - SM-2 Algorithm Tests', () => {
  let testUser;
  let testSubject;
  let testTopic;
  let authToken;
describe('POST /api/flashcards/from-audio', () => {
  it('should reject requests without an audio file', async () => {
    const res = await request(app)
      .post('/api/flashcards/from-audio')
      .set('Authorization', `Bearer ${authToken}`)
      .field('subjectId', testSubject.id);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject unsupported audio formats', async () => {
    const res = await request(app)
      .post('/api/flashcards/from-audio')
      .set('Authorization', `Bearer ${authToken}`)
      .attach(
        'audio',
        Buffer.from('not an audio file'),
        {
          filename: 'lecture.txt',
          contentType: 'text/plain',
        }
      );

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should expose transcription and generated cards for valid audio', async () => {
    const originalTranscribe = geminiService.transcribeAndSummarizeAudio;
    const originalGenerate = geminiService.generateFlashcards;

    geminiService.transcribeAndSummarizeAudio = async () => ({
      transcription: 'Newton second law states that force equals mass times acceleration.',
    });

    geminiService.generateFlashcards = async () => [
      {
        front: 'What is Newton second law?',
        back: 'Force equals mass multiplied by acceleration.',
      },
    ];

    const res = await request(app)
      .post('/api/flashcards/from-audio')
      .set('Authorization', `Bearer ${authToken}`)
      .field('subjectId', testSubject.id)
      .attach(
        'audio',
        Buffer.from([
          0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ]),
        {
          filename: 'lecture.mp3',
          contentType: 'audio/mpeg',
        }
      );

    geminiService.transcribeAndSummarizeAudio = originalTranscribe;
    geminiService.generateFlashcards = originalGenerate;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.transcription).toContain('Newton second law');
    expect(res.body.data).toHaveLength(1);
  });
});
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

    it('should support pagination (page, limit, totalCount)', async () => {
      for (let i = 1; i <= 25; i++) {
        await Flashcard.create({
          user: testUser.id,
          subject: testSubject.id,
          front: `Front ${i}`,
          back: `Back ${i}`,
        });
      }

      const res = await request(app)
        .get('/api/flashcards')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 2, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(10);
      expect(res.body.total).toBe(25);
      expect(res.body.page).toBe(2);
      expect(res.body.limit).toBe(10);
      expect(res.body.totalPages).toBe(3);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(25);
      expect(res.body.flashcards).toBeDefined();
    });

    it('should filter flashcards by search query', async () => {
      await Flashcard.create({
        user: testUser.id,
        subject: testSubject.id,
        front: 'Photosynthesis question',
        back: 'Plant bio',
      });
      await Flashcard.create({
        user: testUser.id,
        subject: testSubject.id,
        front: 'Mitosis question',
        back: 'Cell division',
      });

      const res = await request(app)
        .get('/api/flashcards')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'photosynthesis' });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].front).toContain('Photosynthesis');
    });

    it('should filter flashcards by topicId', async () => {
      await Flashcard.create({
        user: testUser.id,
        subject: testSubject.id,
        topic: testTopic.id,
        front: 'Q with topic',
        back: 'A with topic',
      });
      await Flashcard.create({
        user: testUser.id,
        subject: testSubject.id,
        front: 'Q without topic',
        back: 'A without topic',
      });

      const res = await request(app)
        .get('/api/flashcards')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ topicId: testTopic.id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].topic.id).toBe(testTopic.id.toString());
    });

    it('should support sorting by sortBy and order', async () => {
      await Flashcard.create({
        user: testUser.id,
        subject: testSubject.id,
        front: 'Apple',
        back: 'Fruit',
        nextReviewDate: new Date(Date.now() + 100000),
      });
      await Flashcard.create({
        user: testUser.id,
        subject: testSubject.id,
        front: 'Zebra',
        back: 'Animal',
        nextReviewDate: new Date(Date.now() - 100000),
      });

      const res = await request(app)
        .get('/api/flashcards')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ sortBy: 'front', order: 'DESC' });

      expect(res.status).toBe(200);
      expect(res.body.data[0].front).toBe('Zebra');
      expect(res.body.data[1].front).toBe('Apple');
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

    it('should respect custom user SM-2 settings during review calculation', async () => {
      // Set custom user settings
      testUser.sm2EasyFactorModifier = 2.0;
      testUser.sm2IntervalModifier = 1.5;
      testUser.sm2Step1Interval = 3;
      testUser.sm2Step2Interval = 10;
      await testUser.save();

      // Test repetition = 0 step 1: interval should be step1Interval = 3
      const res1 = await request(app)
        .put(`/api/flashcards/${card.id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quality: 4 });

      expect(res1.body.data.interval).toBe(3);

      // Reset repetitions to 2 and interval to 6 to test third review
      // 6 days * 2.5 EFactor * 1.5 custom interval modifier = 22.5 => 23 days
      card.repetitions = 2;
      card.interval = 6;
      card.efactor = 2.5;
      await card.save();

      const res2 = await request(app)
        .put(`/api/flashcards/${card.id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quality: 4 });

      expect(res2.body.data.interval).toBe(23);

      // Verify E-Factor change with modifier = 2.0
      // For quality 5, standard change is 0.1
      // Expected E-Factor = 2.5 + (0.1 * 2.0) = 2.7
      card.repetitions = 2;
      card.interval = 6;
      card.efactor = 2.5;
      await card.save();

      const res3 = await request(app)
        .put(`/api/flashcards/${card.id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quality: 5 });

      expect(res3.body.data.efactor).toBeCloseTo(2.7, 2);

      // Reset user settings to defaults for other tests
      testUser.sm2EasyFactorModifier = 1.0;
      testUser.sm2IntervalModifier = 1.0;
      testUser.sm2Step1Interval = 1;
      testUser.sm2Step2Interval = 6;
      await testUser.save();
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

  describe('Community Deck Sharing & Cloning', () => {
    it('should toggle sharing public status and call Gemini AI to review the deck', async () => {
      // Create some cards to make the deck non-empty
      await Flashcard.create({
        user: testUser.id,
        subject: testSubject.id,
        front: 'Trig Question',
        back: 'Trig Answer',
      });

      const res = await request(app)
        .put(`/api/flashcards/decks/${testSubject.id}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isPublic: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isPublic).toBe(true);
      expect(res.body.data.tags).toBeDefined();
      expect(res.body.data.description).toBeDefined();
    });

    it('should retrieve community public decks', async () => {
      const res = await request(app)
        .get('/api/flashcards/community')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should clone a community deck into user's personal library and increment cloneCount", async () => {
      // Create another user to clone from to represent a peer clone
      const otherUser = await User.create({
        name: 'Peer Student',
        email: 'peer@student.com',
        password: 'Password123!',
      });
      const otherExam = await Exam.create({
        name: 'Peer Exam',
        date: new Date(),
        user: otherUser.id,
      });
      const otherSubject = await Subject.create({
        name: 'Physics I',
        description: 'Basic Physics',
        exam: otherExam.id,
        user: otherUser.id,
        isPublic: true,
      });
      await Flashcard.create({
        user: otherUser.id,
        subject: otherSubject.id,
        front: 'F = ma?',
        back: 'Force = mass * acceleration',
      });

      const res = await request(app)
        .post(`/api/flashcards/decks/${otherSubject.id}/clone`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.clonedFromId).toBe(otherSubject.id);

      // Verify the source deck clone count incremented
      await otherSubject.reload();
      expect(otherSubject.cloneCount).toBe(1);
    });
  });
});
