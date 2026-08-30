const { expect, describe, it, vi, beforeEach } = require('vitest');

/**
 * Unit tests for LearningInsightsService.
 *
 * Models are mocked via vi.mock at the top and the service is re-required
 * after the mocks are in place so every query hits the fake layer.
 */

vi.mock('../../models/QuizAttempt', () => ({ default: { findAll: vi.fn() } }));
vi.mock('../../models/StudyPlan', () => ({ default: { findAll: vi.fn(), findOne: vi.fn() } }));
vi.mock('../../models/Quiz', () => ({ default: {} }));
vi.mock('../../models/Subject', () => ({ default: { findAll: vi.fn(), count: vi.fn() } }));
vi.mock('../../models/Topic', () => ({ default: { count: vi.fn() } }));
vi.mock('../../models/ActivityLog', () => ({ default: { findAll: vi.fn() } }));
vi.mock('../../models/FocusSession', () => ({ default: { findAll: vi.fn(), findOne: vi.fn() } }));
vi.mock('../../models/Flashcard', () => ({ default: { count: vi.fn() } }));
vi.mock('../../models/User', () => ({ default: { findByPk: vi.fn() } }));
vi.mock('../../models/Exam', () => ({ default: {} }));
vi.mock('../../config/db', () => ({ sequelize: {} }));

const QuizAttempt = require('../../models/QuizAttempt').default;
const StudyPlan = require('../../models/StudyPlan').default;
const Subject = require('../../models/Subject').default;
const Topic = require('../../models/Topic').default;
const ActivityLog = require('../../models/ActivityLog').default;
const FocusSession = require('../../models/FocusSession').default;
const Flashcard = require('../../models/Flashcard').default;
const User = require('../../models/User').default;

const learningInsightsService = require('../../services/learningInsightsService');

// ── Helpers ────────────────────────────────────────────────────────────────

function makeDate(daysAgo, hours = 12) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, 0, 0, 0);
  return d;
}

