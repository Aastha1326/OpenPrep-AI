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

vi.mock('../../models/User');
vi.mock('../../models/UserBadge');
vi.mock('../../models/QuizAttempt');
vi.mock('../../services/cacheService', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(true),
}));

describe('Gamification Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    test('should maintain the streak when activity occurs on the next local calendar day', async () => {
      const mockUser = {
        id: 'user-123',
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: new Date().toISOString().split('T')[0],
        streakFreezesAvailable: 0,
        save: vi.fn(),
      };

      User.findByPk.mockResolvedValue(mockUser);

      const result = await updateStreak('user-123', 0);

      expect(mockUser.currentStreak).toBe(5);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.currentStreak).toBe(5);
    });

    test('should consume one freeze after exactly one missed study day', async () => {
      const now = new Date();
      const previousStudyDay = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 2)
      );

      const mockUser = {
        id: 'user-123',
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: previousStudyDay.toISOString().split('T')[0],
        streakFreezesAvailable: 1,
        save: vi.fn(),
      };

      User.findByPk.mockResolvedValue(mockUser);

      const result = await updateStreak('user-123', 0);

      expect(mockUser.streakFreezesAvailable).toBe(0);
      expect(mockUser.currentStreak).toBe(6);
      expect(result.streakFreezesAvailable).toBe(0);
    });

    test('should reset the streak when more than one study day was missed', async () => {
      const now = new Date();
      const previousStudyDay = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 3)
      );

      const mockUser = {
        id: 'user-123',
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: previousStudyDay.toISOString().split('T')[0],
        streakFreezesAvailable: 1,
        save: vi.fn(),
      };

      User.findByPk.mockResolvedValue(mockUser);

      const result = await updateStreak('user-123', 0);

      expect(mockUser.streakFreezesAvailable).toBe(1);
      expect(mockUser.currentStreak).toBe(1);
      expect(result.currentStreak).toBe(1);
    });
  });

  describe('Hourly XP Cap & Exploit Protection', () => {
    test('should allow XP awards under hourly limit', async () => {
      const mockUser = {
        id: 'user-123',
        xp: 100,
        level: 1,
        save: vi.fn(),
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
        save: vi.fn(),
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

  // These two had been dropped into the middle of the level/XP block, splitting
  // the calculateLevel and getNextLevelXP assertions apart. They belong here.
  describe('Badge Unlocking', () => {
    test('should unlock the 30-day streak badge and award one freeze', async () => {
      const mockUser = {
        id: 'user-123',
        currentStreak: 30,
        streakFreezesAvailable: 0,
        save: vi.fn(),
      };

      UserBadge.findOne.mockResolvedValue(null);
      UserBadge.create.mockResolvedValue({
        id: 'badge-30',
        badgeCode: 'thirty_day_streak',
      });

      const result = await checkAndUnlockBadges(mockUser, 'streak_check');

      expect(UserBadge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          badgeCode: 'thirty_day_streak',
        })
      );

      expect(mockUser.streakFreezesAvailable).toBeGreaterThanOrEqual(1);
      expect(result.some((badge) => badge.badgeCode === 'thirty_day_streak')).toBe(true);
    });

    test('should unlock the 100-day streak badge', async () => {
      const mockUser = {
        id: 'user-123',
        currentStreak: 100,
        streakFreezesAvailable: 0,
        save: vi.fn(),
      };

      UserBadge.findOne.mockResolvedValue(null);
      UserBadge.create.mockResolvedValue({
        id: 'badge-100',
        badgeCode: 'hundred_day_streak',
      });

      const result = await checkAndUnlockBadges(mockUser, 'streak_check');

      expect(result.some((badge) => badge.badgeCode === 'hundred_day_streak')).toBe(true);
    });
  });
});
