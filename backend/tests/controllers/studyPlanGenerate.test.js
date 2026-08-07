const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const studyPlanRoutes = require('../../routes/studyPlanRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Exam = require('../../models/Exam');
const Subject = require('../../models/Subject');
const Topic = require('../../models/Topic');
const StudyPlan = require('../../models/StudyPlan');
const geminiService = require('../../services/geminiService');

vi.mock('../../services/geminiService', () => ({
  __esModule: true,
  default: {
    generateStudyPlan: vi.fn(),
  },
  GeminiRateLimitError: class GeminiRateLimitError extends Error {},
  GeminiServerError: class GeminiServerError extends Error {},
}));

const app = express();
app.use(express.json());
app.use('/api/study-plans', studyPlanRoutes);
app.use(errorHandler);

describe('Study Plan Generator - Milestone Schedule (issue #623)', () => {
  let testUser;
  let testExam;
  let authToken;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_study_plan_generate';

    testUser = await User.create({
      name: 'Milestone User',
      email: 'milestones@example.com',
      password: 'password123',
    });

    authToken = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);

    testExam = await Exam.create({
      name: 'Milestone Exam',
      description: 'Exam for milestone schedule tests',
      date: new Date('2026-08-31'),
      user: testUser.id,
    });

    const subject = await Subject.create({
      name: 'Mathematics',
      description: 'Math syllabus',
      exam: testExam.id,
      weightage: 50,
      user: testUser.id,
    });

    await Topic.bulkCreate(
      ['Algebra', 'Calculus', 'Statistics'].map((name) => ({
        name,
        description: '',
        subject: subject.id,
        status: 'Medium',
        weightage: 33,
        user: testUser.id,
      }))
    );
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  beforeEach(() => {
    geminiService.generateStudyPlan.mockReset();
  });

  describe('POST /api/study-plans/generate-ai', () => {
    it('creates a plan with an automated milestone schedule', async () => {
      geminiService.generateStudyPlan.mockResolvedValue([
        {
          date: '2026-08-01',
          tasks: [{ title: 'Study Algebra', duration: 60, topicName: 'Algebra' }],
        },
        {
          date: '2026-08-02',
          tasks: [{ title: 'Study Calculus', duration: 90, topicName: 'Calculus' }],
        },
      ]);

      const res = await request(app)
        .post('/api/study-plans/generate-ai')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          examId: testExam.id,
          startDate: '2026-08-01',
          endDate: '2026-08-31',
          studyHoursPerDay: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const milestones = res.body.data.milestones;
      expect(Array.isArray(milestones)).toBe(true);
      expect(milestones.length).toBeGreaterThan(0);

      const examDay = milestones.find((m) => m.type === 'exam_day');
      expect(examDay).toBeTruthy();
      expect(examDay.date).toBe('2026-08-31');
      expect(examDay.status).toBe('pending');

      const finalReview = milestones.find((m) => m.type === 'final_review');
      expect(finalReview.date).toBe('2026-08-30');
    });

    it('persists the milestone schedule on the StudyPlan row', async () => {
      geminiService.generateStudyPlan.mockResolvedValue([
        {
          date: '2026-08-01',
          tasks: [{ title: 'Study Algebra', duration: 60, topicName: 'Algebra' }],
        },
      ]);

      const res = await request(app)
        .post('/api/study-plans/generate-ai')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          examId: testExam.id,
          startDate: '2026-08-01',
          endDate: '2026-08-14',
          studyHoursPerDay: 3,
        });

      expect(res.status).toBe(201);

      const stored = await StudyPlan.findByPk(res.body.data.id);
      expect(Array.isArray(stored.milestones)).toBe(true);
      expect(stored.milestones.length).toBeGreaterThan(0);
      expect(stored.milestones.some((m) => m.type === 'exam_day')).toBe(true);
    });

    it('returns 400 when the exam has no subjects or topics', async () => {
      geminiService.generateStudyPlan.mockResolvedValue([]);

      const emptyExam = await Exam.create({
        name: 'Empty Syllabus Exam',
        description: 'No subjects',
        date: new Date('2026-09-15'),
        user: testUser.id,
      });

      const res = await request(app)
        .post('/api/study-plans/generate-ai')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          examId: emptyExam.id,
          startDate: '2026-08-01',
          endDate: '2026-08-31',
          studyHoursPerDay: 3,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/study-plans/active', () => {
    it('returns milestones alongside the active plan', async () => {
      const plan = await StudyPlan.create({
        exam: testExam.id,
        user: testUser.id,
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-08-31'),
        dailyGoals: [],
        milestones: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            title: 'Exam Day',
            date: '2026-08-31',
            type: 'exam_day',
            description: 'Exam day',
            status: 'pending',
          },
        ],
        status: 'active',
      });

      const res = await request(app)
        .get('/api/study-plans/active')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ examId: testExam.id });

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(plan.id);
      expect(Array.isArray(res.body.data.milestones)).toBe(true);
      expect(res.body.data.milestones[0].title).toBe('Exam Day');
    });
  });
});
