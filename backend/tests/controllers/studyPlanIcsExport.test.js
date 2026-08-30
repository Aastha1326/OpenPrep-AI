/**
 * Integration tests for GET /api/study-plans/:id/export-ics and GET /api/study-plans/:id/ics
 */
const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const studyPlanRoutes = require('../../routes/studyPlanRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Exam = require('../../models/Exam');
const StudyPlan = require('../../models/StudyPlan');

const app = express();
app.use(express.json());
app.use('/api/study-plans', studyPlanRoutes);
app.use(errorHandler);

describe('Study Plan ICS Export - GET /api/study-plans/:id/export-ics & /ics', () => {
  let testUser;
  let otherUser;
  let testExam;
  let testPlan;
  let authToken;
  let otherToken;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_ics_export';

    testUser = await User.create({
      name: 'ICS Export User',
      email: `icsexport_${uuidv4().slice(0, 8)}@example.com`,
      password: 'password123',
    });

    otherUser = await User.create({
      name: 'Other ICS User',
      email: `otherics_${uuidv4().slice(0, 8)}@example.com`,
      password: 'password123',
    });

    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET);
    otherToken = jwt.sign({ id: otherUser.id }, process.env.JWT_SECRET);

    testExam = await Exam.create({
      name: 'ICS Export Test Exam',
      description: 'Exam for ICS export tests',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      user: testUser.id,
    });

    const taskId1 = uuidv4();
    const taskId2 = uuidv4();

    testPlan = await StudyPlan.create({
      exam: testExam.id,
      user: testUser.id,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-07-10'),
      dailyGoals: [
        {
          date: '2026-07-01',
          tasks: [
            { _id: taskId1, title: 'Study Mathematics', duration: 60, completed: true, topic: null },
            { _id: taskId2, title: 'Study Physics', duration: 90, completed: false, topic: null },
          ],
        },
      ],
      status: 'active',
    });
  });

  afterAll(async () => {
    delete process.env.JWT_SECRET;
  });

  it('should return a valid ICS file stream with text/calendar Content-Type for export-ics', async () => {
    const res = await request(app)
      .get(`/api/study-plans/${testPlan.id}/export-ics`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/calendar/);
    expect(res.text).toContain('BEGIN:VCALENDAR');
    expect(res.text).toContain('SUMMARY:Study: Study Mathematics');
    expect(res.text).toContain('END:VCALENDAR');
  });

  it('should return a valid ICS file stream with text/calendar Content-Type for /ics alias', async () => {
    const res = await request(app)
      .get(`/api/study-plans/${testPlan.id}/ics`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/calendar/);
    expect(res.text).toContain('BEGIN:VCALENDAR');
    expect(res.text).toContain('SUMMARY:Study: Study Mathematics');
    expect(res.text).toContain('END:VCALENDAR');
  });

  it('should return 404 when a different user tries to export', async () => {
    const res = await request(app)
      .get(`/api/study-plans/${testPlan.id}/export-ics`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should reject unauthenticated requests with 401', async () => {
    const res = await request(app)
      .get(`/api/study-plans/${testPlan.id}/export-ics`);

    expect(res.status).toBe(401);
  });
});
