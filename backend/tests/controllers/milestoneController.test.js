const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const milestoneRoutes = require('../../routes/milestoneRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Exam = require('../../models/Exam');
const StudyPlan = require('../../models/StudyPlan');
const GamificationService = require('../../services/gamificationService');

const app = express();
app.use(express.json());
app.use('/api/milestones', milestoneRoutes);
app.use(errorHandler);

jest.mock('../../services/gamificationService', () => ({
  addXP: jest.fn().mockResolvedValue({ success: true }),
  checkAndAwardBadges: jest.fn().mockResolvedValue([]),
}));

describe('Milestone Controller', () => {
  let testUser;
  let testExam;
  let authToken;
  let studyPlan;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_milestone';

    testUser = await User.create({
      name: 'Milestone User',
      email: 'milestone@example.com',
      password: 'password123',
    });

    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET);

    testExam = await Exam.create({
      name: 'Milestone Exam',
      description: 'Exam for milestone tests',
      date: new Date(),
      user: testUser.id,
    });
  });

  afterAll(async () => {
    delete process.env.JWT_SECRET;
    await StudyPlan.deleteMany({ user: testUser.id });
    await Exam.deleteMany({ user: testUser.id });
    await User.deleteMany({ _id: testUser.id });
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await StudyPlan.deleteMany({ user: testUser.id });

    studyPlan = await StudyPlan.create({
      user: testUser.id,
      exam: testExam.id,
      name: 'Test Plan',
      startDate: new Date(),
      endDate: new Date(),
      scheduleConfig: { studyHoursPerDay: 2 },
      status: 'active',
      milestones: [
        {
          id: uuidv4(),
          title: 'Pending Milestone',
          type: 'weekly_checkpoint',
          date: new Date(Date.now() - 86400000), // yesterday (eligible to claim)
          status: 'pending',
          rewardType: 'xp_bonus',
        },
        {
          id: uuidv4(),
          title: 'Future Milestone',
          type: 'mid_course_review',
          date: new Date(Date.now() + 86400000), // tomorrow
          status: 'pending',
          rewardType: 'streak_freeze',
        },
        {
          id: uuidv4(),
          title: 'Completed Milestone',
          type: 'final_review',
          date: new Date(Date.now() - 86400000),
          status: 'completed',
          rewardType: 'xp_bonus',
        },
      ],
    });
  });

  describe('GET /api/milestones', () => {
    it('should return all milestones across study plans', async () => {
      const res = await request(app)
        .get('/api/milestones')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.summary).toBeDefined();
    });

    it('should filter milestones by status pending', async () => {
      const res = await request(app)
        .get('/api/milestones?status=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every(m => m.status === 'pending')).toBe(true);
    });

    it('should filter milestones by status completed', async () => {
      const res = await request(app)
        .get('/api/milestones?status=completed')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe('completed');
    });
  });

  describe('PUT /api/milestones/:id/claim', () => {
    it('should successfully claim an eligible pending milestone', async () => {
      const pendingMilestoneId = studyPlan.milestones[0].id;

      const res = await request(app)
        .put(`/api/milestones/${pendingMilestoneId}/claim`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('claimed');
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.claimedAt).toBeDefined();

      // Check XP awarded
      expect(GamificationService.addXP).toHaveBeenCalledWith(testUser.id, 50, 'Milestone completion bonus');
      expect(GamificationService.checkAndAwardBadges).toHaveBeenCalledWith(testUser.id, 'milestone_completed', 1);

      // Verify db state
      const updatedPlan = await StudyPlan.findById(studyPlan._id);
      const claimedMilestone = updatedPlan.milestones.find(m => m.id === pendingMilestoneId);
      expect(claimedMilestone.status).toBe('completed');
    });

    it('should fail to claim an already completed milestone', async () => {
      const completedMilestoneId = studyPlan.milestones[2].id;

      const res = await request(app)
        .put(`/api/milestones/${completedMilestoneId}/claim`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already been claimed');

      expect(GamificationService.addXP).not.toHaveBeenCalled();
    });

    it('should fail to claim a future milestone', async () => {
      const futureMilestoneId = studyPlan.milestones[1].id;

      const res = await request(app)
        .put(`/api/milestones/${futureMilestoneId}/claim`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('cannot be claimed yet');

      expect(GamificationService.addXP).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent milestone', async () => {
      const nonExistentId = uuidv4();

      const res = await request(app)
        .put(`/api/milestones/${nonExistentId}/claim`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not found');
    });
  });
});
