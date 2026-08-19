const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const quizRoutes = require('../../routes/quizRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Exam = require('../../models/Exam');
const Subject = require('../../models/Subject');
const Topic = require('../../models/Topic');
const Quiz = require('../../models/Quiz');
const QuizAttempt = require('../../models/QuizAttempt');

const app = express();
app.use(express.json());
app.use('/api/quizzes', quizRoutes);
app.use(errorHandler);

describe('Quiz Controller - Integration Tests', () => {
  let testUser;
  let testUser2;
  let testSubject;
  let testTopic;
  let authToken;
  let otherAuthToken;
  let testQuiz;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_quiz';

    testUser = await User.create({
      name: 'Quiz User',
      email: 'quiz@example.com',
      password: 'password123',
    });

    testUser2 = await User.create({
      name: 'Other User',
      email: 'other@example.com',
      password: 'password123',
    });

    authToken = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);
    otherAuthToken = jwt.sign({ id: testUser2.id, type: 'access' }, process.env.JWT_SECRET);

    const examForSubject = await Exam.create({
      name: 'Quiz Test Exam',
      description: 'Exam for quiz subject',
      date: new Date(),
      user: testUser.id,
    });

    testSubject = await Subject.create({
      name: 'Test Subject',
      description: 'A subject for testing',
      exam: examForSubject.id,
      user: testUser.id,
    });

    testTopic = await Topic.create({
      name: 'Test Topic',
      description: 'A topic for testing',
      subject: testSubject.id,
      user: testUser.id,
    });

    const question1Id = uuidv4();
    const question2Id = uuidv4();

    testQuiz = await Quiz.create({
      title: 'Test Quiz',
      subject: testSubject.id,
      topic: testTopic.id,
      questions: [
        {
          _id: question1Id,
          questionText: 'What is 2+2?',
          options: ['1', '2', '3', '4'],
          correctAnswer: 3,
          explanation: '2+2 equals 4',
        },
        {
          _id: question2Id,
          questionText: 'What is the capital of France?',
          options: ['London', 'Paris', 'Berlin', 'Madrid'],
          correctAnswer: 1,
          explanation: 'Paris is the capital of France',
        },
      ],
      type: 'AI_Generated',
      createdBy: testUser.id,
    });
  });

  afterAll(async () => {
    delete process.env.JWT_SECRET;
  });

  describe('GET /api/quizzes', () => {
    it('should return quizzes belonging to the authenticated user (scoped query)', async () => {
      const res = await request(app)
        .get('/api/quizzes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].title).toBe('Test Quiz');
    });

    it('should not return quizzes owned by other users (IDOR protection)', async () => {
      const res = await request(app)
        .get('/api/quizzes')
        .set('Authorization', `Bearer ${otherAuthToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/quizzes/attempts/history', () => {
    it('should return empty array when no attempts exist', async () => {
      const res = await request(app)
        .get('/api/quizzes/attempts/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/quizzes/:id', () => {
    it('should return 404 for non-existent quiz', async () => {
      const fakeId = uuidv4();
      const res = await request(app)
        .get(`/api/quizzes/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Quiz not found');
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = await request(app)
        .get('/api/quizzes/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid request');
    });

    it("should return 404 when another user tries to view someone else's quiz (IDOR protection)", async () => {
      const res = await request(app)
        .get(`/api/quizzes/${testQuiz.id}`)
        .set('Authorization', `Bearer ${otherAuthToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Quiz not found');
    });

    it('should return quiz for the owner', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${testQuiz.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id || res.body.data._id).toBe(testQuiz.id.toString());
      expect(res.body.data.title).toBe('Test Quiz');
    });
  });

  describe('POST /api/quizzes/:id/submit — IDOR Protection', () => {
    it("should return 404 when another user tries to submit on someone else's quiz (IDOR protection)", async () => {
      const validAnswers = (testQuiz.questions || []).map((q) => ({
        questionId: String(q._id || q.id || q.questionId),
        selectedAnswer: 0,
      }));

      const res = await request(app)
        .post(`/api/quizzes/${testQuiz.id}/submit`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .send({ answers: validAnswers, timeSpent: 60 });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Quiz not found');
    });

    it('should allow quiz owner to submit an attempt', async () => {
      const realAnswers = (testQuiz.questions || []).map((q, idx) => ({
        questionId: String(q.id || q._id || q.questionId || `00000000-0000-0000-0000-00000000000${idx + 1}`),
        selectedAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
      }));

      const res = await request(app)
        .post(`/api/quizzes/${testQuiz.id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answers: realAnswers, timeSpent: 120 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('score');
      expect(res.body.data.score).toBe(100);
      expect(res.body.data.user).toBe(testUser.id.toString());
    });

    it('should correctly grade quiz questions where correctAnswer is stored as an array', async () => {
      const arrayQuiz = await Quiz.create({
        title: 'Array CorrectAnswer Quiz',
        subject: testSubject.id,
        topic: testTopic.id,
        questions: [
          {
            _id: uuidv4(),
            questionText: 'Which option is correct?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: [0, 2],
            explanation: 'Both A and C are accepted',
          },
        ],
        type: 'AI_Generated',
        createdBy: testUser.id,
      });

      const ans = [
        {
          questionId: String(arrayQuiz.questions[0]._id),
          selectedAnswer: 2, // 2 is in [0, 2]
        },
      ];

      const res = await request(app)
        .post(`/api/quizzes/${arrayQuiz.id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answers: ans, timeSpent: 15 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(100);
      expect(res.body.data.answers[0].isCorrect).toBe(true);
    });

    it('should return the existing attempt when the same quiz is resubmitted within the 5-second window (double-click prevention)', async () => {
      const realAnswers = (testQuiz.questions || []).map((q, idx) => ({
        questionId: String(q.id || q._id || q.questionId || `00000000-0000-0000-0000-00000000000${idx + 1}`),
        selectedAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
      }));

      // First submission creates the attempt
      const firstRes = await request(app)
        .post(`/api/quizzes/${testQuiz.id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answers: realAnswers, timeSpent: 30 });
      expect(firstRes.status).toBe(201);

      // Immediate second submission must NOT create a duplicate
      const secondRes = await request(app)
        .post(`/api/quizzes/${testQuiz.id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answers: realAnswers, timeSpent: 30 });

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.success).toBe(true);
      expect(secondRes.body.duplicate).toBe(true);
      expect(secondRes.body.data.id).toBe(firstRes.body.data.id);

      const attemptCount = await QuizAttempt.count({
        where: { user: testUser.id, quiz: testQuiz.id },
      });
      expect(attemptCount).toBe(1);
    });

    it('should drop a retried submission carrying the same submissionId after the DB 5s window has passed (NodeCache idempotency)', async () => {
      const realAnswers = (testQuiz.questions || []).map((q, idx) => ({
        questionId: String(q.id || q._id || q.questionId || `00000000-0000-0000-0000-00000000000${idx + 1}`),
        selectedAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
      }));

      const submissionId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

      // First submission creates the attempt and remembers the submission UUID
      const firstRes = await request(app)
        .post(`/api/quizzes/${testQuiz.id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answers: realAnswers, timeSpent: 30, submissionId });
      expect(firstRes.status).toBe(201);

      // Backdate the attempt beyond the pre-existing 5s DB duplicate window so
      // the DB check can no longer deduplicate the retry — only the 10s
      // submissionId NodeCache can still drop it. This test fails if the
      // NodeCache idempotency mechanism is removed.
      await QuizAttempt.update(
        { createdAt: new Date(Date.now() - 7000) },
        { where: { id: firstRes.body.data.id } }
      );

      // Retry with the same UUID within the 10-second window must still be dropped
      const secondRes = await request(app)
        .post(`/api/quizzes/${testQuiz.id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answers: realAnswers, timeSpent: 30, submissionId });

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.success).toBe(true);
      expect(secondRes.body.duplicate).toBe(true);
      expect(secondRes.body.data.id).toBe(firstRes.body.data.id);

      const attemptCount = await QuizAttempt.count({
        where: { user: testUser.id, quiz: testQuiz.id },
      });
      expect(attemptCount).toBe(1);
    });

    it('should allow a new attempt with the same submissionId once the 10s cache TTL expires', async () => {
      const realAnswers = (testQuiz.questions || []).map((q, idx) => ({
        questionId: String(q.id || q._id || q.questionId || `00000000-0000-0000-0000-00000000000${idx + 1}`),
        selectedAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
      }));

      const submissionId = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';

      const firstRes = await request(app)
        .post(`/api/quizzes/${testQuiz.id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answers: realAnswers, timeSpent: 30, submissionId });
      expect(firstRes.status).toBe(201);

      // Move the attempt outside the 5s DB duplicate window so the DB check
      // cannot block the retry either.
      await QuizAttempt.update(
        { createdAt: new Date(Date.now() - 7000) },
        { where: { id: firstRes.body.data.id } }
      );

      // Simulate >10s passing: NodeCache decides TTL expiry via Date.now()
      // (node-cache source: data.t !== 0 && data.t < Date.now()). Only Date is
      // faked — supertest/sequelize async behavior is untouched.
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(Date.now() + 11000);
      try {
        const secondRes = await request(app)
          .post(`/api/quizzes/${testQuiz.id}/submit`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ answers: realAnswers, timeSpent: 30, submissionId });

        expect(secondRes.status).toBe(201);
        expect(secondRes.body.success).toBe(true);
        expect(secondRes.body.data.id).not.toBe(firstRes.body.data.id);

        const attemptCount = await QuizAttempt.count({
          where: { user: testUser.id, quiz: testQuiz.id },
        });
        expect(attemptCount).toBe(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should not create duplicate attempts when the same quiz is submitted concurrently (rapid double-click)', async () => {
      const realAnswers = (testQuiz.questions || []).map((q, idx) => ({
        questionId: String(q.id || q._id || q.questionId || `00000000-0000-0000-0000-00000000000${idx + 1}`),
        selectedAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
      }));

      const [res1, res2] = await Promise.all([
        request(app)
          .post(`/api/quizzes/${testQuiz.id}/submit`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ answers: realAnswers, timeSpent: 30 }),
        request(app)
          .post(`/api/quizzes/${testQuiz.id}/submit`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ answers: realAnswers, timeSpent: 30 }),
      ]);

      // Exactly one attempt must be persisted
      const attemptCount = await QuizAttempt.count({
        where: { user: testUser.id, quiz: testQuiz.id },
      });
      expect(attemptCount).toBe(1);

      // One request creates (201), the other is deduplicated (200 + duplicate flag)
      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 201]);
      const dupRes = res1.status === 200 ? res1 : res2;
      expect(dupRes.body.duplicate).toBe(true);
    });

    it('should allow a new attempt after the 5-second dedup window has passed', async () => {
      const realAnswers = (testQuiz.questions || []).map((q, idx) => ({
        questionId: String(q.id || q._id || q.questionId || `00000000-0000-0000-0000-00000000000${idx + 1}`),
        selectedAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
      }));

      const firstRes = await request(app)
        .post(`/api/quizzes/${testQuiz.id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answers: realAnswers, timeSpent: 30 });
      expect(firstRes.status).toBe(201);

      // Simulate the previous attempt being older than the dedup window
      await QuizAttempt.update(
        { createdAt: new Date(Date.now() - 10000) },
        { where: { id: firstRes.body.data.id } }
      );

      const secondRes = await request(app)
        .post(`/api/quizzes/${testQuiz.id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answers: realAnswers, timeSpent: 30 });

      expect(secondRes.status).toBe(201);
      expect(secondRes.body.success).toBe(true);
      expect(secondRes.body.data.id).not.toBe(firstRes.body.data.id);

      const attemptCount = await QuizAttempt.count({
        where: { user: testUser.id, quiz: testQuiz.id },
      });
      expect(attemptCount).toBe(2);
    });

    afterEach(async () => {
      // Clean up attempts created during these tests
      await QuizAttempt.destroy({ where: {} });
    });
  });
});
