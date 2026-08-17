vi.mock('../../models', () => ({
  User: {
    findByPk: vi.fn(),
  },
  UserBadge: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
  QuizAttempt: {
    findAll: vi.fn(),
  },
  SquadMember: {},
  SquadChallenge: {
    findAll: vi.fn(),
  },
  SquadChallengeContribution: {
    findAll: vi.fn(),
  },
  SquadAchievement: {
    findOrCreate: vi.fn(),
  },
}));

const {
  calculateLevel,
  getNextLevelXP,
  awardXP,
  updateStreak,
  checkAndUnlockBadges,
} = require('../../services/gamificationService');

const models = require('../../models');
const cacheService = require('../../services/cacheService');

vi.mock('../../services/notificationService', () => ({
  createNotification: vi.fn().mockResolvedValue({}),
}));

describe('Gamification Service Unit Tests', () => {
  let userSpy, badgeFindSpy, badgeCreateSpy, squadMemberSpy, squadChallengeSpy, squadContribSpy, cacheGetSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    userSpy = vi.spyOn(models.User, 'findByPk').mockResolvedValue(null);
    badgeFindSpy = vi.spyOn(models.UserBadge, 'findOne').mockResolvedValue(null);
    badgeCreateSpy = vi.spyOn(models.UserBadge, 'create').mockResolvedValue({});
    vi.spyOn(models.QuizAttempt, 'count').mockResolvedValue(0);

    squadMemberSpy = vi.spyOn(models.SquadMember, 'findAll').mockResolvedValue([]);
    squadChallengeSpy = vi.spyOn(models.SquadChallenge, 'findAll').mockResolvedValue([]);
    squadContribSpy = vi.spyOn(models.SquadChallengeContribution, 'findOrCreate').mockResolvedValue([{}, false]);

    vi.spyOn(models.Notification, 'create').mockResolvedValue({});
    vi.spyOn(models.PushSubscription, 'findAll').mockResolvedValue([]);

    cacheGetSpy = vi.spyOn(cacheService, 'get').mockResolvedValue(null);
    vi.spyOn(cacheService, 'set').mockResolvedValue(true);
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

      userSpy.mockResolvedValue(mockUser);

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

      userSpy.mockResolvedValue(mockUser);

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

      userSpy.mockResolvedValue(mockUser);

      const result = await updateStreak('user-123', 0);

      expect(mockUser.streakFreezesAvailable).toBe(1);
      expect(mockUser.currentStreak).toBe(1);
      expect(result.currentStreak).toBe(1);
    });

    test('should adjust calculations based on local timezone offsets', async () => {
      // Create user studying at 23:30 (11:30 PM) UTC.
      // In timezone offset of -120 (UTC+2), local time is next day 01:30 (1:30 AM).
      // Last active date was UTC today.
      const now = new Date(Date.UTC(2026, 7, 17, 23, 30, 0));
      const lastActivityDate = '2026-08-17'; // user studied earlier on August 17

      const mockUser = {
        id: 'user-123',
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate,
        streakFreezesAvailable: 0,
        save: vi.fn(),
      };

      userSpy.mockResolvedValue(mockUser);

      // System date needs to be mocked or we can temporarily override global Date constructor or mock `now` in Date.
      // Since updateStreak does `const now = new Date();`, we can mock the Date constructor or mock Date.now()
      const originalDate = global.Date;
      try {
        global.Date = class extends originalDate {
          constructor(...args) {
            if (args.length === 0) {
              return new originalDate(now.getTime());
            }
            return new originalDate(...args);
          }
        };

        // Timezone offset -120 translates to UTC+2.
        // UTC time: 2026-08-17 23:30:00 -> minus -120 min = plus 2 hours -> 2026-08-18 01:30:00.
        // Therefore, local date is 2026-08-18. Since lastActivityDate was 2026-08-17, this is consecutive!
        const result = await updateStreak('user-123', -120);

        expect(mockUser.currentStreak).toBe(6);
        expect(mockUser.lastActivityDate).toBe('2026-08-18');
      } finally {
        global.Date = originalDate;
      }
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
      userSpy.mockResolvedValue(mockUser);

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
      userSpy.mockResolvedValue(mockUser);

      // Mock cache returning 500 XP already earned in the current hour
      cacheGetSpy.mockResolvedValueOnce('500');

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

      badgeFindSpy.mockResolvedValue(null);
      badgeCreateSpy.mockResolvedValue({
        id: 'badge-30',
        badgeCode: 'thirty_day_streak',
      });

      const result = await checkAndUnlockBadges(mockUser, 'streak_check');

      expect(badgeCreateSpy).toHaveBeenCalledWith(
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

      badgeFindSpy.mockResolvedValue(null);
      badgeCreateSpy.mockResolvedValue({
        id: 'badge-100',
        badgeCode: 'hundred_day_streak',
      });

      const result = await checkAndUnlockBadges(mockUser, 'streak_check');

      expect(result.some((badge) => badge.badgeCode === 'hundred_day_streak')).toBe(true);
    });
  });
});
