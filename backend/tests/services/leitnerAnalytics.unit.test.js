const {
  getLeitnerAnalytics,
  getLeitnerBoxNumber,
  calculateMemoryStability,
} = require('../../services/leitnerAnalyticsService');
const Flashcard = require('../../models/Flashcard');

describe('Leitner Box & Ebbinghaus Retention Analytics Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getLeitnerBoxNumber', () => {
    it('categorizes cards into 5 Leitner boxes based on interval and repetitions', () => {
      expect(getLeitnerBoxNumber({ interval: 0, repetitions: 0 })).toBe(1);
      expect(getLeitnerBoxNumber({ interval: 1, repetitions: 1 })).toBe(1);
      expect(getLeitnerBoxNumber({ interval: 3, repetitions: 2 })).toBe(2);
      expect(getLeitnerBoxNumber({ interval: 7, repetitions: 3 })).toBe(3);
      expect(getLeitnerBoxNumber({ interval: 14, repetitions: 4 })).toBe(4);
      expect(getLeitnerBoxNumber({ interval: 30, repetitions: 5 })).toBe(5);
    });
  });

  describe('calculateMemoryStability', () => {
    it('computes stability parameters proportional to interval and efactor', () => {
      const card = { interval: 10, efactor: 2.5 };
      const stability = calculateMemoryStability(card);
      expect(stability).toBe(10);
    });
  });

  describe('getLeitnerAnalytics', () => {
    it('returns structured analytics with 5 boxes, 31-day curve, and deck health index', async () => {
      const mockCards = [
        { interval: 1, repetitions: 1, efactor: 2.5, updatedAt: new Date() },
        { interval: 4, repetitions: 2, efactor: 2.5, updatedAt: new Date() },
        { interval: 20, repetitions: 5, efactor: 2.7, updatedAt: new Date() },
      ];

      vi.spyOn(Flashcard, 'findAll').mockResolvedValue(mockCards);

      const result = await getLeitnerAnalytics('deck-1', 'user-1');

      expect(result).toHaveProperty('totalCards', 3);
      expect(result).toHaveProperty('deckHealthIndex');
      expect(result.boxes).toHaveLength(5);
      expect(result.retentionCurve).toHaveLength(31); // day 0 to day 30
      expect(result.retentionCurve[0].retention).toBe(100);
    });
  });
});
