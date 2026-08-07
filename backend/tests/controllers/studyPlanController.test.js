const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const studyPlanRoutes = require('../../routes/studyPlanRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Exam = require('../../models/Exam');
const Subject = require('../../models/Subject');
const Topic = require('../../models/Topic');
const StudyPlan = require('../../models/StudyPlan');

const app = express();
app.use(express.json());
app.use('/api/study-plans', studyPlanRoutes);
app.use(errorHandler);

describe('Study Plan Controller - Toggle Task Completion', () => {
  let testUser;
  let testExam;
  let authToken;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_study_plan';

    testUser = await User.create({
      name: 'Study Plan User',
      email: 'studyplan@example.com',
      password: 'password123',
    });

    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET);

    testExam = await Exam.create({
      name: 'Study Plan Exam',
      description: 'Exam for study plan tests',
      date: new Date(),
      user: testUser.id,
    });
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  /**
   * Helper: create a study plan with a single task for testing toggle behavior.
   * Returns the plan and the task's _id.
   */
  async function createPlanWithTask(taskOverrides = {}) {
    const taskId = uuidv4();
    const plan = await StudyPlan.create({
      exam: testExam.id,
      user: testUser.id,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-07-10'),
      dailyGoals: [
        {
          date: new Date('2026-07-01'),
          tasks: [
            {
              _id: taskId,
              title: taskOverrides.title || 'Study Math',
              duration: taskOverrides.duration || 60,
              completed: taskOverrides.initialCompleted ?? false,
              topic: null,
            },
          ],
        },
      ],
      status: 'active',
    });
    return { plan, taskId };
  }

  describe('PUT /api/study-plans/:planId/tasks/:taskId', () => {
    it('should add study hours when marking an incomplete task as complete', async () => {
      const { plan, taskId } = await createPlanWithTask({ initialCompleted: false });
      const initialHours = testUser.studyHours;

      const res = await request(app)
        .put(`/api/study-plans/${plan.id}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: true, studyTimeMinutes: 120 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify study hours increased by 2 (120 min / 60)
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.studyHours).toBe(Number((initialHours + 2).toFixed(2)));
    });

    it('should subtract study hours when unmarking a completed task as incomplete', async () => {
      // Start with studyHours set to a known value
      testUser.studyHours = 5;
      await testUser.save();

      const { plan, taskId } = await createPlanWithTask({ initialCompleted: true, duration: 60 });

      const res = await request(app)
        .put(`/api/study-plans/${plan.id}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: false, studyTimeMinutes: 60 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify study hours decreased by 1 hour (60 min / 60)
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.studyHours).toBe(4);
    });

    it('should NOT double-count hours when toggling the same task complete twice', async () => {
      testUser.studyHours = 10;
      await testUser.save();

      const { plan, taskId } = await createPlanWithTask({ initialCompleted: false });

      // First toggle: mark as complete
      await request(app)
        .put(`/api/study-plans/${plan.id}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: true, studyTimeMinutes: 60 });

      // Second toggle: mark as complete again (no state change)
      const res = await request(app)
        .put(`/api/study-plans/${plan.id}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: true, studyTimeMinutes: 60 });

      expect(res.status).toBe(200);

      // Should have added only 1 hour total, NOT 2
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.studyHours).toBe(11);
    });

    it('should NOT go negative when subtracting more hours than available', async () => {
      testUser.studyHours = 0.5;
      await testUser.save();

      const { plan, taskId } = await createPlanWithTask({ initialCompleted: true, duration: 120 });

      const res = await request(app)
        .put(`/api/study-plans/${plan.id}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: false, studyTimeMinutes: 120 });

      expect(res.status).toBe(200);

      // Should floor at 0, not go negative
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.studyHours).toBe(0);
    });

    it('should NOT change study hours when marking complete with 0 studyTimeMinutes', async () => {
      testUser.studyHours = 3;
      await testUser.save();

      const { plan, taskId } = await createPlanWithTask({ initialCompleted: false });

      const res = await request(app)
        .put(`/api/study-plans/${plan.id}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: true, studyTimeMinutes: 0 });

      expect(res.status).toBe(200);

      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.studyHours).toBe(3);
    });

    it('should NOT change study hours when no studyTimeMinutes is provided', async () => {
      testUser.studyHours = 7;
      await testUser.save();

      const { plan, taskId } = await createPlanWithTask({ initialCompleted: false });

      const res = await request(app)
        .put(`/api/study-plans/${plan.id}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: true });

      expect(res.status).toBe(200);

      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.studyHours).toBe(7);
    });

    it('should NOT change hours when toggling incomplete -> incomplete (no state change)', async () => {
      testUser.studyHours = 2;
      await testUser.save();

      const { plan, taskId } = await createPlanWithTask({ initialCompleted: false });

      const res = await request(app)
        .put(`/api/study-plans/${plan.id}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: false, studyTimeMinutes: 60 });

      expect(res.status).toBe(200);

      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.studyHours).toBe(2);
    });

    it('should handle fractional study minutes with correct precision', async () => {
      testUser.studyHours = 0;
      await testUser.save();

      const { plan, taskId } = await createPlanWithTask({ initialCompleted: false });

      // 90 minutes = 1.5 hours
      const res = await request(app)
        .put(`/api/study-plans/${plan.id}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: true, studyTimeMinutes: 90 });

      expect(res.status).toBe(200);

      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.studyHours).toBe(1.5);
    });

    it('should return 404 when the plan does not exist', async () => {
      const fakePlanId = uuidv4();
      const fakeTaskId = uuidv4();

      const res = await request(app)
        .put(`/api/study-plans/${fakePlanId}/tasks/${fakeTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: true, studyTimeMinutes: 30 });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Study plan not found');
    });

    it('should return 404 when the task does not exist in the plan', async () => {
      const { plan } = await createPlanWithTask();
      const fakeTaskId = uuidv4();

      const res = await request(app)
        .put(`/api/study-plans/${plan.id}/tasks/${fakeTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: true, studyTimeMinutes: 30 });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Task not found in plan');
    });

    it('should return 401 without auth token', async () => {
      const { plan, taskId } = await createPlanWithTask();

      const res = await request(app)
        .put(`/api/study-plans/${plan.id}/tasks/${taskId}`)
        .send({ completed: true, studyTimeMinutes: 30 });

      expect(res.status).toBe(401);
    });

    it('should update the task completion status in the database', async () => {
      const { plan, taskId } = await createPlanWithTask({ initialCompleted: false });

      await request(app)
        .put(`/api/study-plans/${plan.id}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: true, studyTimeMinutes: 30 });

      // Verify task is stored as completed in DB
      const updatedPlan = await StudyPlan.findByPk(plan.id);
      const updatedTask = updatedPlan.dailyGoals[0].tasks.find((t) => t._id === taskId);
      expect(updatedTask.completed).toBe(true);
    });
  });
});
