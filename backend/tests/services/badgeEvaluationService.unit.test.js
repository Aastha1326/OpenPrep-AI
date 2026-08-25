const { User, Badge, UserBadge, QuizAttempt, Flashcard, FocusSession, Note, Notification } = require('../../models');
const { evaluateAllUserBadges } = require('../../services/badgeEvaluationService');

describe('badgeEvaluationService Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('evaluates user metrics and awards eligible badges', async () => {
    const mockUser = {
      id: 'user-777',
      currentStreak: 10,
    };

    const mockBadges = [
      {
        id: 'week_warrior',
        name: 'Week Warrior',
        criteriaType: 'streak_days',
        criteriaThreshold: 7,
        toJSON: () => ({ id: 'week_warrior', name: 'Week Warrior' }),
      },
    ];

    vi.spyOn(Badge, 'findOrCreate').mockResolvedValue([mockBadges[0], false]);
    vi.spyOn(User, 'findAll').mockResolvedValue([mockUser]);
    vi.spyOn(Badge, 'findAll').mockResolvedValue(mockBadges);
    vi.spyOn(UserBadge, 'findAll').mockResolvedValue([]);
    const createBadgeSpy = vi.spyOn(UserBadge, 'create').mockResolvedValue({
      id: 'ub-1',
      userId: 'user-777',
      badgeCode: 'week_warrior',
      unlockedAt: new Date(),
    });
    vi.spyOn(Notification, 'create').mockResolvedValue({ id: 'n-1' });

    const awarded = await evaluateAllUserBadges('user-777');

    expect(createBadgeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-777',
        badgeCode: 'week_warrior',
      })
    );
    expect(awarded.length).toBe(1);
    expect(awarded[0].badge.id).toBe('week_warrior');
  });

  test('does not re-award already unlocked badges', async () => {
    const mockUser = { id: 'user-888', currentStreak: 15 };
    const mockBadges = [
      {
        id: 'week_warrior',
        criteriaType: 'streak_days',
        criteriaThreshold: 7,
        toJSON: () => ({ id: 'week_warrior' }),
      },
    ];

    vi.spyOn(Badge, 'findOrCreate').mockResolvedValue([mockBadges[0], false]);
    vi.spyOn(User, 'findAll').mockResolvedValue([mockUser]);
    vi.spyOn(Badge, 'findAll').mockResolvedValue(mockBadges);
    vi.spyOn(UserBadge, 'findAll').mockResolvedValue([{ badgeCode: 'week_warrior' }]);
    const createBadgeSpy = vi.spyOn(UserBadge, 'create');

    const awarded = await evaluateAllUserBadges('user-888');

    expect(createBadgeSpy).not.toHaveBeenCalled();
    expect(awarded.length).toBe(0);
  });
});
