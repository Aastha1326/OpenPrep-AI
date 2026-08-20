const models = require('../../models');

vi.mock('../../services/achievementService', () => ({
  checkAndAwardBadges: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../services/notificationService', () => ({
  createNotification: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../models', () => ({
  User: {
    findByPk: vi.fn(),
  },
  UserBadge: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
  QuizAttempt: {
    count: vi.fn(),
    findAll: vi.fn(),
  },
  SquadMember: {
    findAll: vi.fn(),
  },
  SquadChallenge: {
    findAll: vi.fn(),
  },
  SquadChallengeContribution: {
    findOrCreate: vi.fn(),
  },
  SquadAchievement: {
    findOrCreate: vi.fn(),
  },
  Notification: {
    create: vi.fn(),
  },
  PushSubscription: {
    findAll: vi.fn(),
  },
}));

const {
  calculateLevel,
  getNextLevelXP,
  awardXP,
  updateStreak,
  checkAndUnlockBadges,
} = require('../../services/gamificationService');

describe('Gamification System Edge Case & Formula Unit Tests', () => {
  let userSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    userSpy = vi.spyOn(models.User, 'findByPk').mockResolvedValue(null);
    vi.spyOn(models.UserBadge, 'findOne').mockResolvedValue(null);
    vi.spyOn(models.UserBadge, 'create').mockResolvedValue({});
    vi.spyOn(models.QuizAttempt, 'count').mockResolvedValue(0);
    vi.spyOn(models.SquadMember, 'findAll').mockResolvedValue([]);
    vi.spyOn(models.SquadChallenge, 'findAll').mockResolvedValue([]);
    vi.spyOn(models.SquadChallengeContribution, 'findOrCreate').mockResolvedValue([{}, false]);
  });

  describe('Level Formula & Progression Thresholds', () => {
    it('calculates level accurately according to level = Math.floor(Math.sqrt(xp / 100)) + 1', () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(99)).toBe(1);
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(399)).toBe(2);
      expect(calculateLevel(400)).toBe(3);
      expect(calculateLevel(899)).toBe(3);
      expect(calculateLevel(900)).toBe(4);
      expect(calculateLevel(8100)).toBe(10); // Level 10 "Exam Scholar"
    });

    it('calculates nextLevelXP accurately according to L^2 * 100', () => {
      expect(getNextLevelXP(1)).toBe(100);
      expect(getNextLevelXP(2)).toBe(400);
      expect(getNextLevelXP(3)).toBe(900);
      expect(getNextLevelXP(10)).toBe(10000);
    });
  });

  describe('Streak Calculation Across Leap Years and Calendar Day Rolls', () => {
    it('correctly increments streak across a leap year date boundary (Feb 28 to Feb 29)', async () => {
      const mockUser = {
        id: 'user-leap',
        currentStreak: 10,
        longestStreak: 10,
        lastActivityDate: '2024-02-28', // Leap year 2024
        streakFreezesAvailable: 0,
        save: vi.fn(),
      };
      userSpy.mockResolvedValue(mockUser);

      // Mock system date to Feb 29, 2024
      const leapDay = new Date(Date.UTC(2024, 1, 29, 12, 0, 0));
      const originalDate = global.Date;
      try {
        global.Date = class extends originalDate {
          constructor(...args) {
            if (args.length === 0) return new originalDate(leapDay.getTime());
            return new originalDate(...args);
          }
        };

        const result = await updateStreak('user-leap', 0);
        expect(mockUser.currentStreak).toBe(11);
        expect(mockUser.lastActivityDate).toBe('2024-02-29');
        expect(result.currentStreak).toBe(11);
      } finally {
        global.Date = originalDate;
      }
    });

    it('correctly increments streak across month boundary (Jan 31 to Feb 1)', async () => {
      const mockUser = {
        id: 'user-month',
        currentStreak: 3,
        longestStreak: 3,
        lastActivityDate: '2026-01-31',
        streakFreezesAvailable: 0,
        save: vi.fn(),
      };
      userSpy.mockResolvedValue(mockUser);

      const febFirst = new Date(Date.UTC(2026, 1, 1, 10, 0, 0));
      const originalDate = global.Date;
      try {
        global.Date = class extends originalDate {
          constructor(...args) {
            if (args.length === 0) return new originalDate(febFirst.getTime());
            return new originalDate(...args);
          }
        };

        const result = await updateStreak('user-month', 0);
        expect(mockUser.currentStreak).toBe(4);
        expect(mockUser.lastActivityDate).toBe('2026-02-01');
      } finally {
        global.Date = originalDate;
      }
    });
  });
});
