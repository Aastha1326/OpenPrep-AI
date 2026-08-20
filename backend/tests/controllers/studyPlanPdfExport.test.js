/**
 * Integration tests for GET /api/study-plans/:id/export-pdf
 * Issue #1056: Export active study plan and progress report as a downloadable PDF
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

describe('Study Plan PDF Export - GET /api/study-plans/:id/export-pdf', () => {
  let testUser;
  let otherUser;
  let testExam;
  let testPlan;
  let authToken;
  let otherToken;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_pdf_export';

    testUser = await User.create({
      name: 'PDF Export User',
      email: `pdfexport_${uuidv4().slice(0, 8)}@example.com`,
      password: 'password123',
    });

    otherUser = await User.create({
      name: 'Other PDF User',
      email: `otherpdf_${uuidv4().slice(0, 8)}@example.com`,
      password: 'password123',
    });

    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET);
    otherToken = jwt.sign({ id: otherUser.id }, process.env.JWT_SECRET);

    testExam = await Exam.create({
      name: 'PDF Export Test Exam',
      description: 'Exam for PDF export tests',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
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
        {
          date: '2026-07-02',
          tasks: [
            { _id: uuidv4(), title: 'Study Chemistry', duration: 45, completed: false, topic: null },
          ],
        },
      ],
      status: 'active',
    });
  });

  afterAll(async () => {
    delete process.env.JWT_SECRET;
  });

  // ── Happy Path ─────────────────────────────────────────────────────────────

  it('should return a PDF with correct Content-Type for authenticated owner', async () => {
    const res = await request(app)
      .get(`/api/study-plans/${testPlan.id}/export-pdf`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
  });

  it('should include a download filename header matching openprep-studyplan-YYYY-MM-DD.pdf', async () => {
    const res = await request(app)
      .get(`/api/study-plans/${testPlan.id}/export-pdf`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    const disposition = res.headers['content-disposition'];
    expect(disposition).toBeDefined();
    expect(disposition).toMatch(/attachment/);
    expect(disposition).toMatch(/openprep-studyplan-\d{4}-\d{2}-\d{2}\.pdf/);
  });

  it('should return a non-empty response body (valid PDF starts with %PDF)', async () => {
    const res = await request(app)
      .get(`/api/study-plans/${testPlan.id}/export-pdf`)
      .set('Authorization', `Bearer ${authToken}`)
      .buffer(true)
      .parse((res, fn) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => fn(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(100);
    // PDF magic bytes: %PDF
    const header = res.body.slice(0, 4).toString('ascii');
    expect(header).toBe('%PDF');
  });

  // ── Authentication ─────────────────────────────────────────────────────────

  it('should reject unauthenticated requests with 401', async () => {
    const res = await request(app)
      .get(`/api/study-plans/${testPlan.id}/export-pdf`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject requests with an invalid token', async () => {
    const res = await request(app)
      .get(`/api/study-plans/${testPlan.id}/export-pdf`)
      .set('Authorization', 'Bearer invalid_token_xyz');

    expect(res.status).toBe(401);
  });

  // ── Authorization / Cross-user isolation ───────────────────────────────────

  it('should return 404 when a different authenticated user tries to export', async () => {
    const res = await request(app)
      .get(`/api/study-plans/${testPlan.id}/export-pdf`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // ── Invalid / Missing Plan ─────────────────────────────────────────────────

  it('should return 404 for a non-existent plan ID', async () => {
    const nonExistentId = uuidv4();
    const res = await request(app)
      .get(`/api/study-plans/${nonExistentId}/export-pdf`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
