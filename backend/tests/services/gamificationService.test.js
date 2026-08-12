const {
  calculateLevel,
  getNextLevelXP,
  awardXP,
  updateStreak,
  checkAndUnlockBadges,
} = require('../../services/gamificationService');

const User = require('../../models/User');
const UserBadge = require('../../models/UserBadge');
const QuizAttempt = require('../../models/QuizAttempt');

jest.mock('../../models/User');
jest.mock('../../models/UserBadge');
jest.mock('../../models/QuizAttempt');
jest.mock('../../services/cacheService', () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
}));

describe('Gamification Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Level & XP Calculation Formulas', () => {
    test('calculateLevel should follow the square root formula correctly', () => {
      // level = Math.floor(Math.sqrt(xp / 100)) + 1
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(50)).toBe(1);
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(399)).toBe(2);
      expect(calculateLevel(400)).toBe(3);
      expect(calculateLevel(900)).toBe(4);
    });

    test('getNextLevelXP should return correct thresholds', () => {
      // nextLevelXP = L^2 * 100
      expect(getNextLevelXP(1)).toBe(100);
      expect(getNextLevelXP(2)).toBe(400);
      expect(getNextLevelXP(3)).toBe(900);
    });
  });

  describe('Streak Update Calculations', () => {
    test('should start streak at 1 if no previous activity exists', async () => {
      const mockUser = {
        id: 'user-123',
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        streakFreezesAvailable: 0,
        save: jest.fn(),
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await updateStreak('user-123', 0);
      expect(mockUser.currentStreak).toBe(1);
      expect(mockUser.longestStreak).toBe(1);
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('should increment streak by 1 if activity completed in 24-48 hours window', async () => {
      const yesterday = new Date(Date.now() - 30 * 60 * 60 * 1000); // 30 hours ago
      const mockUser = {
        id: 'user-123',
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: yesterday.toISOString(),
        streakFreezesAvailable: 0,
        save: jest.fn(),
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await updateStreak('user-123', 0);
      expect(mockUser.currentStreak).toBe(6);
      expect(mockUser.longestStreak).toBe(6);
    });

    test('should maintain streak if activity completed in under 24 hours', async () => {
      const recent = new Date(Date.now() - 10 * 60 * 60 * 1000); // 10 hours ago
      const mockUser = {
        id: 'user-123',
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: recent.toISOString(),
        streakFreezesAvailable: 0,
        save: jest.fn(),
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await updateStreak('user-123', 0);
      expect(mockUser.currentStreak).toBe(5);
    });

    test('should reset streak to 1 if >48 hours elapse and no streak freeze is available', async () => {
      const past = new Date(Date.now() - 60 * 60 * 1000 * 72); // 72 hours ago
      const mockUser = {
        id: 'user-123',
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: past.toISOString(),
        streakFreezesAvailable: 0,
        save: jest.fn(),
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await updateStreak('user-123', 0);
      expect(mockUser.currentStreak).toBe(1);
    });

    test('should consume freeze token and maintain streak if >48 hours elapse and freeze is available', async () => {
      const past = new Date(Date.now() - 60 * 60 * 1000 * 72); // 72 hours ago
      const mockUser = {
        id: 'user-123',
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: past.toISOString(),
        streakFreezesAvailable: 2,
        save: jest.fn(),
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await updateStreak('user-123', 0);
      expect(mockUser.streakFreezesAvailable).toBe(1);
      expect(mockUser.currentStreak).toBe(6); // continues from previous streak (+1)
    });
  });

  describe('Hourly XP Cap & Exploit Protection', () => {
    test('should allow XP awards under hourly limit', async () => {
      const mockUser = {
        id: 'user-123',
        xp: 100,
        level: 1,
        save: jest.fn(),
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await awardXP('user-123', 50, 'task_complete');
      expect(result.xp).toBe(150);
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('should cap and reject XP awards if hourly cap of 500 XP is exceeded', async () => {
      const mockUser = {
        id: 'user-123',
        xp: 100,
        level: 1,
        save: jest.fn(),
      };
      User.findByPk.mockResolvedValue(mockUser);

      // Mock cache returning 500 XP already earned in the current hour
      const cacheService = require('../../services/cacheService');
      cacheService.get.mockResolvedValueOnce('500');

      const result = await awardXP('user-123', 100, 'task_complete');
      expect(result.xp).toBe(100); // XP unchanged
      expect(result.message).toBe('Hourly XP limit reached');
    });
  });
});
