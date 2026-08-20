const { calculateSubjectReadiness } = require('../../services/readinessCalculator');
const models = require('../../models');

vi.mock('../../models', () => ({
  Topic: { findAll: vi.fn() },
  Progress: { findAll: vi.fn() },
  QuizAttempt: { findAll: vi.fn() },
  Flashcard: { findAll: vi.fn() },
  StudyPlan: { findOne: vi.fn() },
  Subject: { findAll: vi.fn() },
}));

describe('Exam Readiness Engine Unit & Data Structure Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('ERI Weightage Calculations', () => {
    it('accurately computes 30% Syllabus, 30% Quiz, 25% Memory, 15% Velocity formula', async () => {
      vi.spyOn(models.Topic, 'findAll').mockResolvedValue([{ id: 't-1' }]);
      vi.spyOn(models.Progress, 'findAll').mockResolvedValue([{ topic: 't-1', completionPercentage: 100 }]);
      vi.spyOn(models.QuizAttempt, 'findAll').mockResolvedValue([{ score: 10, totalQuestions: 10 }]);
      vi.spyOn(models.Flashcard, 'findAll').mockResolvedValue([{ efactor: 3.0, repetitions: 5 }]);
      vi.spyOn(models.StudyPlan, 'findOne').mockResolvedValue({
        dailyGoals: [{ completed: true }],
      });

      const metrics = await calculateSubjectReadiness('u-1', 's-1');

      // Syllabus: 100 * 0.3 = 30
      // Quiz: 100 * 0.3 = 30
      // Memory: 100 * 0.25 = 25
      // Velocity: 100 * 0.15 = 15
      // ERI Total = 100%
      expect(metrics.syllabusCoverage).toBe(100);
      expect(metrics.quizAccuracy).toBe(100);
      expect(metrics.memoryRetention).toBe(100);
      expect(metrics.studyVelocity).toBe(100);
      expect(metrics.readinessScore).toBe(100);
    });

    it('handles new user with 0 quizzes gracefully (0% accuracy, default 50% velocity)', async () => {
      vi.spyOn(models.Topic, 'findAll').mockResolvedValue([]);
      vi.spyOn(models.Progress, 'findAll').mockResolvedValue([]);
      vi.spyOn(models.QuizAttempt, 'findAll').mockResolvedValue([]);
      vi.spyOn(models.Flashcard, 'findAll').mockResolvedValue([]);
      vi.spyOn(models.StudyPlan, 'findOne').mockResolvedValue(null);

      const metrics = await calculateSubjectReadiness('u-new', 's-new');

      expect(metrics.syllabusCoverage).toBe(0);
      expect(metrics.quizAccuracy).toBe(0);
      expect(metrics.memoryRetention).toBe(0);
      expect(metrics.studyVelocity).toBe(50);
      expect(metrics.readinessScore).toBe(8); // 50 * 0.15 = 7.5 -> 8%
    });
  });
});
