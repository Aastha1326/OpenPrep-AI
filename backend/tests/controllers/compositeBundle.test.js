const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const academicRoutes = require('../../routes/academicRoutes');
const progressRoutes = require('../../routes/progressRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Exam = require('../../models/Exam');
const Subject = require('../../models/Subject');
const Topic = require('../../models/Topic');
const Progress = require('../../models/Progress');

const app = express();
app.use(express.json());
app.use('/api/academic', academicRoutes);
app.use('/api/progress', progressRoutes);
app.use(errorHandler);

describe('Composite Target Exam Bundles - API Integration Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_bundle';

    testUser = await User.create({
      name: 'Bundle User',
      email: 'bundleuser@example.com',
      password: 'password123',
    });

    authToken = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  describe('POST /api/academic/bundles', () => {
    it('should create a composite target exam bundle with subject weightages', async () => {
      const res = await request(app)
        .post('/api/academic/bundles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'JEE Advanced Bundle 2026',
          description: 'Multi-Subject JEE Prep',
          date: new Date('2026-05-20'),
          targetExamType: 'JEE',
          subjects: [
            { name: 'Mathematics', weightage: 33.3 },
            { name: 'Physics', weightage: 33.3 },
            { name: 'Chemistry', weightage: 33.4 },
          ],
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.exam.name).toBe('JEE Advanced Bundle 2026');
      expect(res.body.data.exam.isBundle).toBe(true);
      expect(res.body.data.exam.targetExamType).toBe('JEE');
      expect(res.body.data.subjects.length).toBe(3);
    });

    it('should return 400 if exam name or date is missing', async () => {
      const res = await request(app)
        .post('/api/academic/bundles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing name and date',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/progress/composite-overview', () => {
    it('should return target exam bundle overview with cumulative progress', async () => {
      const exam = await Exam.create({
        name: 'SAT Target Bundle',
        description: 'SAT Dual Section',
        date: new Date('2026-06-01'),
        isBundle: true,
        targetExamType: 'SAT',
        user: testUser.id,
      });

      const sub1 = await Subject.create({
        name: 'Reading & Writing',
        weightage: 50,
        exam: exam.id,
        user: testUser.id,
      });

      const sub2 = await Subject.create({
        name: 'Math',
        weightage: 50,
        exam: exam.id,
        user: testUser.id,
      });

      const top1 = await Topic.create({
        name: 'Algebra',
        subject: sub2.id,
        user: testUser.id,
      });

      await Progress.create({
        user: testUser.id,
        subject: sub2.id,
        topic: top1.id,
        completionPercentage: 80,
      });

      const res = await request(app)
        .get(`/api/progress/composite-overview?examId=${exam.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.examName).toBe('SAT Target Bundle');
      expect(res.body.data.isBundle).toBe(true);
      expect(res.body.data.totalSubjects).toBe(2);
    });
  });
});
