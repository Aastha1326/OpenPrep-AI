const { expect, describe, it, vi, beforeEach } = require('vitest');

/**
 * Unit tests for learningInsightsController.
 *
 * The service layer is mocked so only controller logic (parameter
 * parsing, cache hits, error handling, response formatting) is exercised.
 */

vi.mock('../../services/learningInsightsService', () => ({
  default: {
    getFullAnalytics: vi.fn(),
    getQuizPerformanceSummary: vi.fn(),
    getSubjectMasteryScores: vi.fn(),
    getStudyVelocity: vi.fn(),
    getStudyTimeDistribution: vi.fn(),
    getStreakData: vi.fn(),
    getReadinessForecast: vi.fn(),
    getComparativeReport: vi.fn(),
  },
}));

vi.mock('../../services/cacheService', () => ({
  default: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(),
    del: vi.fn().mockResolvedValue(),
  },
}));

vi.mock('../../models/ActivityLog', () => ({ default: { create: vi.fn() } }));
vi.mock('../../models/Exam', () => ({ default: {} }));
vi.mock('../../models/QuizAttempt', () => ({
  default: {
    findOne: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock('../../models/FocusSession', () => ({
  default: { findOne: vi.fn().mockResolvedValue(null) },
}));
vi.mock('../../models/User', () => ({
  default: { findByPk: vi.fn().mockResolvedValue(null) },
}));

const learningInsightsService = require('../../services/learningInsightsService').default;
const cacheService = require('../../services/cacheService').default;

const {
  getDashboard,
  getQuizPerformance,
  getSubjectMastery,
  getStudyVelocity,
  getTimeDistribution,
  getStreaks,
  getReadinessForecast,
  getWeeklyComparison,
  getPersonalBest,
  getInsightsSummary,
} = require('../../controllers/learningInsightsController');

// ── Helpers ────────────────────────────────────────────────────────────────

function mockReq(overrides = {}) {
  return {
    user: { id: 'user-1', name: 'Test User' },
    query: {},
    params: {},
    headers: {},
    ...overrides,
  };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res;
}

function mockNext() {
  return vi.fn();
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('learningInsightsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheService.get.mockResolvedValue(null);
  });

  describe('getDashboard', () => {
    it('returns 400 when windowDays is out of range', async () => {
      const req = mockReq({ query: { windowDays: '500' } });
      const res = mockRes();
      const next = mockNext();

      await getDashboard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.stringContaining('windowDays') })
      );
    });

    it('returns cached data when cache hit', async () => {
      const cachedData = { quizPerformance: { totalAttempts: 10 } };
      cacheService.get.mockResolvedValue(JSON.stringify(cachedData));

      const req = mockReq({ query: { windowDays: '30' } });
      const res = mockRes();
      const next = mockNext();

      await getDashboard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: cachedData, cached: true })
      );
      expect(learningInsightsService.getFullAnalytics).not.toHaveBeenCalled();
    });

    it('calls service and caches result on miss', async () => {
      const analyticsData = { quizPerformance: { totalAttempts: 5 } };
      learningInsightsService.getFullAnalytics.mockResolvedValue(analyticsData);

      const req = mockReq({ query: { windowDays: '14' } });
      const res = mockRes();
      const next = mockNext();

      await getDashboard(req, res, next);

      expect(learningInsightsService.getFullAnalytics).toHaveBeenCalledWith('user-1', {
        windowDays: 14,
        examId: undefined,
      });
      expect(cacheService.set).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: analyticsData })
      );
    });

    it('passes examId filter to service', async () => {
      learningInsightsService.getFullAnalytics.mockResolvedValue({});

      const req = mockReq({ query: { windowDays: '7', examId: 'exam-123' } });
      const res = mockRes();
      const next = mockNext();

      await getDashboard(req, res, next);

      expect(learningInsightsService.getFullAnalytics).toHaveBeenCalledWith('user-1', {
        windowDays: 7,
        examId: 'exam-123',
      });
    });

    it('calls next(error) on service failure', async () => {
      learningInsightsService.getFullAnalytics.mockRejectedValue(new Error('DB connection failed'));

      const req = mockReq({ query: {} });
      const res = mockRes();
      const next = mockNext();

      await getDashboard(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getQuizPerformance', () => {
    it('calls service with default 30-day window', async () => {
      learningInsightsService.getQuizPerformanceSummary.mockResolvedValue({ totalAttempts: 0 });

      const req = mockReq({ query: {} });
      const res = mockRes();
      const next = mockNext();

      await getQuizPerformance(req, res, next);

      expect(learningInsightsService.getQuizPerformanceSummary).toHaveBeenCalledWith(
        'user-1',
        expect.any(Date),
        undefined
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('passes custom windowDays and examId', async () => {
      learningInsightsService.getQuizPerformanceSummary.mockResolvedValue({});

      const req = mockReq({ query: { windowDays: '60', examId: 'e-1' } });
      const res = mockRes();
      const next = mockNext();

      await getQuizPerformance(req, res, next);

      expect(learningInsightsService.getQuizPerformanceSummary).toHaveBeenCalledWith(
        'user-1',
        expect.any(Date),
        'e-1'
      );
    });
  });

  describe('getSubjectMastery', () => {
    it('returns subject mastery data', async () => {
      const masteryData = [
        { subjectName: 'Math', masteryScore: 85, coverageLevel: 'mastered' },
      ];
      learningInsightsService.getSubjectMasteryScores.mockResolvedValue(masteryData);

      const req = mockReq({ query: {} });
      const res = mockRes();
      const next = mockNext();

      await getSubjectMastery(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: masteryData })
      );
    });
  });

  describe('getStudyVelocity', () => {
    it('uses default 30-day window when not specified', async () => {
      learningInsightsService.getStudyVelocity.mockResolvedValue({ tasksPerDay: 2 });

      const req = mockReq({ query: {} });
      const res = mockRes();
      const next = mockNext();

      await getStudyVelocity(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { tasksPerDay: 2 } })
      );
    });
  });

  describe('getTimeDistribution', () => {
    it('returns time distribution data', async () => {
      const distData = { totalTimeHours: 5.5, focusSessionCount: 3 };
      learningInsightsService.getStudyTimeDistribution.mockResolvedValue(distData);

      const req = mockReq({ query: { windowDays: '7' } });
      const res = mockRes();
      const next = mockNext();

      await getTimeDistribution(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: distData })
      );
    });
  });

  describe('getStreaks', () => {
    it('returns streak data', async () => {
      const streakData = { currentStreak: 3, longestStreak: 10 };
      learningInsightsService.getStreakData.mockResolvedValue(streakData);

      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      await getStreaks(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: streakData })
      );
    });
  });

  describe('getReadinessForecast', () => {
    it('returns readiness forecast with optional examId', async () => {
      const forecast = { hasActivePlan: true, projectedExamScore: 78 };
      learningInsightsService.getReadinessForecast.mockResolvedValue(forecast);

      const req = mockReq({ query: { examId: 'exam-1' } });
      const res = mockRes();
      const next = mockNext();

      await getReadinessForecast(req, res, next);

      expect(learningInsightsService.getReadinessForecast).toHaveBeenCalledWith('user-1', 'exam-1');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: forecast })
      );
    });
  });

  describe('getWeeklyComparison', () => {
    it('returns comparative report', async () => {
      const report = {
        thisWeek: { averageScore: 85 },
        lastWeek: { averageScore: 70 },
        comparison: { scoreDelta: 15, scoreTrend: 'improving' },
      };
      learningInsightsService.getComparativeReport.mockResolvedValue(report);

      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      await getWeeklyComparison(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: report })
      );
    });
  });

  describe('getPersonalBest', () => {
    it('returns personal best records', async () => {
      const QuizAttempt = require('../../models/QuizAttempt').default;
      QuizAttempt.findOne.mockResolvedValue({
        score: 98,
        quiz: { id: 'q-1', title: 'Advanced Calculus', subject: 's-1' },
        createdAt: new Date(),
      });
      QuizAttempt.findAll.mockResolvedValue([]);
      learningInsightsService.getSubjectMasteryScores.mockResolvedValue([
        { subjectName: 'Physics', masteryScore: 92, averageScore: 90, quizAttempts: 15 },
      ]);

      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      await getPersonalBest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.bestQuizScore).toBeDefined();
      expect(response.data.bestQuizScore.score).toBe(98);
      expect(response.data.bestSubject.name).toBe('Physics');
    });
  });

  describe('getInsightsSummary', () => {
    it('returns highlights for non-empty data', async () => {
      learningInsightsService.getFullAnalytics.mockResolvedValue({
        generatedAt: new Date().toISOString(),
        quizPerformance: {
          totalAttempts: 10,
          averageScore: 75,
          trend: { direction: 'improving', label: 'Scores improved' },
        },
        streakData: { currentStreak: 5, longestStreak: 12 },
        studyVelocity: { tasksPerDay: 3, completionRate: 80, activeStudyDays: 7 },
        timeDistribution: { totalTimeHours: 12.5 },
        readinessForecast: {
          hasActivePlan: true,
          projectedExamScore: 82,
          daysUntilExam: 14,
        },
        subjectMastery: [],
      });

      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      await getInsightsSummary(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const data = res.json.mock.calls[0][0].data;
      expect(data.highlights.length).toBeGreaterThanOrEqual(3);
      expect(data.statsOverview.totalQuizzes).toBe(10);
      expect(data.statsOverview.averageScore).toBe(75);
    });

    it('includes weakness highlight when a subject is weak', async () => {
      learningInsightsService.getFullAnalytics.mockResolvedValue({
        generatedAt: new Date().toISOString(),
        quizPerformance: { totalAttempts: 5, averageScore: 55, trend: { direction: 'stable', label: '...' } },
        streakData: { currentStreak: 0, longestStreak: 0 },
        studyVelocity: { tasksPerDay: 0, completionRate: 0, activeStudyDays: 0 },
        timeDistribution: { totalTimeHours: 0 },
        readinessForecast: { hasActivePlan: false },
        subjectMastery: [
          { subjectName: 'Organic Chemistry', quizAttempts: 3, averageScore: 35, masteryScore: 30 },
        ],
      });

      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      await getInsightsSummary(req, res, next);

      const data = res.json.mock.calls[0][0].data;
      const weakness = data.highlights.find((h) => h.type === 'weakness');
      expect(weakness).toBeDefined();
      expect(weakness.value).toBe('Organic Chemistry');
    });

    it('returns empty highlights when no data', async () => {
      learningInsightsService.getFullAnalytics.mockResolvedValue({
        generatedAt: new Date().toISOString(),
        quizPerformance: { totalAttempts: 0, averageScore: 0, trend: { direction: 'unknown', label: '' } },
        streakData: { currentStreak: 0, longestStreak: 0 },
        studyVelocity: { tasksPerDay: 0, completionRate: 0, activeStudyDays: 0 },
        timeDistribution: { totalTimeHours: 0 },
        readinessForecast: { hasActivePlan: false },
        subjectMastery: [],
      });

      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      await getInsightsSummary(req, res, next);

      const data = res.json.mock.calls[0][0].data;
      expect(data.highlights).toEqual([]);
    });
  });
});
