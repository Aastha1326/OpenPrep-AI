process.env.TZ = 'Asia/Kolkata';

const { toLocalDateString, toDateOnlyString } = require('../../utils/dateUtils');
const geminiService = require('../../services/geminiService');

describe('dateUtils', () => {
  describe('toLocalDateString', () => {
    it('formats a local-midnight date using local components', () => {
      const localMidnight = new Date(2026, 9, 10); // 10 Oct 00:00 local
      expect(toLocalDateString(localMidnight)).toBe('2026-10-10');
    });

    it('does NOT shift local midnight to the previous day (IST scenario from issue #461)', () => {
      const localMidnight = new Date(2026, 9, 10); // 10 Oct 00:00 IST
      // Sanity check: serializing this instant to UTC gives 9 Oct 18:30
      expect(localMidnight.toISOString().split('T')[0]).toBe('2026-10-09');
      // The utility must return the local day, not the UTC day
      expect(toLocalDateString(localMidnight)).toBe('2026-10-10');
    });

    it('round-trips plain ISO timestamps through local components', () => {
      expect(toLocalDateString('2026-10-10T00:00:00.000Z')).toBe('2026-10-10');
    });
  });

  describe('toDateOnlyString', () => {
    it('returns already-plain YYYY-MM-DD strings untouched', () => {
      expect(toDateOnlyString('2026-10-10')).toBe('2026-10-10');
    });

    it('normalizes Date objects to plain YYYY-MM-DD strings', () => {
      expect(toDateOnlyString(new Date(2026, 9, 10))).toBe('2026-10-10');
    });

    it('normalizes ISO timestamps to plain YYYY-MM-DD strings', () => {
      expect(toDateOnlyString('2026-10-10T00:00:00.000Z')).toBe('2026-10-10');
    });
  });

  describe('geminiService.getMockStudyPlan dates', () => {
    it('generates daily goal dates as plain YYYY-MM-DD strings starting on startDate', async () => {
      const goals = await geminiService.generateStudyPlan(
        'Mock Exam',
        [{ subjectName: 'Math', topics: ['Algebra', 'Calculus'] }],
        '2026-10-10',
        '2026-10-20',
        3
      );

      expect(goals.length).toBeGreaterThan(0);
      for (const day of goals) {
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      // First generated day must be the requested start date (no off-by-one drift)
      expect(goals[0].date).toBe('2026-10-10');
    });
  });
});
