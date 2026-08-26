const quizRecommendationService = require('../../services/quizRecommendationService');
const { UserProgress, QuizAttempt, Quiz, ActivityLog } = require('../../models');

describe('AI Powered Quiz Recommendation Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserPerformanceProfile', () => {
    it('should compute topic accuracy, weak topics, and strong topics from UserProgress', async () => {
      const mockProgress = [
        { topic: 'Data Structures', percentage: 55, difficulty: 'medium', attemptedAt: new Date() },
        { topic: 'Data Structures', percentage: 65, difficulty: 'medium', attemptedAt: new Date() },
        { topic: 'Algorithms', percentage: 90, difficulty: 'hard', attemptedAt: new Date() },
        { topic: 'Algorithms', percentage: 85, difficulty: 'hard', attemptedAt: new Date() },
      ];

      vi.spyOn(UserProgress, 'findAll').mockResolvedValue(mockProgress);

      const profile = await quizRecommendationService.getUserPerformanceProfile('user-test-123');

      expect(profile.userId).toBe('user-test-123');
      expect(profile.totalAttempts).toBe(4);
      expect(profile.topicScores['Data Structures']).toBe(60);
      expect(profile.topicScores['Algorithms']).toBe(87.5);
      expect(profile.weakTopics.some((w) => w.topic === 'Data Structures')).toBe(true);
      expect(profile.strongTopics.some((s) => s.topic === 'Algorithms')).toBe(true);
    });

    it('should fallback gracefully when no progress records exist', async () => {
      vi.spyOn(UserProgress, 'findAll').mockResolvedValue([]);
      vi.spyOn(QuizAttempt, 'findAll').mockResolvedValue([]);

      const profile = await quizRecommendationService.getUserPerformanceProfile('user-empty');

      expect(profile.totalAttempts).toBe(0);
      expect(profile.overallAccuracy).toBe(75);
      expect(profile.weakTopics).toEqual([]);
    });
  });

  describe('getRecommendedQuizzes', () => {
    it('should boost quizzes matching user weak topics', async () => {
      vi.spyOn(UserProgress, 'findAll').mockResolvedValue([
        { topic: 'Data Structures', percentage: 50, difficulty: 'medium' },
      ]);
      vi.spyOn(Quiz, 'findAll').mockResolvedValue([]);

      const result = await quizRecommendationService.getRecommendedQuizzes('user-test-123', { limit: 3 });

      expect(result.recommendations.length).toBeGreaterThan(0);
      const topQuiz = result.recommendations[0];
      expect(topQuiz.topic).toBe('Data Structures');
      expect(topQuiz.recommendationScore).toBeGreaterThanOrEqual(90);
      expect(topQuiz.matchReason).toContain('weak topic');
    });

    it('should filter recommendations by timeBudget when provided', async () => {
      vi.spyOn(UserProgress, 'findAll').mockResolvedValue([]);
      vi.spyOn(Quiz, 'findAll').mockResolvedValue([]);

      const result = await quizRecommendationService.getRecommendedQuizzes('user-test-123', {
        timeBudget: 10,
        limit: 5,
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
      result.recommendations.forEach((q) => {
        expect(q.estimatedMinutes).toBeLessThanOrEqual(15);
      });
    });
  });

  describe('recordRecommendationHit', () => {
    it('should log recommendation hit event', async () => {
      vi.spyOn(ActivityLog, 'create').mockResolvedValue({ id: 'log-1' });

      const res = await quizRecommendationService.recordRecommendationHit('user-123', 'quiz-abc', {
        score: 95,
      });

      expect(res.success).toBe(true);
      expect(ActivityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: 'user-123',
          action: 'RECOMMENDATION_HIT',
          details: expect.objectContaining({ quizId: 'quiz-abc' }),
        })
      );
    });
  });
});
