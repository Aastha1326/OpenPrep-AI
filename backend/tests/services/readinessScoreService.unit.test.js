const {
  calculateBurndownData,
  calculateReadinessScore,
} = require('../../services/readinessScoreService');
const StudyPlan = require('../../models/StudyPlan');

describe('Syllabus Coverage Tracker & AI Readiness Score Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateBurndownData', () => {
    it('calculates burn-down points, trailing velocity, and recommended study hours', async () => {
      const mockPlan = {
        id: 'plan-1',
        user: 'user-1',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        targetExamDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days left
        tasks: [
          { id: 1, completed: true },
          { id: 2, completed: true },
          { id: 3, completed: true },
          { id: 4, completed: false },
          { id: 5, completed: false },
        ],
      };

      vi.spyOn(StudyPlan, 'findOne').mockResolvedValue(mockPlan);

      const burndown = await calculateBurndownData('plan-1', 'user-1');

      expect(burndown).toHaveProperty('totalTasks', 5);
      expect(burndown).toHaveProperty('completedTasks', 3);
      expect(burndown).toHaveProperty('remainingTasks', 2);
      expect(burndown).toHaveProperty('trailingVelocity');
      expect(burndown).toHaveProperty('recommendedStudyHoursPerDay');
      expect(burndown.burndownPoints.length).toBeGreaterThan(0);
    });

    it('throws error if study plan is not found', async () => {
      vi.spyOn(StudyPlan, 'findOne').mockResolvedValue(null);

      await expect(calculateBurndownData('missing-plan', 'user-1')).rejects.toThrow('Study plan not found');
    });
  });

  describe('calculateReadinessScore', () => {
    it('returns synthesized readiness score and recommendations', async () => {
      const mockPlan = {
        id: 'plan-2',
        user: 'user-2',
        subject: 'sub-123',
        createdAt: new Date(),
        targetExamDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        tasks: [{ id: 1, completed: true }, { id: 2, completed: false }],
      };

      vi.spyOn(StudyPlan, 'findOne').mockResolvedValue(mockPlan);

      const scoreData = await calculateReadinessScore('plan-2', 'user-2');

      expect(scoreData).toHaveProperty('readinessScore');
      expect(scoreData).toHaveProperty('syllabusCoverage');
      expect(scoreData).toHaveProperty('recommendations');
      expect(Array.isArray(scoreData.recommendations)).toBe(true);
    });
  });
});
