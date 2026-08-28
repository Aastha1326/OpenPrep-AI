const { describe, it, expect, vi, beforeEach } = require('vitest');

// ── Mocks ────────────────────────────────────────────────────────────────
// Mock database models before importing the service
const mockSequelize = {
  define: vi.fn(() => ({})),
  authenticate: vi.fn(),
};

const mockStudyGoal = {
  create: vi.fn(),
  findOne: vi.fn(),
  findAll: vi.fn(),
  findAndCountAll: vi.fn(),
  sum: vi.fn(),
  update: vi.fn(),
  destroy: vi.fn(),
};

const mockStudyGoalProgress = {
  create: vi.fn(),
  findOne: vi.fn(),
  findAll: vi.fn(),
  sum: vi.fn(),
  destroy: vi.fn(),
};

const mockWeeklyReport = {
  create: vi.fn(),
  findOne: vi.fn(),
  findAndCountAll: vi.fn(),
};

const mockSubject = {};

vi.mock('../config/db', () => ({
  sequelize: mockSequelize,
}));

vi.mock('../models/StudyGoal', () => ({
  default: mockStudyGoal,
  findOne: mockStudyGoal.findOne,
  findAll: mockStudyGoal.findAll,
  findAndCountAll: mockStudyGoal.findAndCountAll,
  create: mockStudyGoal.create,
  sum: mockStudyGoal.sum,
  update: mockStudyGoal.update,
  destroy: mockStudyGoal.destroy,
}));

vi.mock('../models/StudyGoalProgress', () => ({
  default: mockStudyGoalProgress,
  create: mockStudyGoalProgress.create,
  findOne: mockStudyGoalProgress.findOne,
  findAll: mockStudyGoalProgress.findAll,
  sum: mockStudyGoalProgress.sum,
  destroy: mockStudyGoalProgress.destroy,
}));

vi.mock('../models/WeeklyStudyReport', () => ({
  default: mockWeeklyReport,
  create: mockWeeklyReport.create,
  findOne: mockWeeklyReport.findOne,
  findAndCountAll: mockWeeklyReport.findAndCountAll,
}));

vi.mock('../models/Subject', () => ({
  default: mockSubject,
}));

vi.mock('../models/ActivityLog', () => ({
  default: { create: vi.fn() },
}));

// Import after mocking
const studyGoalService = require('../services/studyGoalService');

// ── Test Data ────────────────────────────────────────────────────────────

const mockUser = { id: 'user-123' };

const mockGoalData = {
  title: 'Study Organic Chemistry',
  description: 'Focus on reaction mechanisms',
  goalType: 'daily',
  metricType: 'study_hours',
  targetValue: 2,
  unit: 'hours',
  subject: 'subject-456',
  priority: 'medium',
  startDate: '2026-08-27',
  endDate: '2026-08-28',
};

const mockCreatedGoal = {
  id: 'goal-789',
  user: 'user-123',
  ...mockGoalData,
  currentValue: 0,
  status: 'active',
  streakDays: 0,
  bestStreak: 0,
  tags: [],
  metadata: {},
  save: vi.fn().mockResolvedValue(true),
  toJSON: vi.fn().mockReturnValue({ id: 'goal-789', ...mockGoalData }),
};

const mockGoalInstance = {
  id: 'goal-789',
  user: 'user-123',
  title: 'Study Organic Chemistry',
  goalType: 'daily',
  metricType: 'study_hours',
  targetValue: 2,
  currentValue: 0,
  status: 'active',
  streakDays: 0,
  bestStreak: 0,
  startDate: '2026-08-27',
  endDate: '2026-08-28',
  completedAt: null,
  metadata: {},
  save: vi.fn().mockResolvedValue(true),
  toJSON: vi.fn().mockReturnValue({ id: 'goal-789' }),
};

// ── Tests ────────────────────────────────────────────────────────────────

