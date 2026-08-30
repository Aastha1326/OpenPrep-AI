const {
  getDifficultyRating,
  getDifficultyFromSkill,
  calculateSkillScore,
  recordAnswerAndAdjustSkill,
  DIFFICULTY_RATINGS,
} = require('../../src/services/adaptive');

describe('Adaptive Difficulty Engine Service', () => {
  describe('getDifficultyRating', () => {
    it('returns Elo ratings for valid difficulty string names', () => {
      expect(getDifficultyRating('Easy')).toBe(800);
      expect(getDifficultyRating('Medium')).toBe(1000);
      expect(getDifficultyRating('Hard')).toBe(1200);
    });

    it('defaults to Medium rating when invalid or undefined difficulty is passed', () => {
      expect(getDifficultyRating(null)).toBe(1000);
      expect(getDifficultyRating('Unknown')).toBe(1000);
    });
  });

  describe('getDifficultyFromSkill', () => {
    it('categorizes skill score into Easy, Medium, and Hard tiers', () => {
      expect(getDifficultyFromSkill(750)).toBe('Easy');
      expect(getDifficultyFromSkill(899)).toBe('Easy');
      expect(getDifficultyFromSkill(1000)).toBe('Medium');
      expect(getDifficultyFromSkill(1150)).toBe('Medium');
      expect(getDifficultyFromSkill(1200)).toBe('Hard');
    });

    it('handles undefined or null skill score with default Medium tier', () => {
      expect(getDifficultyFromSkill(undefined)).toBe('Medium');
      expect(getDifficultyFromSkill(null)).toBe('Medium');
    });
  });

  describe('calculateSkillScore', () => {
    it('increases skill score when user correctly answers a question', () => {
      const initialScore = 1000;
      const newScore = calculateSkillScore(initialScore, {
        difficulty: 'Medium',
        isCorrect: true,
      });

      expect(newScore).toBeGreaterThan(initialScore);
      expect(newScore).toBe(1016);
    });

    it('decreases skill score when user incorrectly answers a question', () => {
      const initialScore = 1000;
      const newScore = calculateSkillScore(initialScore, {
        difficulty: 'Medium',
        isCorrect: false,
      });

      expect(newScore).toBeLessThan(initialScore);
      expect(newScore).toBe(984);
    });

    it('gives a larger reward for correctly answering a Hard question', () => {
      const initialScore = 1000;
      const easyGain = calculateSkillScore(initialScore, { difficulty: 'Easy', isCorrect: true }) - initialScore;
      const hardGain = calculateSkillScore(initialScore, { difficulty: 'Hard', isCorrect: true }) - initialScore;

      expect(hardGain).toBeGreaterThan(easyGain);
    });
  });

  describe('recordAnswerAndAdjustSkill', () => {
    it('updates user object attributes and caps history length to 20', async () => {
      const mockUser = {
        skillScore: 1000,
        recentAnswerHistory: [],
        save: vi.fn().mockResolvedValue(true),
      };

      for (let i = 0; i < 25; i++) {
        await recordAnswerAndAdjustSkill(mockUser, {
          questionId: `q-${i}`,
          difficulty: 'Medium',
          isCorrect: i % 2 === 0,
        });
      }

      expect(mockUser.recentAnswerHistory.length).toBe(20);
      expect(mockUser.save).toHaveBeenCalledTimes(25);
      expect(mockUser.skillScore).toBeDefined();
    });
  });
});