function makeAttempt(score, daysAgo, timeSpent = 300, totalQuestions = 10) {
  return {
    score,
    timeSpent,
    totalQuestions,
    createdAt: makeDate(daysAgo),
    quizRef: { id: `quiz-${score}`, subject: 's-1', totalQuestions },
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('LearningInsightsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getQuizPerformanceSummary', () => {
    it('returns empty structure when no attempts exist', async () => {
      QuizAttempt.findAll.mockResolvedValue([]);
      const result = await learningInsightsService.getQuizPerformanceSummary(
        'user-1',
        new Date(Date.now() - 30 * 86400000)
      );
      expect(result.totalAttempts).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.dailyScores).toEqual([]);
    });

    it('computes correct average and median from multiple attempts', async () => {
      QuizAttempt.findAll.mockResolvedValue([
        makeAttempt(60, 10),
        makeAttempt(70, 8),
        makeAttempt(80, 6),
        makeAttempt(90, 4),
        makeAttempt(100, 2),
      ]);

      const result = await learningInsightsService.getQuizPerformanceSummary(
        'user-1',
        new Date(Date.now() - 30 * 86400000)
      );

      expect(result.totalAttempts).toBe(5);
      expect(result.averageScore).toBe(80);
      expect(result.medianScore).toBe(80);
      expect(result.minScore).toBe(60);
      expect(result.maxScore).toBe(100);
    });

    it('detects improving trend when second half scores are higher', async () => {
      // First half: low scores; second half: high scores
      const attempts = [
        makeAttempt(40, 20),
        makeAttempt(45, 18),
        makeAttempt(50, 16),
        makeAttempt(80, 4),
        makeAttempt(85, 2),
        makeAttempt(90, 1),
      ];
      QuizAttempt.findAll.mockResolvedValue(attempts);

      const result = await learningInsightsService.getQuizPerformanceSummary(
        'user-1',
        new Date(Date.now() - 30 * 86400000)
      );

      expect(result.trend.direction).toBe('improving');
      expect(result.trend.delta).toBeGreaterThan(0);
    });

    it('detects declining trend when second half scores are lower', async () => {
      const attempts = [
        makeAttempt(90, 20),
        makeAttempt(85, 18),
        makeAttempt(80, 16),
        makeAttempt(50, 4),
        makeAttempt(45, 2),
        makeAttempt(40, 1),
      ];
      QuizAttempt.findAll.mockResolvedValue(attempts);

      const result = await learningInsightsService.getQuizPerformanceSummary(
        'user-1',
        new Date(Date.now() - 30 * 86400000)
      );

      expect(result.trend.direction).toBe('declining');
      expect(result.trend.delta).toBeLessThan(0);
    });

    it('calculates overall accuracy from total questions answered', async () => {
      QuizAttempt.findAll.mockResolvedValue([
        { score: 80, totalQuestions: 10, timeSpent: 200, createdAt: makeDate(5), quizRef: {} },
        { score: 60, totalQuestions: 20, timeSpent: 400, createdAt: makeDate(3), quizRef: {} },
      ]);

      const result = await learningInsightsService.getQuizPerformanceSummary(
        'user-1',
        new Date(Date.now() - 30 * 86400000)
      );

      // 80% of 10 = 8 correct; 60% of 20 = 12 correct; total 20/30 = 66.67%
      expect(result.totalQuestionsAnswered).toBe(30);
      expect(result.totalCorrectAnswers).toBe(20);
      expect(result.overallAccuracy).toBeCloseTo(66.67, 1);
    });

    it('computes standard deviation correctly', async () => {
      QuizAttempt.findAll.mockResolvedValue([
        makeAttempt(50, 10),
        makeAttempt(50, 8),
        makeAttempt(50, 6),
        makeAttempt(50, 4),
      ]);

      const result = await learningInsightsService.getQuizPerformanceSummary(
        'user-1',
        new Date(Date.now() - 30 * 86400000)
      );

      // All scores identical -> SD = 0
      expect(result.standardDeviation).toBe(0);
    });

    it('builds dailyScores sparkline grouped by date', async () => {
      QuizAttempt.findAll.mockResolvedValue([
        makeAttempt(70, 2),
        makeAttempt(80, 2),
        makeAttempt(90, 1),
      ]);

      const result = await learningInsightsService.getQuizPerformanceSummary(
        'user-1',
        new Date(Date.now() - 30 * 86400000)
      );

      expect(result.dailyScores.length).toBe(2);
      const day2 = result.dailyScores.find((d) => d.count === 2);
      expect(day2).toBeDefined();
      expect(day2.average).toBe(75);
    });
  });

  describe('getSubjectMasteryScores', () => {
    it('returns not_started for subjects with no quiz data', async () => {
      Subject.findAll.mockResolvedValue([
        { id: 's-1', name: 'Mathematics', exam: 'e-1' },
      ]);
      QuizAttempt.findAll.mockResolvedValue([]);
      Topic.count.mockResolvedValue(5);
      Flashcard.count.mockResolvedValue(10);

      const result = await learningInsightsService.getSubjectMasteryScores('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].coverageLevel).toBe('not_started');
      expect(result[0].masteryScore).toBe(0);
      expect(result[0].topicCount).toBe(5);
      expect(result[0].flashcardCount).toBe(10);
    });

    it('assigns mastered coverage for subjects with avg >= 80', async () => {
      Subject.findAll.mockResolvedValue([
        { id: 's-1', name: 'Physics', exam: 'e-1' },
      ]);
      QuizAttempt.findAll.mockResolvedValue([
        makeAttempt(85, 5),
        makeAttempt(90, 3),
        makeAttempt(95, 1),
      ]);
      Topic.count.mockResolvedValue(8);
      Flashcard.count.mockResolvedValue(20);

      const result = await learningInsightsService.getSubjectMasteryScores('user-1');

      expect(result[0].coverageLevel).toBe('mastered');
      expect(result[0].masteryScore).toBeGreaterThan(80);
    });

    it('assigns needs_attention for subjects with avg < 40', async () => {
      Subject.findAll.mockResolvedValue([
        { id: 's-2', name: 'Chemistry', exam: 'e-1' },
      ]);
      QuizAttempt.findAll.mockResolvedValue([
        makeAttempt(30, 5),
        makeAttempt(25, 3),
        makeAttempt(35, 1),
      ]);
      Topic.count.mockResolvedValue(4);
      Flashcard.count.mockResolvedValue(2);

      const result = await learningInsightsService.getSubjectMasteryScores('user-1');

      expect(result[0].coverageLevel).toBe('needs_attention');
    });

    it('sorts subjects by mastery score descending', async () => {
      Subject.findAll.mockResolvedValue([
        { id: 's-1', name: 'Math', exam: 'e-1' },
        { id: 's-2', name: 'Physics', exam: 'e-1' },
      ]);

      QuizAttempt.findAll
        .mockResolvedValueOnce([makeAttempt(90, 5)])
        .mockResolvedValueOnce([makeAttempt(60, 5)]);

      Topic.count.mockResolvedValue(3);
      Flashcard.count.mockResolvedValue(5);

      const result = await learningInsightsService.getSubjectMasteryScores('user-1');

      expect(result[0].subjectName).toBe('Math');
      expect(result[1].subjectName).toBe('Physics');
    });

    it('detects improving trend when recent attempts beat prior attempts', async () => {
      Subject.findAll.mockResolvedValue([
        { id: 's-1', name: 'Biology', exam: 'e-1' },
      ]);

      // Prior 5: low; Recent 5: high
      const attempts = [
        makeAttempt(40, 20),
        makeAttempt(42, 18),
        makeAttempt(38, 16),
        makeAttempt(45, 14),
        makeAttempt(41, 12),
        makeAttempt(75, 5),
        makeAttempt(78, 4),
        makeAttempt(80, 3),
        makeAttempt(82, 2),
        makeAttempt(85, 1),
      ];
      QuizAttempt.findAll.mockResolvedValue(attempts);
      Topic.count.mockResolvedValue(3);
      Flashcard.count.mockResolvedValue(10);

      const result = await learningInsightsService.getSubjectMasteryScores('user-1');
      expect(result[0].trend).toBe('improving');
    });
  });

  describe('getStudyVelocity', () => {
    it('calculates tasks per day and completion rate correctly', async () => {
      const goals = [
        {
          date: makeDate(2).toISOString().split('T')[0],
          tasks: [
            { _id: 't1', completed: true },
            { _id: 't2', completed: false },
          ],
        },
        {
          date: makeDate(1).toISOString().split('T')[0],
          tasks: [
            { _id: 't3', completed: true },
            { _id: 't4', completed: true },
          ],
        },
      ];

      StudyPlan.findAll.mockResolvedValue([
        { id: 'plan-1', dailyGoals: goals, startDate: makeDate(3), endDate: makeDate(0), status: 'active' },
      ]);

      const result = await learningInsightsService.getStudyVelocity(
        'user-1',
        new Date(Date.now() - 30 * 86400000)
      );

      expect(result.totalTasksPlanned).toBe(4);
      expect(result.totalTasksCompleted).toBe(3);
      expect(result.completionRate).toBe(75);
      expect(result.activeStudyDays).toBe(2);
      expect(result.tasksPerDay).toBe(1.5);
    });

    it('handles zero tasks gracefully', async () => {
      StudyPlan.findAll.mockResolvedValue([]);

      const result = await learningInsightsService.getStudyVelocity(
        'user-1',
        new Date(Date.now() - 30 * 86400000)
      );

      expect(result.totalTasksPlanned).toBe(0);
      expect(result.totalTasksCompleted).toBe(0);
      expect(result.tasksPerDay).toBe(0);
      expect(result.completionRate).toBe(0);
    });

    it('includes sparkline data sorted by date', async () => {
      const goals = [
        {
          date: '2026-08-25',
          tasks: [{ _id: 't1', completed: true }],
        },
        {
          date: '2026-08-26',
          tasks: [{ _id: 't2', completed: true }, { _id: 't3', completed: false }],
        },
      ];

      StudyPlan.findAll.mockResolvedValue([
        { id: 'plan-1', dailyGoals: goals },
      ]);

      const result = await learningInsightsService.getStudyVelocity(
        'user-1',
        new Date('2026-08-20')
      );

      expect(result.sparkline.length).toBe(2);
      expect(result.sparkline[0].date).toBe('2026-08-25');
      expect(result.sparkline[0].completed).toBe(1);
      expect(result.sparkline[1].date).toBe('2026-08-26');
      expect(result.sparkline[1].planned).toBe(2);
    });
  });

  describe('getStudyTimeDistribution', () => {
    it('aggregates time from focus sessions and quiz attempts', async () => {
      FocusSession.findAll.mockResolvedValue([
        { id: 'fs-1', duration: 1800, type: 'pomodoro', createdAt: makeDate(3) },
        { id: 'fs-2', duration: 3600, type: 'deep_work', createdAt: makeDate(1) },
      ]);
      QuizAttempt.findAll.mockResolvedValue([
        { id: 'qa-1', timeSpent: 600, createdAt: makeDate(2) },
        { id: 'qa-2', timeSpent: 900, createdAt: makeDate(1) },
      ]);

      const result = await learningInsightsService.getStudyTimeDistribution(
        'user-1',
        new Date(Date.now() - 30 * 86400000)
      );

      // Focus: (1800+3600)/3600 = 1.5h; Quiz: (600+900)/3600 = 0.42h
      expect(result.focusSessionTimeHours).toBeCloseTo(1.5, 1);
      expect(result.quizTimeHours).toBeCloseTo(0.42, 1);
      expect(result.focusSessionCount).toBe(2);
      expect(result.quizCount).toBe(2);
      expect(result.dailyDistribution.length).toBeGreaterThan(0);
    });

    it('returns zeros when no sessions or attempts exist', async () => {
      FocusSession.findAll.mockResolvedValue([]);
      QuizAttempt.findAll.mockResolvedValue([]);

      const result = await learningInsightsService.getStudyTimeDistribution(
        'user-1',
        new Date(Date.now() - 30 * 86400000)
      );

      expect(result.totalTimeHours).toBe(0);
      expect(result.avgSessionMinutes).toBe(0);
      expect(result.dailyDistribution).toEqual([]);
    });

    it('computes average session minutes correctly', async () => {
      FocusSession.findAll.mockResolvedValue([
        { id: 'fs-1', duration: 600, type: 'pomodoro', createdAt: makeDate(1) },
      ]);
      QuizAttempt.findAll.mockResolvedValue([
        { id: 'qa-1', timeSpent: 300, createdAt: makeDate(1) },
      ]);

      const result = await learningInsightsService.getStudyTimeDistribution(
        'user-1',
        new Date(Date.now() - 7 * 86400000)
      );

      // Total: 900s, 2 sessions -> 900/2/60 = 7.5 minutes
      expect(result.avgSessionMinutes).toBe(7.5);
    });
  });

  describe('getStreakData', () => {
    it('returns user streak data when user exists', async () => {
      User.findByPk.mockResolvedValue({
        id: 'user-1',
        streak: 5,
        longestStreak: 12,
        lastActiveDate: makeDate(0),
      });

      ActivityLog.findAll.mockResolvedValue([]);

      const result = await learningInsightsService.getStreakData('user-1');

      expect(result.currentStreak).toBe(5);
      expect(result.longestStreak).toBe(12);
      expect(result.lastActiveDate).toBeDefined();
    });

    it('computes current streak from activity logs', async () => {
      User.findByPk.mockResolvedValue({
        id: 'user-1',
        streak: 0,
        longestStreak: 0,
        lastActiveDate: null,
      });

      // Simulate activity on today and yesterday
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      ActivityLog.findAll.mockResolvedValue([
        { id: 'a1', activityType: 'quiz_complete', createdAt: today },
        { id: 'a2', activityType: 'task_complete', createdAt: yesterday },
      ]);

      const result = await learningInsightsService.getStreakData('user-1');

      expect(result.currentStreak).toBe(2);
    });

    it('returns safe defaults when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const result = await learningInsightsService.getStreakData('user-1');

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.streakHistory).toEqual([]);
    });
  });

  describe('getReadinessForecast', () => {
    it('returns no-plan message when no active plan exists', async () => {
      StudyPlan.findOne.mockResolvedValue(null);

      const result = await learningInsightsService.getReadinessForecast('user-1');

      expect(result.hasActivePlan).toBe(false);
      expect(result.recommendation).toContain('Create a study plan');
    });

    it('computes forecast with projected score for a student with data', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      StudyPlan.findOne.mockResolvedValue({
        id: 'plan-1',
        status: 'active',
        dailyGoals: [
          { tasks: [{ completed: true }, { completed: true }, { completed: false }] },
          { tasks: [{ completed: true }, { completed: true }] },
        ],
        examRef: { name: 'Final Exam', date: futureDate },
      });

      QuizAttempt.findAll.mockResolvedValue([
        { score: 75 },
        { score: 80 },
        { score: 70 },
      ]);

      const result = await learningInsightsService.getReadinessForecast('user-1');

      expect(result.hasActivePlan).toBe(true);
      expect(result.planCompletionRate).toBeCloseTo(80, 0);
      expect(result.completedTasks).toBe(4);
      expect(result.pendingTasks).toBe(1);
      expect(result.recentQuizAverage).toBe(75);
      expect(result.projectedExamScore).toBeGreaterThan(75);
      expect(result.daysUntilExam).toBeGreaterThan(10);
      expect(result.recommendation).toBeDefined();
    });

    it('provides low-completion recommendation for students with poor task completion', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      StudyPlan.findOne.mockResolvedValue({
        id: 'plan-2',
        status: 'active',
        dailyGoals: [
          { tasks: [{ completed: false }, { completed: false }, { completed: false }, { completed: false }, { completed: false }] },
        ],
        examRef: { name: 'Midterm', date: futureDate },
      });

      QuizAttempt.findAll.mockResolvedValue([]);

      const result = await learningInsightsService.getReadinessForecast('user-2');

      expect(result.planCompletionRate).toBe(0);
      expect(result.recommendation).toContain('low');
    });
  });

  describe('getComparativeReport', () => {
    it('detects improving week-over-week trend', async () => {
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);
      thisWeekStart.setHours(0, 0, 0, 0);

      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      // First call: this week; second call: last week
      QuizAttempt.findAll
        .mockResolvedValueOnce([
          { score: 85, timeSpent: 300, createdAt: makeDate(3) },
          { score: 90, timeSpent: 250, createdAt: makeDate(1) },
        ])
        .mockResolvedValueOnce([
          { score: 70, timeSpent: 200, createdAt: makeDate(10) },
          { score: 75, timeSpent: 180, createdAt: makeDate(8) },
        ]);

      const result = await learningInsightsService.getComparativeReport('user-1');

      expect(result.comparison.scoreDelta).toBeCloseTo(15, 0);
      expect(result.comparison.scoreTrend).toBe('improving');
    });

    it('detects declining trend when this week is worse', async () => {
      QuizAttempt.findAll
        .mockResolvedValueOnce([
          { score: 50, timeSpent: 100, createdAt: makeDate(3) },
        ])
        .mockResolvedValueOnce([
          { score: 80, timeSpent: 200, createdAt: makeDate(10) },
        ]);

      const result = await learningInsightsService.getComparativeReport('user-1');

      expect(result.comparison.scoreDelta).toBeCloseTo(-30, 0);
      expect(result.comparison.scoreTrend).toBe('declining');
    });

    it('returns insufficient_data when no quiz data exists', async () => {
      QuizAttempt.findAll.mockResolvedValue([]);

      const result = await learningInsightsService.getComparativeReport('user-1');

      expect(result.comparison.scoreTrend).toBe('insufficient_data');
      expect(result.comparison.summary).toContain('No quizzes');
    });
  });

  describe('getFullAnalytics', () => {
    it('returns composite payload with all sections', async () => {
      QuizAttempt.findAll.mockResolvedValue([]);
      Subject.findAll.mockResolvedValue([]);
      StudyPlan.findAll.mockResolvedValue([]);
      StudyPlan.findOne.mockResolvedValue(null);
      FocusSession.findAll.mockResolvedValue([]);
      User.findByPk.mockResolvedValue(null);
      ActivityLog.findAll.mockResolvedValue([]);

      const result = await learningInsightsService.getFullAnalytics('user-1', {
        windowDays: 14,
      });

      expect(result.windowDays).toBe(14);
      expect(result.generatedAt).toBeDefined();
      expect(result.quizPerformance).toBeDefined();
      expect(result.subjectMastery).toBeDefined();
      expect(result.studyVelocity).toBeDefined();
      expect(result.timeDistribution).toBeDefined();
      expect(result.streakData).toBeDefined();
      expect(result.readinessForecast).toBeDefined();
    });
  });

  describe('Private helper methods', () => {
    it('_median computes correct median for odd-length array', () => {
      expect(learningInsightsService._median([10, 20, 30])).toBe(20);
    });

    it('_median computes correct median for even-length array', () => {
      expect(learningInsightsService._median([10, 20, 30, 40])).toBe(25);
    });

    it('_standardDeviation returns 0 for identical values', () => {
      expect(learningInsightsService._standardDeviation([50, 50, 50])).toBe(0);
    });

    it('_standardDeviation returns positive for varied values', () => {
      const sd = learningInsightsService._standardDeviation([10, 20, 30, 40, 50]);
      expect(sd).toBeGreaterThan(0);
    });

    it('_recencyWeightedAverage weights recent entries higher', () => {
      const entries = [
        { score: 50, date: '2026-08-01' },
        { score: 100, date: '2026-08-10' },
      ];
      const result = learningInsightsService._recencyWeightedAverage(entries);
      // More recent entry (100) should pull the average above 75
      expect(result).toBeGreaterThan(75);
    });

    it('_emptyQuizPerformance returns zeroed structure', () => {
      const result = learningInsightsService._emptyQuizPerformance();
      expect(result.totalAttempts).toBe(0);
      expect(result.trend.direction).toBe('unknown');
      expect(result.dailyScores).toEqual([]);
    });

    it('_generateWeeklySummary handles no quizzes gracefully', () => {
      const summary = learningInsightsService._generateWeeklySummary(null, 0, 0);
      expect(summary).toContain('No quizzes');
    });

    it('_generateWeeklySummary handles improving scenario', () => {
      const summary = learningInsightsService._generateWeeklySummary(10, 600, 5);
      expect(summary).toContain('improved significantly');
      expect(summary).toContain('studied more');
      expect(summary).toContain('5 quizzes');
    });

    it('_generateWeeklySummary handles declining scenario', () => {
      const summary = learningInsightsService._generateWeeklySummary(-10, -600, 3);
      expect(summary).toContain('dropped noticeably');
      expect(summary).toContain('studied less');
    });

    it('_aggregateDailyScores groups by date correctly', () => {
      const attempts = [
        { score: 70, createdAt: new Date('2026-08-20T10:00:00Z') },
        { score: 80, createdAt: new Date('2026-08-20T14:00:00Z') },
        { score: 90, createdAt: new Date('2026-08-21T10:00:00Z') },
      ];

      const result = learningInsightsService._aggregateDailyScores(attempts);

      expect(result).toHaveLength(2);
      expect(result[0].count).toBe(2);
      expect(result[0].average).toBe(75);
      expect(result[1].count).toBe(1);
      expect(result[1].average).toBe(90);
    });
  });
});
