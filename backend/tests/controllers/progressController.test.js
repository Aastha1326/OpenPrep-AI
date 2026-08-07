const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const progressRoutes = require('../../routes/progressRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Exam = require('../../models/Exam');
const Subject = require('../../models/Subject');
const Topic = require('../../models/Topic');
const Progress = require('../../models/Progress');
const ActivityLog = require('../../models/ActivityLog');
const QuizAttempt = require('../../models/QuizAttempt');
const Quiz = require('../../models/Quiz');
const Flashcard = require('../../models/Flashcard');

const app = express();
app.use(express.json());
app.use('/api/progress', progressRoutes);
app.use(errorHandler);

describe('Progress Controller - Integration Tests', () => {
  let testUser;
  let otherUser;
  let authToken;
  let otherAuthToken;
  let testExam;
  let testSubject;
  let testTopic;
  let otherTopic;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_progress';

    testUser = await User.create({
      name: 'Progress User',
      email: 'progress@example.com',
      password: 'password123',
      streakCount: 5,
      studyHours: 10,
    });

    otherUser = await User.create({
      name: 'Other User',
      email: 'other_progress@example.com',
      password: 'password123',
    });

    authToken = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);
    otherAuthToken = jwt.sign({ id: otherUser.id, type: 'access' }, process.env.JWT_SECRET);

    testExam = await Exam.create({
      name: 'Test Exam',
      description: 'An exam for testing',
      date: '2026-12-31',
      user: testUser.id,
    });

    testSubject = await Subject.create({
      name: 'Mathematics',
      description: 'Math subject',
      exam: testExam.id,
      user: testUser.id,
    });

    testTopic = await Topic.create({
      name: 'Algebra',
      description: 'Algebra fundamentals',
      subject: testSubject.id,
      user: testUser.id,
      status: 'Medium',
    });

    otherTopic = await Topic.create({
      name: 'Calculus',
      description: 'Calculus fundamentals',
      subject: testSubject.id,
      user: testUser.id,
      status: 'Strong',
    });
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  // =========================================================================
  // GET /api/progress/stats (also /api/progress/dashboard)
  // =========================================================================
  describe('GET /api/progress/stats', () => {
    it('should return dashboard stats for user with valid data', async () => {
      // Seed a progress record and activity log for this test
      await Progress.create({
        user: testUser.id,
        subject: testSubject.id,
        topic: testTopic.id,
        completionPercentage: 50,
        studyHours: 2,
      });
      await ActivityLog.create({
        user: testUser.id,
        activityType: 'quiz_attempt',
        description: 'Completed a quiz',
      });

      const res = await request(app)
        .get('/api/progress/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('streak', 5);
      expect(res.body.data).toHaveProperty('totalStudyHours', 10);
      expect(res.body.data).toHaveProperty('syllabusProgress');
      expect(res.body.data).toHaveProperty('topicsBreakdown');
      expect(res.body.data.topicsBreakdown).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('attemptsCount');
      expect(res.body.data).toHaveProperty('weeklyChartData');
      expect(res.body.data).toHaveProperty('recentActivity');
      expect(Array.isArray(res.body.data.recentActivity)).toBe(true);
    });

    it('should return zero-filled weekly chart data when no recent progress records', async () => {
      // Use otherUser who has no progress
      const res = await request(app)
        .get('/api/progress/stats')
        .set('Authorization', `Bearer ${otherAuthToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.weeklyChartData).toHaveLength(7);
      expect(res.body.data.weeklyChartData[0]).toHaveProperty('day');
      expect(res.body.data.weeklyChartData[0]).toHaveProperty('hours');
      expect(res.body.data.weeklyChartData[0]).toHaveProperty('completion');
    });

    it('should return correct topic status breakdown', async () => {
      const res = await request(app)
        .get('/api/progress/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.topicsBreakdown).toMatchObject({
        total: expect.any(Number),
        strong: expect.any(Number),
        medium: expect.any(Number),
        weak: expect.any(Number),
      });
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/progress/stats');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // GET /api/progress/subjects
  // =========================================================================
  describe('GET /api/progress/subjects', () => {
    it('should return subject breakdown grouped by subject', async () => {
      const res = await request(app)
        .get('/api/progress/subjects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      // Should have at least the Mathematics subject
      const math = res.body.data.find((s) => s.subjectName === 'Mathematics');
      expect(math).toBeDefined();
      expect(math).toHaveProperty('progressPercentage');
      expect(math).toHaveProperty('studyHours');
      expect(math).toHaveProperty('flashcardsMastered');
    });

    it('should return empty array when user has no progress records', async () => {
      const res = await request(app)
        .get('/api/progress/subjects')
        .set('Authorization', `Bearer ${otherAuthToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/progress/subjects');
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // GET /api/progress/mastery
  // =========================================================================
  describe('GET /api/progress/mastery', () => {
    let masteryUser;
    let masteryToken;
    let masteryExam;
    let masterySubject;
    let masteryTopic;

    beforeAll(async () => {
      masteryUser = await User.create({
        name: 'Mastery User',
        email: 'mastery@example.com',
        password: 'password123',
      });
      masteryToken = jwt.sign({ id: masteryUser.id, type: 'access' }, process.env.JWT_SECRET);

      masteryExam = await Exam.create({
        name: 'Mastery Exam',
        description: 'Exam for mastery tests',
        date: '2026-12-31',
        user: masteryUser.id,
      });

      masterySubject = await Subject.create({
        name: 'Physics',
        description: 'Physics subject',
        exam: masteryExam.id,
        user: masteryUser.id,
      });

      masteryTopic = await Topic.create({
        name: 'Mechanics',
        description: 'Mechanics fundamentals',
        subject: masterySubject.id,
        user: masteryUser.id,
      });
    });

    it('should return overall mastery, tier, and subject breakdown', async () => {
      const res = await request(app)
        .get('/api/progress/mastery')
        .set('Authorization', `Bearer ${masteryToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('overallMastery');
      expect(res.body.data).toHaveProperty('overallTier');
      expect(['Beginner', 'Intermediate', 'Master']).toContain(res.body.data.overallTier);
      expect(Array.isArray(res.body.data.subjects)).toBe(true);

      const physics = res.body.data.subjects.find((s) => s.name === 'Physics');
      expect(physics).toBeDefined();
      expect(physics).toHaveProperty('masteryPercentage');
      expect(physics).toHaveProperty('tier');
      expect(Array.isArray(physics.chapters)).toBe(true);
    });

    it('should compute Master tier from high quiz accuracy and flashcard retention', async () => {
      // Seed progress with high quiz scores (90+) for the topic
      await Progress.create({
        user: masteryUser.id,
        subject: masterySubject.id,
        topic: masteryTopic.id,
        completionPercentage: 90,
        quizScores: [
          { attempt: 'a1', score: 90, date: new Date() },
          { attempt: 'a2', score: 95, date: new Date() },
        ],
      });

      // Seed mastered flashcards (interval >= 21 days)
      await Flashcard.create({
        user: masteryUser.id,
        subject: masterySubject.id,
        topic: masteryTopic.id,
        front: 'Q1',
        back: 'A1',
        interval: 30,
      });
      await Flashcard.create({
        user: masteryUser.id,
        subject: masterySubject.id,
        topic: masteryTopic.id,
        front: 'Q2',
        back: 'A2',
        interval: 25,
      });

      const res = await request(app)
        .get('/api/progress/mastery')
        .set('Authorization', `Bearer ${masteryToken}`);

      expect(res.status).toBe(200);
      const physics = res.body.data.subjects.find((s) => s.name === 'Physics');
      expect(physics).toBeDefined();
      // quiz avg = 92.5, flashcard retention = 100% -> 0.6*92.5 + 0.4*100 = 95.5 -> 96
      expect(physics.masteryPercentage).toBeGreaterThanOrEqual(80);
      expect(physics.tier).toBe('Master');
      expect(physics.chapters[0].tier).toBe('Master');
    });

    it('should compute Beginner tier when no quiz or flashcard data exists', async () => {
      // Use a fresh user with a subject but no progress/flashcards
      const emptyUser = await User.create({
        name: 'Empty Mastery User',
        email: 'empty_mastery@example.com',
        password: 'password123',
      });
      const emptyToken = jwt.sign({ id: emptyUser.id, type: 'access' }, process.env.JWT_SECRET);

      const emptyExam = await Exam.create({
        name: 'Empty Exam',
        date: '2026-12-31',
        user: emptyUser.id,
      });
      await Subject.create({
        name: 'Chemistry',
        description: 'Chemistry subject',
        exam: emptyExam.id,
        user: emptyUser.id,
      });

      const res = await request(app)
        .get('/api/progress/mastery')
        .set('Authorization', `Bearer ${emptyToken}`);

      expect(res.status).toBe(200);
      const chemistry = res.body.data.subjects.find((s) => s.name === 'Chemistry');
      expect(chemistry).toBeDefined();
      expect(chemistry.masteryPercentage).toBe(0);
      expect(chemistry.tier).toBe('Beginner');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/progress/mastery');
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // GET /api/progress/study-hours
  // =========================================================================
  describe('GET /api/progress/study-hours', () => {
    it('should return total study hours from user record', async () => {
      const res = await request(app)
        .get('/api/progress/study-hours')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalStudyHours', 10);
      expect(res.body.data).toHaveProperty('weeklyData');
    });

    it('should return zero-filled weekly data when no recent progress records', async () => {
      const res = await request(app)
        .get('/api/progress/study-hours')
        .set('Authorization', `Bearer ${otherAuthToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.weeklyData).toHaveLength(7);
      expect(res.body.data.weeklyData.every((d) => d.hours === 0)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/progress/study-hours');
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // POST /api/progress/track
  // =========================================================================
  describe('POST /api/progress/track', () => {
    it('should log study time and update user total', async () => {
      const res = await request(app)
        .post('/api/progress/track')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ studyHours: 1.5, description: 'Studied algebra' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hoursLogged).toBe(1.5);
      expect(res.body.data.totalStudyHours).toBeGreaterThanOrEqual(11.5);

      // Verify activity was logged
      const activity = await ActivityLog.findOne({
        where: { user: testUser.id, description: 'Studied algebra' },
      });
      expect(activity).toBeTruthy();
    });

    it('should create Progress record when topicId is provided', async () => {
      const res = await request(app)
        .post('/api/progress/track')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyHours: 2,
          subjectId: testSubject.id,
          topicId: otherTopic.id,
          description: 'Studied calculus',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify Progress record was created
      const progress = await Progress.findOne({
        where: { user: testUser.id, topic: otherTopic.id },
      });
      expect(progress).toBeTruthy();
      expect(progress.studyHours).toBe(2);
    });

    it('should return 400 with invalid study hours', async () => {
      const res = await request(app)
        .post('/api/progress/track')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ studyHours: -1 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when study hours is missing', async () => {
      const res = await request(app)
        .post('/api/progress/track')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).post('/api/progress/track').send({ studyHours: 1 });
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // PUT /api/progress/topic/:id
  // =========================================================================
  describe('PUT /api/progress/topic/:id', () => {
    it('should create a Progress record when none exists', async () => {
      const newTopic = await Topic.create({
        name: 'Geometry',
        description: 'Geometry basics',
        subject: testSubject.id,
        user: testUser.id,
      });

      const res = await request(app)
        .put(`/api/progress/topic/${newTopic.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          completionPercentage: 75,
          studyHours: 3,
          flashcardsMastered: 10,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.completionPercentage).toBe(75);
      expect(res.body.data.studyHours).toBe(3);
      expect(res.body.data.flashcardsMastered).toBe(10);

      // Verify it was persisted
      const saved = await Progress.findOne({
        where: { user: testUser.id, topic: newTopic.id },
      });
      expect(saved).toBeTruthy();
      expect(saved.completionPercentage).toBe(75);
    });

    it('should update existing Progress record', async () => {
      // Create a progress record first
      const existing = await Progress.create({
        user: testUser.id,
        subject: testSubject.id,
        topic: testTopic.id,
        completionPercentage: 50,
        studyHours: 2,
        flashcardsMastered: 5,
      });

      const res = await request(app)
        .put(`/api/progress/topic/${testTopic.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          completionPercentage: 80,
          flashcardsMastered: 8,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.completionPercentage).toBe(80);
      expect(res.body.data.flashcardsMastered).toBe(8);
      // studyHours should remain unchanged
      expect(res.body.data.studyHours).toBe(2);
    });

    it('should return 404 for non-existent topic', async () => {
      const fakeId = uuidv4();
      const res = await request(app)
        .put(`/api/progress/topic/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completionPercentage: 50 });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .put(`/api/progress/topic/${testTopic.id}`)
        .send({ completionPercentage: 50 });
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // GET /api/progress/activity
  // =========================================================================
  describe('GET /api/progress/activity', () => {
    it('should return recent activity logs', async () => {
      const res = await request(app)
        .get('/api/progress/activity')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // Should have at least the activity created in previous tests
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array when no activity exists', async () => {
      const res = await request(app)
        .get('/api/progress/activity')
        .set('Authorization', `Bearer ${otherAuthToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/progress/activity');
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // EXPORT PROGRESS REPORTS (CSV & PDF)
  // =========================================================================
  describe('GET /api/progress/export/csv & /api/progress/export/pdf', () => {
    it('should export progress report as downloadable CSV', async () => {
      const res = await request(app)
        .get('/api/progress/export/csv')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.csv');
      expect(res.text).toContain('Exam,Subject,Topic,Status,Completion %,Study Hours,Flashcards Mastered');
    });

    it('should export progress report as downloadable PDF', async () => {
      const res = await request(app)
        .get('/api/progress/export/pdf')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.pdf');
    });

    it('should return 401 without auth token for export endpoints', async () => {
      const resCsv = await request(app).get('/api/progress/export/csv');
      expect(resCsv.status).toBe(401);

      const resPdf = await request(app).get('/api/progress/export/pdf');
      expect(resPdf.status).toBe(401);
    });
  });
});
