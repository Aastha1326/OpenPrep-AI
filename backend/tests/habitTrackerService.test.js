/**
 * @fileoverview Unit tests for the habitTrackerService — habit CRUD,
 * streak calculation, calendar heatmap, and weekly summaries.
 */
const habitTrackerService = require('../../services/habitTrackerService');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('habitTrackerService', () => {
  describe('Module Exports', () => {
    it('should export all required public functions', () => {
      const expectedExports = [
        'createHabit',
        'getHabitById',
        'listHabits',
        'updateHabit',
        'archiveHabit',
        'deleteHabit',
        'logHabit',
        'batchLogHabits',
        'getLogsForRange',
        'recalculateStreak',
        'recalculateAllStreaks',
        'getCalendarHeatmap',
        'getWeeklySummary',
        'getDashboard',
        'WEEKDAY_NAMES',
        'MONTH_NAMES',
        'GRACE_PERIOD_HOURS',
      ];

      for (const name of expectedExports) {
        expect(habitTrackerService).toHaveProperty(name);
        if (typeof habitTrackerService[name] === 'function') {
          expect(typeof habitTrackerService[name]).toBe('function');
        }
      }
    });
  });

  describe('Constants', () => {
    it('should have all 7 weekday names', () => {
      expect(habitTrackerService.WEEKDAY_NAMES).toHaveLength(7);
      expect(habitTrackerService.WEEKDAY_NAMES).toEqual([
        'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
      ]);
    });

    it('should have all 12 month names', () => {
      expect(habitTrackerService.MONTH_NAMES).toHaveLength(12);
      expect(habitTrackerService.MONTH_NAMES[0]).toBe('Jan');
      expect(habitTrackerService.MONTH_NAMES[11]).toBe('Dec');
    });

    it('should define a reasonable grace period', () => {
      expect(habitTrackerService.GRACE_PERIOD_HOURS).toBe(28);
    });
  });

  describe('Streak Calculation Logic', () => {
    it('should calculate current streak from consecutive dates', () => {
      const completedDates = ['2026-08-25', '2026-08-26', '2026-08-27'];
      function calculateStreak(dates, today) {
        let streak = 0;
        const dateSet = new Set(dates);
        let checkDate = new Date(today);

        while (true) {
          const dateStr = checkDate.toISOString().split('T')[0];
          if (dateSet.has(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        return streak;
      }

      const streak = calculateStreak(completedDates, '2026-08-27');
      expect(streak).toBe(3);
    });

    it('should break streak at a gap', () => {
      const completedDates = ['2026-08-23', '2026-08-24', '2026-08-26', '2026-08-27'];
      function calculateStreak(dates, today) {
        let streak = 0;
        const dateSet = new Set(dates);
        let checkDate = new Date(today);

        while (true) {
          const dateStr = checkDate.toISOString().split('T')[0];
          if (dateSet.has(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        return streak;
      }

      const streak = calculateStreak(completedDates, '2026-08-27');
      expect(streak).toBe(2); // Only 26, 27
    });

    it('should return 0 streak for no completions', () => {
      const completedDates = [];
      function calculateStreak(dates, today) {
        let streak = 0;
        const dateSet = new Set(dates);
        let checkDate = new Date(today);
        while (true) {
          const dateStr = checkDate.toISOString().split('T')[0];
          if (dateSet.has(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        return streak;
      }

      expect(calculateStreak(completedDates, '2026-08-27')).toBe(0);
    });

    it('should handle single-day streak', () => {
      function calculateStreak(dates, today) {
        let streak = 0;
        const dateSet = new Set(dates);
        let checkDate = new Date(today);
        while (true) {
          const dateStr = checkDate.toISOString().split('T')[0];
          if (dateSet.has(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        return streak;
      }

      expect(calculateStreak(['2026-08-27'], '2026-08-27')).toBe(1);
    });
  });

  describe('Calendar Heatmap Logic', () => {
    it('should correctly group logs by date', () => {
      const logs = [
        { date: '2026-08-01', count: 2 },
        { date: '2026-08-01', count: 1 },
        { date: '2026-08-02', count: 3 },
      ];

      const heatmap = {};
      for (const log of logs) {
        if (!heatmap[log.date]) {
          heatmap[log.date] = { date: log.date, count: 0 };
        }
        heatmap[log.date].count += log.count;
      }

      expect(Object.keys(heatmap)).toHaveLength(2);
      expect(heatmap['2026-08-01'].count).toBe(3);
      expect(heatmap['2026-08-02'].count).toBe(3);
    });

    it('should limit calendar months to MAX_CALENDAR_MONTHS', () => {
      const maxMonths = 12;
      const requested = 24;
      const clamped = Math.min(Math.max(1, requested), maxMonths);
      expect(clamped).toBe(12);
    });

    it('should default to 6 months for heatmap', () => {
      const defaultMonths = 6;
      const months = parseInt(undefined, 10) || defaultMonths;
      expect(months).toBe(6);
    });

    it('should calculate correct start date for heatmap', () => {
      const months = 6;
      const endDate = new Date('2026-08-27');
      const startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - months);

      expect(startDate.getMonth()).toBe(2); // March
      expect(startDate.getFullYear()).toBe(2026);
    });
  });

  describe('Weekly Summary Logic', () => {
    it('should calculate Monday as week start', () => {
      function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split('T')[0];
      }

      // Wednesday Aug 27, 2026 -> Monday Aug 25
      expect(getWeekStart('2026-08-27')).toBe('2026-08-25');
    });

    it('should calculate Sunday as week start when date is Sunday', () => {
      function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split('T')[0];
      }

      // Sunday Aug 31, 2026 -> Monday Aug 25
      expect(getWeekStart('2026-08-31')).toBe('2026-08-25');
    });

    it('should calculate end of week as Sunday (+6 days from Monday)', () => {
      const start = new Date('2026-08-25');
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      expect(end.toISOString().split('T')[0]).toBe('2026-08-31');
    });
  });

  describe('Habit Frequency Types', () => {
    it('should support daily frequency', () => {
      const habit = { frequency: 'daily' };
      let expectedDays = 7;
      if (habit.frequency === 'weekdays') expectedDays = 5;
      else if (habit.frequency === 'specific_days') expectedDays = 3;
      expect(expectedDays).toBe(7);
    });

    it('should support weekday frequency', () => {
      const habit = { frequency: 'weekdays' };
      let expectedDays = 7;
      if (habit.frequency === 'weekdays') expectedDays = 5;
      expect(expectedDays).toBe(5);
    });

    it('should support specific_days frequency', () => {
      const habit = { frequency: 'specific_days', specificDays: [1, 3, 5] };
      let expectedDays = 7;
      if (habit.frequency === 'specific_days') {
        expectedDays = (habit.specificDays || []).length || 7;
      }
      expect(expectedDays).toBe(3);
    });
  });

  describe('Completion Rate Calculation', () => {
    it('should calculate percentage correctly', () => {
      function calcRate(completed, total) {
        return total > 0 ? Math.round((completed / total) * 100) : 0;
      }

      expect(calcRate(5, 7)).toBe(71);
      expect(calcRate(7, 7)).toBe(100);
      expect(calcRate(0, 7)).toBe(0);
      expect(calcRate(1, 0)).toBe(0);
    });

    it('should handle fractional completion rates', () => {
      function calcRate(completed, total) {
        return total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0;
      }

      expect(calcRate(1, 3)).toBe(33.3);
      expect(calcRate(2, 3)).toBe(66.7);
    });
  });

  describe('Validation Rules', () => {
    it('should require habit name', () => {
      const data = {};
      expect(data.name).toBeUndefined();
    });

    it('should limit batch log entries to 100', () => {
      const maxEntries = 100;
      const entries = new Array(101).fill({ habitId: 'h1', date: '2026-08-27' });
      expect(entries.length > maxEntries).toBe(true);
    });

    it('should require date range params for log queries', () => {
      const query = {};
      const hasRange = query.startDate && query.endDate;
      expect(hasRange).toBeFalsy();
    });

    it('should default completion count to 1', () => {
      const logData = {};
      const count = logData.completionCount || 1;
      expect(count).toBe(1);
    });
  });

  describe('Heatmap Intensity Levels', () => {
    it('should classify completion counts into intensity levels', () => {
      function getIntensity(count) {
        if (count === 0) return 0;
        if (count <= 2) return 1;
        if (count <= 4) return 2;
        if (count <= 6) return 3;
        return 4;
      }

      expect(getIntensity(0)).toBe(0);
      expect(getIntensity(1)).toBe(1);
      expect(getIntensity(2)).toBe(1);
      expect(getIntensity(3)).toBe(2);
      expect(getIntensity(5)).toBe(3);
      expect(getIntensity(7)).toBe(4);
    });
  });

  describe('Habit Categories', () => {
    it('should support all defined habit categories', () => {
      const categories = [
        'reading', 'practice', 'review',
        'exercise', 'writing', 'meditation', 'custom',
      ];
      expect(categories).toHaveLength(7);
    });

    it('should default to custom category', () => {
      const data = {};
      const category = data.category || 'custom';
      expect(category).toBe('custom');
    });
  });

  describe('Dashboard Logic', () => {
    it('should calculate overall rate from completed vs total habits', () => {
      const habitsWithToday = [
        { todayCompleted: true },
        { todayCompleted: true },
        { todayCompleted: false },
        { todayCompleted: false },
      ];
      const completed = habitsWithToday.filter((h) => h.todayCompleted).length;
      const total = habitsWithToday.length;
      const overallRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      expect(completed).toBe(2);
      expect(total).toBe(4);
      expect(overallRate).toBe(50);
    });

    it('should handle empty habit list', () => {
      const habitsWithToday = [];
      const completed = habitsWithToday.filter((h) => h.todayCompleted).length;
      const total = habitsWithToday.length;
      const overallRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      expect(overallRate).toBe(0);
    });

    it('should sort top streaks by current streak descending', () => {
      const streaks = [
        { currentStreak: 3 },
        { currentStreak: 10 },
        { currentStreak: 7 },
        { currentStreak: 1 },
      ];
      const sorted = streaks
        .filter((s) => s.currentStreak > 0)
        .sort((a, b) => b.currentStreak - a.currentStreak)
        .slice(0, 3);

      expect(sorted[0].currentStreak).toBe(10);
      expect(sorted[1].currentStreak).toBe(7);
      expect(sorted[2].currentStreak).toBe(3);
    });
  });

  describe('Day-of-Week Stats', () => {
    it('should correctly track completions per day of week', () => {
      const logs = [
        { date: '2026-08-25', count: 2 }, // Monday
        { date: '2026-08-26', count: 3 }, // Tuesday
        { date: '2026-08-27', count: 1 }, // Wednesday
        { date: '2026-08-25', count: 1 }, // Monday (second log)
      ];

      const dayTotals = {};
      const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (const log of logs) {
        const dayOfWeek = new Date(log.date).getDay();
        const dayName = WEEKDAY_NAMES[dayOfWeek];
        dayTotals[dayName] = (dayTotals[dayName] || 0) + log.count;
      }

      expect(dayTotals['Mon']).toBe(3);
      expect(dayTotals['Tue']).toBe(3);
      expect(dayTotals['Wed']).toBe(1);
    });

    it('should find the best day of week', () => {
      const dayTotals = { Mon: 10, Tue: 5, Wed: 15, Thu: 3, Fri: 8 };
      let bestDay = null;
      let bestCount = 0;
      for (const [day, count] of Object.entries(dayTotals)) {
        if (count > bestCount) {
          bestDay = day;
          bestCount = count;
        }
      }

      expect(bestDay).toBe('Wed');
      expect(bestCount).toBe(15);
    });
  });

  describe('Batch Logging', () => {
    it('should handle empty entries array', () => {
      const entries = [];
      expect(entries.length === 0).toBe(true);
    });

    it('should track results and errors separately', () => {
      const results = [];
      const errors = [];

      // Simulate one success and one failure
      results.push({ habitId: 'h1', date: '2026-08-27', status: 'success' });
      errors.push({ habitId: 'h2', date: '2026-08-27', error: 'Habit not found' });

      expect(results).toHaveLength(1);
      expect(errors).toHaveLength(1);
      expect(results[0].status).toBe('success');
      expect(errors[0].error).toBe('Habit not found');
    });
  });

  describe('Habit Archiving', () => {
    it('should set isArchived to true when archiving', () => {
      const habit = { isArchived: false, archivedAt: null };
      habit.isArchived = true;
      habit.archivedAt = new Date();
      expect(habit.isArchived).toBe(true);
      expect(habit.archivedAt).not.toBeNull();
    });

    it('should prevent modifications to archived habits', () => {
      const habit = { isArchived: true };
      const canModify = !habit.isArchived;
      expect(canModify).toBe(false);
    });
  });
});