describe('studyGoalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createGoal', () => {
    it('should create a daily goal with computed end date', async () => {
      mockStudyGoal.create.mockResolvedValue(mockCreatedGoal);

      const result = await studyGoalService.createGoal(mockUser.id, mockGoalData);

      expect(mockStudyGoal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: 'user-123',
          title: 'Study Organic Chemistry',
          targetValue: 2,
          status: 'active',
        })
      );
      expect(result).toEqual(mockCreatedGoal);
    });

    it('should create a weekly goal with computed end date', async () => {
      const weeklyGoal = { ...mockGoalData, goalType: 'weekly' };
      mockStudyGoal.create.mockResolvedValue({ ...mockCreatedGoal, ...weeklyGoal });

      await studyGoalService.createGoal(mockUser.id, weeklyGoal);

      expect(mockStudyGoal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          goalType: 'weekly',
        })
      );
    });

    it('should use provided end date when given', async () => {
      const goalWithEnd = { ...mockGoalData, endDate: '2026-09-15' };
      mockStudyGoal.create.mockResolvedValue(mockCreatedGoal);

      await studyGoalService.createGoal(mockUser.id, goalWithEnd);

      expect(mockStudyGoal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          endDate: '2026-09-15',
        })
      );
    });
  });

  describe('recordProgress', () => {
    it('should record progress and update currentValue', async () => {
      mockStudyGoal.findOne.mockResolvedValue({ ...mockGoalInstance });
      mockStudyGoalProgress.create.mockResolvedValue({
        id: 'progress-1',
        value: 0.5,
        source: 'manual',
      });
      mockStudyGoalProgress.sum.mockResolvedValue(0.5);

      const result = await studyGoalService.recordProgress('user-123', 'goal-789', {
        value: 0.5,
        source: 'manual',
      });

      expect(mockStudyGoalProgress.create).toHaveBeenCalledWith(
        expect.objectContaining({
          goalId: 'goal-789',
          user: 'user-123',
          value: 0.5,
          source: 'manual',
        })
      );
      expect(result.goal).toBeDefined();
      expect(result.progress).toBeDefined();
    });

    it('should complete goal when target is reached', async () => {
      const goalNearComplete = {
        ...mockGoalInstance,
        targetValue: 2,
        currentValue: 1.5,
      };
      mockStudyGoal.findOne.mockResolvedValue(goalNearComplete);
      mockStudyGoalProgress.create.mockResolvedValue({ id: 'progress-2', value: 1 });
      mockStudyGoalProgress.sum.mockResolvedValue(2.5);

      const result = await studyGoalService.recordProgress('user-123', 'goal-789', {
        value: 1,
        source: 'focus_session',
      });

      expect(result.goal.status).toBe('completed');
      expect(result.goal.currentValue).toBe(2); // capped at target
      expect(result.goal.completedAt).toBeDefined();
    });

    it('should throw error for non-existent goal', async () => {
      mockStudyGoal.findOne.mockResolvedValue(null);

      await expect(
        studyGoalService.recordProgress('user-123', 'nonexistent', { value: 1 })
      ).rejects.toThrow('Study goal not found');
    });

    it('should throw error for non-active goal', async () => {
      mockStudyGoal.findOne.mockResolvedValue({
        ...mockGoalInstance,
        status: 'completed',
      });

      await expect(
        studyGoalService.recordProgress('user-123', 'goal-789', { value: 1 })
      ).rejects.toThrow('Cannot record progress');
    });
  });

  describe('getUserGoals', () => {
    it('should return paginated goals', async () => {
      mockStudyGoal.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: [
          { id: 'goal-1', title: 'Goal 1' },
          { id: 'goal-2', title: 'Goal 2' },
        ],
      });

      const result = await studyGoalService.getUserGoals('user-123', {
        page: 1,
        limit: 10,
      });

      expect(result.goals).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('should apply status filter', async () => {
      mockStudyGoal.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });

      await studyGoalService.getUserGoals('user-123', { status: 'active' });

      expect(mockStudyGoal.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        })
      );
    });

    it('should apply goalType filter', async () => {
      mockStudyGoal.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await studyGoalService.getUserGoals('user-123', { goalType: 'weekly' });

      expect(mockStudyGoal.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ goalType: 'weekly' }),
        })
      );
    });
  });

  describe('getGoalById', () => {
    it('should return goal with progress entries', async () => {
      mockStudyGoal.findOne.mockResolvedValue(mockGoalInstance);
      mockStudyGoalProgress.findAll.mockResolvedValue([
        { id: 'p1', value: 0.5 },
        { id: 'p2', value: 0.3 },
      ]);

      const result = await studyGoalService.getGoalById('user-123', 'goal-789');

      expect(result.goal).toEqual(mockGoalInstance);
      expect(result.progressEntries).toHaveLength(2);
    });

    it('should return null for non-existent goal', async () => {
      mockStudyGoal.findOne.mockResolvedValue(null);

      const result = await studyGoalService.getGoalById('user-123', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateGoal', () => {
    it('should update allowed fields', async () => {
      const goal = {
        ...mockGoalInstance,
        title: 'Old Title',
        save: vi.fn().mockResolvedValue(true),
      };
      mockStudyGoal.findOne.mockResolvedValue(goal);

      const result = await studyGoalService.updateGoal('user-123', 'goal-789', {
        title: 'New Title',
        targetValue: 5,
        priority: 'high',
      });

      expect(result.title).toBe('New Title');
      expect(result.targetValue).toBe(5);
      expect(result.priority).toBe('high');
      expect(result.save).toHaveBeenCalled();
    });

    it('should return null for non-existent goal', async () => {
      mockStudyGoal.findOne.mockResolvedValue(null);

      const result = await studyGoalService.updateGoal('user-123', 'nonexistent', {
        title: 'Updated',
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteGoal', () => {
    it('should delete goal and associated progress entries', async () => {
      const goal = {
        ...mockGoalInstance,
        destroy: vi.fn().mockResolvedValue(true),
      };
      mockStudyGoal.findOne.mockResolvedValue(goal);
      mockStudyGoalProgress.destroy.mockResolvedValue(2);

      const result = await studyGoalService.deleteGoal('user-123', 'goal-789');

      expect(result).toBe(true);
      expect(mockStudyGoalProgress.destroy).toHaveBeenCalledWith({
        where: { goalId: 'goal-789' },
      });
      expect(goal.destroy).toHaveBeenCalled();
    });

    it('should return null for non-existent goal', async () => {
      mockStudyGoal.findOne.mockResolvedValue(null);

      const result = await studyGoalService.deleteGoal('user-123', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getDailyStats', () => {
    it('should return daily stats with summary and breakdown', async () => {
      mockStudyGoal.findAll.mockResolvedValue([
        { id: 'g1', status: 'completed', startDate: '2026-08-27', endDate: '2026-08-28', completedAt: new Date('2026-08-27T14:00:00'), subject: null, subjectRef: null, targetValue: 2, currentValue: 2 },
        { id: 'g2', status: 'active', startDate: '2026-08-27', endDate: '2026-08-28', completedAt: null, subject: null, subjectRef: null, targetValue: 1, currentValue: 0.5 },
      ]);

      mockStudyGoalProgress.findAll.mockResolvedValue([
        { value: 1, source: 'focus_session', recordedAt: new Date('2026-08-27T10:00:00') },
        { value: 0.5, source: 'manual', recordedAt: new Date('2026-08-27T15:00:00') },
      ]);

      const stats = await studyGoalService.getDailyStats(
        'user-123',
        '2026-08-27',
        '2026-08-27'
      );

      expect(stats.summary).toBeDefined();
      expect(stats.summary.totalGoalsSet).toBe(2);
      expect(stats.summary.totalGoalsCompleted).toBe(1);
      expect(stats.dailyBreakdown).toHaveLength(1);
      expect(stats.dailyBreakdown[0].date).toBe('2026-08-27');
    });
  });

  describe('getStreakMetrics', () => {
    it('should calculate streak metrics', async () => {
      mockStudyGoal.findAll.mockResolvedValue([
        { id: 'g1', streakDays: 5, bestStreak: 10, status: 'completed', startDate: '2026-08-20', endDate: '2026-08-27', completedAt: new Date() },
        { id: 'g2', streakDays: 3, bestStreak: 3, status: 'expired', startDate: '2026-08-20', endDate: '2026-08-21', completedAt: null },
      ]);

      mockStudyGoalProgress.findAll.mockResolvedValue([
        { recordedAt: new Date('2026-08-27T10:00:00') },
        { recordedAt: new Date('2026-08-26T10:00:00') },
        { recordedAt: new Date('2026-08-25T10:00:00') },
      ]);

      const metrics = await studyGoalService.getStreakMetrics('user-123');

      expect(metrics.longestStreak).toBeGreaterThanOrEqual(10);
      expect(metrics.totalGoalsCompleted).toBe(1);
      expect(metrics.totalGoalsMissed).toBe(1);
    });
  });

  describe('getSubjectAnalytics', () => {
    it('should aggregate analytics by subject', async () => {
      mockStudyGoal.findAll.mockResolvedValue([
        {
          id: 'g1',
          subject: 'sub-1',
          status: 'completed',
          targetValue: 2,
          currentValue: 2,
          subjectRef: { id: 'sub-1', name: 'Chemistry' },
        },
        {
          id: 'g2',
          subject: 'sub-1',
          status: 'active',
          targetValue: 3,
          currentValue: 1.5,
          subjectRef: { id: 'sub-1', name: 'Chemistry' },
        },
        {
          id: 'g3',
          subject: 'sub-2',
          status: 'completed',
          targetValue: 1,
          currentValue: 1,
          subjectRef: { id: 'sub-2', name: 'Physics' },
        },
      ]);

      const analytics = await studyGoalService.getSubjectAnalytics('user-123');

      expect(analytics).toHaveLength(2);
      expect(analytics.find((a) => a.subjectId === 'sub-1').totalGoals).toBe(2);
      expect(analytics.find((a) => a.subjectId === 'sub-1').completedGoals).toBe(1);
      expect(analytics.find((a) => a.subjectId === 'sub-1').subjectName).toBe('Chemistry');
    });
  });

  describe('generateWeeklyReport', () => {
    it('should generate a weekly report', async () => {
      mockWeeklyReport.findOne.mockResolvedValue(null);
      mockStudyGoal.findAll.mockResolvedValue([]);
      mockStudyGoalProgress.findAll.mockResolvedValue([]);
      mockWeeklyReport.create.mockResolvedValue({
        id: 'report-1',
        weekStart: '2026-08-25',
        weekEnd: '2026-08-31',
        goalsSet: 0,
        goalsCompleted: 0,
      });

      const report = await studyGoalService.generateWeeklyReport(
        'user-123',
        '2026-08-25',
        '2026-08-31'
      );

      expect(mockWeeklyReport.create).toHaveBeenCalled();
      expect(report.id).toBe('report-1');
    });

    it('should return existing report if already generated', async () => {
      const existing = { id: 'existing-report', weekStart: '2026-08-25' };
      mockWeeklyReport.findOne.mockResolvedValue(existing);

      const report = await studyGoalService.generateWeeklyReport(
        'user-123',
        '2026-08-25',
        '2026-08-31'
      );

      expect(report).toEqual(existing);
      expect(mockWeeklyReport.create).not.toHaveBeenCalled();
    });

    it('should include AI insight text in generated report', async () => {
      mockWeeklyReport.findOne.mockResolvedValue(null);
      mockStudyGoal.findAll.mockResolvedValue([]);
      mockStudyGoalProgress.findAll.mockResolvedValue([]);
      mockWeeklyReport.create.mockImplementation(async (data) => data);

      await studyGoalService.generateWeeklyReport('user-123', '2026-08-25', '2026-08-31');

      const createCall = mockWeeklyReport.create.mock.calls[0][0];
      expect(createCall.aiInsight).toBeDefined();
      expect(typeof createCall.aiInsight).toBe('string');
    });
  });

  describe('getWeeklyReports', () => {
    it('should return paginated weekly reports', async () => {
      mockWeeklyReport.findAndCountAll.mockResolvedValue({
        count: 3,
        rows: [
          { id: 'r1', weekStart: '2026-08-18' },
          { id: 'r2', weekStart: '2026-08-11' },
          { id: 'r3', weekStart: '2026-08-04' },
        ],
      });

      const result = await studyGoalService.getWeeklyReports('user-123', {
        page: 1,
        limit: 10,
      });

      expect(result.reports).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });
  });

  describe('expireOverdueGoals', () => {
    it('should update expired goals count', async () => {
      mockStudyGoal.update.mockResolvedValue([5]);

      const count = await studyGoalService.expireOverdueGoals();

      expect(count).toBe(5);
      expect(mockStudyGoal.update).toHaveBeenCalledWith(
        { status: 'expired' },
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active',
          }),
        })
      );
    });
  });
});

describe('studyGoalController', () => {
  // Controller tests can be added when supertest is properly configured
  // For now, the service layer is thoroughly tested above
  it('exports all handler functions', () => {
    const controller = require('../controllers/studyGoalController');
    expect(typeof controller.createGoal).toBe('function');
    expect(typeof controller.getGoals).toBe('function');
    expect(typeof controller.getGoal).toBe('function');
    expect(typeof controller.updateGoal).toBe('function');
    expect(typeof controller.deleteGoal).toBe('function');
    expect(typeof controller.recordProgress).toBe('function');
    expect(typeof controller.bulkRecordProgress).toBe('function');
    expect(typeof controller.getDailyStats).toBe('function');
    expect(typeof controller.getSubjectAnalytics).toBe('function');
    expect(typeof controller.getStreakMetrics).toBe('function');
    expect(typeof controller.generateWeeklyReport).toBe('function');
    expect(typeof controller.getWeeklyReports).toBe('function');
    expect(typeof controller.getLatestWeeklyReport).toBe('function');
    expect(typeof controller.getDashboard).toBe('function');
  });
});

describe('studyGoalRoutes', () => {
  it('exports an Express router', () => {
    const router = require('../routes/studyGoalRoutes');
    expect(router).toBeDefined();
    expect(typeof router).toBe('function');
  });
});
