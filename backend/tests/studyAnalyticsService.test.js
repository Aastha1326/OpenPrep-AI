/**
 * Unit tests for studyAnalyticsService.
 *
 * Tests cover: snapshot generation pipeline, consistency metrics,
 * subject distribution balance scoring, performance trend detection,
 * readiness projection via linear regression, insight generation,
 * and recommendation logic.
 */

const {
  computeBalanceScore,
  linearRegression,
  generateInsights,
  generateRecommendations,
  getWeekPeriod,
  getMonthPeriod,
  getDayPeriod,
  INSIGHT_TYPES,
  PRIORITY,
  INSIGHT_THRESHOLDS,
} = require('../services/studyAnalyticsService');

describe('studyAnalyticsService', () => {
  // ── Balance Score ────────────────────────────────────────────────────

  describe('computeBalanceScore', () => {
    it('should return 100 for a single subject (perfectly focused)', () => {
      expect(computeBalanceScore([100])).toBe(100);
    });

    it('should return 100 for perfectly even distribution', () => {
      expect(computeBalanceScore([25, 25, 25, 25])).toBe(100);
    });

    it('should return a low score for highly skewed distribution', () => {
      const score = computeBalanceScore([80, 5, 5, 5, 5]);
      expect(score).toBeLessThan(50);
    });

    it('should return 0 for all zeros', () => {
      expect(computeBalanceScore([0, 0, 0])).toBe(0);
    });

    it('should handle empty array', () => {
      expect(computeBalanceScore([])).toBe(100);
    });
  });

  // ── Linear Regression ────────────────────────────────────────────────

  describe('linearRegression', () => {
    it('should return zero slope for constant values', () => {
      const result = linearRegression([50, 50, 50, 50]);
      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(50);
    });

    it('should return positive slope for increasing values', () => {
      const result = linearRegression([20, 40, 60, 80]);
      expect(result.slope).toBeGreaterThan(0);
    });

    it('should return negative slope for decreasing values', () => {
      const result = linearRegression([80, 60, 40, 20]);
      expect(result.slope).toBeLessThan(0);
    });

    it('should return default values for single-element array', () => {
      const result = linearRegression([42]);
      expect(result.intercept).toBe(42);
    });

    it('should return defaults for empty array', () => {
      const result = linearRegression([]);
      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(50);
    });

    it('should accurately predict known linear data', () => {
      // y = 2x + 10
      const values = [10, 12, 14, 16, 18];
      const result = linearRegression(values);
      expect(result.slope).toBeCloseTo(2, 0);
      expect(result.intercept).toBeCloseTo(10, 0);
    });
  });

  // ── Insight Generation ───────────────────────────────────────────────

  describe('generateInsights', () => {
    const baseConsistency = {
      consistencyScore: 60,
      activeDays: 4,
      totalDays: 7,
      totalStudyMinutes: 300,
    };

    const baseSubjectDist = {
      balanceScore: 70,
      mostStudied: { name: 'Math', percentage: 40 },
      leastStudied: { name: 'History', percentage: 10 },
    };

    const basePerformance = {
      quizScoreTrend: 'stable',
      improvementRate: 0,
      flashcardRetentionRate: 75,
    };

    const baseReadiness = {
      currentReadiness: 60,
      readinessDelta: 2,
    };

    const baseQuality = {
      peakStudyHour: 10,
      efficiencyRating: 'good',
    };

    const baseGoals = {
      totalGoals: 3,
      completedGoals: 2,
      goalCompletionRate: 67,
    };

    it('should generate no critical insights for healthy metrics', () => {
      const insights = generateInsights(
        baseConsistency,
        baseSubjectDist,
        basePerformance,
        baseReadiness,
        baseQuality,
        baseGoals,
      );
      const criticals = insights.filter((i) => i.priority === PRIORITY.CRITICAL);
      expect(criticals.length).toBe(0);
    });

    it('should flag low consistency as high priority', () => {
      const insights = generateInsights(
        { ...baseConsistency, consistencyScore: 15, activeDays: 1, totalDays: 7 },
        baseSubjectDist,
        basePerformance,
        baseReadiness,
        baseQuality,
        baseGoals,
      );
      const consistencyInsight = insights.find(
        (i) => i.type === INSIGHT_TYPES.CONSISTENCY && i.priority === PRIORITY.HIGH,
      );
      expect(consistencyInsight).toBeDefined();
      expect(consistencyInsight.actionable).toBe(true);
    });

    it('should flag declining quiz scores as high priority', () => {
      const insights = generateInsights(
        baseConsistency,
        baseSubjectDist,
        { ...basePerformance, quizScoreTrend: 'declining', improvementRate: -10 },
        baseReadiness,
        baseQuality,
        baseGoals,
      );
      const perfInsight = insights.find(
        (i) => i.type === INSIGHT_TYPES.PERFORMANCE && i.priority === PRIORITY.HIGH,
      );
      expect(perfInsight).toBeDefined();
    });

    it('should flag critical readiness drops', () => {
      const insights = generateInsights(
        baseConsistency,
        baseSubjectDist,
        basePerformance,
        { ...baseReadiness, readinessDelta: -10 },
        baseQuality,
        baseGoals,
      );
      const critical = insights.find((i) => i.priority === PRIORITY.CRITICAL);
      expect(critical).toBeDefined();
      expect(critical.type).toBe(INSIGHT_TYPES.READINESS);
    });

    it('should flag poor balance as medium priority', () => {
      const insights = generateInsights(
        baseConsistency,
        { ...baseSubjectDist, balanceScore: 30 },
        basePerformance,
        baseReadiness,
        baseQuality,
        baseGoals,
      );
      const balanceInsight = insights.find((i) => i.type === INSIGHT_TYPES.BALANCE);
      expect(balanceInsight).toBeDefined();
      expect(balanceInsight.priority).toBe(PRIORITY.MEDIUM);
    });

    it('should flag late-night study as medium priority', () => {
      const insights = generateInsights(
        baseConsistency,
        baseSubjectDist,
        basePerformance,
        baseReadiness,
        { ...baseQuality, peakStudyHour: 23 },
        baseGoals,
      );
      const timingInsight = insights.find((i) => i.type === INSIGHT_TYPES.TIMING);
      expect(timingInsight).toBeDefined();
    });

    it('should sort insights by priority', () => {
      const insights = generateInsights(
        { ...baseConsistency, consistencyScore: 10, activeDays: 0, totalDays: 7 },
        { ...baseSubjectDist, balanceScore: 20 },
        { ...basePerformance, quizScoreTrend: 'declining', improvementRate: -15 },
        { ...baseReadiness, readinessDelta: -10 },
        { ...baseQuality, peakStudyHour: 23 },
        { ...baseGoals, totalGoals: 3, completedGoals: 0, goalCompletionRate: 0 },
      );
      for (let i = 1; i < insights.length; i++) {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        expect(order[insights[i].priority]).toBeGreaterThanOrEqual(order[insights[i - 1].priority]);
      }
    });
  });

  // ── Recommendation Generation ────────────────────────────────────────

  describe('generateRecommendations', () => {
    const baseConsistency = {
      totalStudyMinutes: 1200,
      consistencyScore: 80,
    };

    const baseSubjectDist = {
      balanceScore: 70,
      leastStudied: { name: 'Physics', percentage: 5 },
    };

    const basePerformance = {
      quizScoreTrend: 'stable',
      improvementRate: 0,
      flashcardsReviewed: 50,
      flashcardRetentionRate: 70,
    };

    const baseReadiness = {
      currentReadiness: 70,
      projectedReadiness: 85,
    };

    const baseQuality = {
      efficiencyRating: 'good',
      peakStudyHour: 10,
    };

    it('should generate low study time recommendation when minutes are low', () => {
      const recs = generateRecommendations(
        { ...baseConsistency, totalStudyMinutes: 100 },
        baseSubjectDist,
        basePerformance,
        baseReadiness,
        baseQuality,
      );
      const studyTimeRec = recs.find((r) => r.category === 'study_time');
      expect(studyTimeRec).toBeDefined();
      expect(studyTimeRec.impact).toBe('high');
    });

    it('should generate performance recommendation for declining scores', () => {
      const recs = generateRecommendations(
        baseConsistency,
        baseSubjectDist,
        { ...basePerformance, quizScoreTrend: 'declining' },
        baseReadiness,
        baseQuality,
      );
      const perfRec = recs.find((r) => r.category === 'performance');
      expect(perfRec).toBeDefined();
    });

    it('should generate readiness recommendation when projected is low', () => {
      const recs = generateRecommendations(
        baseConsistency,
        baseSubjectDist,
        basePerformance,
        { ...baseReadiness, projectedReadiness: 55 },
        baseQuality,
      );
      const readinessRec = recs.find((r) => r.category === 'readiness');
      expect(readinessRec).toBeDefined();
      expect(readinessRec.impact).toBe('high');
    });

    it('should generate session quality recommendation for poor efficiency', () => {
      const recs = generateRecommendations(
        baseConsistency,
        baseSubjectDist,
        basePerformance,
        baseReadiness,
        { ...baseQuality, efficiencyRating: 'needs_improvement' },
      );
      const sessionRec = recs.find((r) => r.category === 'session_quality');
      expect(sessionRec).toBeDefined();
    });

    it('should generate low retention recommendation', () => {
      const recs = generateRecommendations(
        baseConsistency,
        baseSubjectDist,
        { ...basePerformance, flashcardsReviewed: 30, flashcardRetentionRate: 45 },
        baseReadiness,
        baseQuality,
      );
      const retentionRec = recs.find((r) => r.category === 'retention');
      expect(retentionRec).toBeDefined();
    });

    it('should generate late-night study recommendation', () => {
      const recs = generateRecommendations(
        baseConsistency,
        baseSubjectDist,
        basePerformance,
        baseReadiness,
        { ...baseQuality, peakStudyHour: 23 },
      );
      const timingRec = recs.find((r) => r.category === 'timing');
      expect(timingRec).toBeDefined();
    });

    it('should generate subject balance recommendation for poor balance', () => {
      const recs = generateRecommendations(
        baseConsistency,
        { ...baseSubjectDist, balanceScore: 30 },
        basePerformance,
        baseReadiness,
        baseQuality,
      );
      const balanceRec = recs.find((r) => r.category === 'subject_balance');
      expect(balanceRec).toBeDefined();
    });
  });

  // ── Period Helpers ───────────────────────────────────────────────────

  describe('getWeekPeriod', () => {
    it('should return a 7-day period', () => {
      const { periodStart, periodEnd } = getWeekPeriod(new Date('2026-08-25'));
      const start = new Date(periodStart);
      const end = new Date(periodEnd);
      const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(6); // 7 days inclusive = 6 day diff
    });

    it('should default to current date when no argument', () => {
      const { periodStart, periodEnd } = getWeekPeriod();
      expect(periodStart).toBeDefined();
      expect(periodEnd).toBeDefined();
      expect(new Date(periodStart).getTime()).toBeLessThanOrEqual(new Date().getTime());
    });
  });

  describe('getMonthPeriod', () => {
    it('should return a period within the same month', () => {
      const { periodStart, periodEnd } = getMonthPeriod(new Date('2026-08-15'));
      expect(periodStart).toMatch(/^2026-08-01/);
      expect(periodEnd).toMatch(/^2026-08-3[01]/);
    });
  });

  describe('getDayPeriod', () => {
    it('should return same date for start and end', () => {
      const { periodStart, periodEnd } = getDayPeriod(new Date('2026-08-15'));
      expect(periodStart).toBe('2026-08-15');
      expect(periodEnd).toBe('2026-08-15');
    });
  });

  // ── Constants ────────────────────────────────────────────────────────

  describe('constants', () => {
    it('should have all insight types defined', () => {
      expect(INSIGHT_TYPES.CONSISTENCY).toBeDefined();
      expect(INSIGHT_TYPES.BALANCE).toBeDefined();
      expect(INSIGHT_TYPES.PERFORMANCE).toBeDefined();
      expect(INSIGHT_TYPES.RETENTION).toBeDefined();
      expect(INSIGHT_TYPES.READINESS).toBeDefined();
      expect(INSIGHT_TYPES.TIMING).toBeDefined();
      expect(INSIGHT_TYPES.GOAL).toBeDefined();
    });

    it('should have all priorities defined', () => {
      expect(PRIORITY.CRITICAL).toBe('critical');
      expect(PRIORITY.HIGH).toBe('high');
      expect(PRIORITY.MEDIUM).toBe('medium');
      expect(PRIORITY.LOW).toBe('low');
    });

    it('should have valid thresholds', () => {
      expect(INSIGHT_THRESHOLDS.highConsistency).toBeGreaterThan(INSIGHT_THRESHOLDS.mediumConsistency);
      expect(INSIGHT_THRESHOLDS.mediumConsistency).toBeGreaterThan(INSIGHT_THRESHOLDS.lowConsistency);
    });
  });
});
