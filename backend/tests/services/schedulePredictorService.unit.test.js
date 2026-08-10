const {
  calculateVelocity,
  combineVelocitySignals,
  predictCompletionDate,
  isAtRisk,
  getCompletionForecast,
  rebalanceScheduleEvenly,
} = require('../../services/schedulePredictorService');

describe('schedulePredictorService', () => {
  describe('calculateVelocity', () => {
    it('returns null velocity when referenceDateStr is missing/invalid', () => {
      expect(calculateVelocity({ dailyGoals: [], referenceDateStr: null })).toEqual({
        tasksCompleted: 0,
        tasksScheduled: 0,
        velocity: null,
      });
    });

    it('returns null velocity for an empty schedule (no data in window)', () => {
      const result = calculateVelocity({ dailyGoals: [], referenceDateStr: '2026-01-15' });
      expect(result.tasksScheduled).toBe(0);
      expect(result.velocity).toBeNull();
    });

    it('only counts fully-elapsed days within the trailing 14-day window', () => {
      const dailyGoals = [
        { date: '2025-12-20', tasks: [{ completed: true }] }, // before window, excluded
        { date: '2026-01-10', tasks: [{ completed: true }, { completed: false }] }, // in window
        { date: '2026-01-12', tasks: [{ completed: true }, { completed: true }] }, // in window
        { date: '2026-01-15', tasks: [{ completed: false }] }, // == today, excluded
      ];

      const result = calculateVelocity({ dailyGoals, referenceDateStr: '2026-01-15' });
      expect(result.tasksScheduled).toBe(4);
      expect(result.tasksCompleted).toBe(3);
      expect(result.velocity).toBe(0.75);
    });

    it('respects a custom windowDays value', () => {
      const dailyGoals = [
        { date: '2026-01-13', tasks: [{ completed: false }] }, // outside a 1-day window
        { date: '2026-01-14', tasks: [{ completed: true }] }, // inside a 1-day window
      ];
      const result = calculateVelocity({ dailyGoals, referenceDateStr: '2026-01-15', windowDays: 1 });
      expect(result.tasksScheduled).toBe(1);
      expect(result.velocity).toBe(1);
    });
  });

  describe('combineVelocitySignals', () => {
    it('returns null when both signals are missing', () => {
      expect(combineVelocitySignals({ taskVelocity: null, quizAccuracy: null })).toBeNull();
    });

    it('falls back to whichever single signal is available', () => {
      expect(combineVelocitySignals({ taskVelocity: 0.6, quizAccuracy: null })).toBe(0.6);
      expect(combineVelocitySignals({ taskVelocity: null, quizAccuracy: 0.4 })).toBe(0.4);
    });

    it('blends both signals using the task weight (default 0.7)', () => {
      const blended = combineVelocitySignals({ taskVelocity: 1, quizAccuracy: 0 });
      expect(blended).toBeCloseTo(0.7);
    });
  });

  describe('predictCompletionDate', () => {
    it('returns the reference date when there are no pending tasks (empty schedule)', () => {
      expect(predictCompletionDate({ dailyGoals: [], referenceDateStr: '2026-01-15' })).toBe('2026-01-15');
    });

    it('returns null when referenceDateStr is invalid', () => {
      expect(predictCompletionDate({ dailyGoals: [], referenceDateStr: 'not-a-date' })).toBeNull();
    });

    it('projects forward using velocity-adjusted pace', () => {
      const dailyGoals = [
        { date: '2026-01-10', tasks: [{ completed: true }, { completed: false }] },
        { date: '2026-01-12', tasks: [{ completed: false }, { completed: false }] },
      ];
      // avgTasksPerDay = 4 tasks / 2 scheduled days = 2; pendingTaskCount = 3
      // velocity 0.5 -> tasksPerDay = max(0.5 * 2, 0.1) = 1 -> daysNeeded = ceil(3/1) = 3
      const result = predictCompletionDate({ dailyGoals, referenceDateStr: '2026-01-15', velocity: 0.5 });
      expect(result).toBe('2026-01-18');
    });

    it('falls back to the observed daily pace when velocity is unknown', () => {
      const dailyGoals = [{ date: '2026-01-14', tasks: [{ completed: false }, { completed: false }] }];
      // avgTasksPerDay = 2, pending = 2, velocity null -> tasksPerDay = max(2, 1) = 2 -> daysNeeded = 1
      const result = predictCompletionDate({ dailyGoals, referenceDateStr: '2026-01-15', velocity: null });
      expect(result).toBe('2026-01-16');
    });
  });

  describe('isAtRisk', () => {
    it('is true when the projected date is after the exam date', () => {
      expect(isAtRisk({ projectedCompletionDate: '2026-02-05', examDateStr: '2026-02-01' })).toBe(true);
    });

    it('is false when the projected date is on or before the exam date', () => {
      expect(isAtRisk({ projectedCompletionDate: '2026-02-01', examDateStr: '2026-02-01' })).toBe(false);
      expect(isAtRisk({ projectedCompletionDate: '2026-01-20', examDateStr: '2026-02-01' })).toBe(false);
    });

    it('is false when either date is missing or invalid', () => {
      expect(isAtRisk({ projectedCompletionDate: undefined, examDateStr: '2026-02-01' })).toBe(false);
      expect(isAtRisk({ projectedCompletionDate: '2026-02-01', examDateStr: 'not-a-date' })).toBe(false);
    });
  });

  describe('getCompletionForecast', () => {
    it('flags a plan as at-risk when the pending workload will slip past the exam', () => {
      const dailyGoals = [
        { date: '2026-01-01', tasks: Array.from({ length: 10 }, () => ({ completed: false })) },
      ];
      const forecast = getCompletionForecast({
        dailyGoals,
        referenceDateStr: '2026-01-15',
        examDateStr: '2026-01-16',
      });
      expect(forecast.atRisk).toBe(true);
      expect(forecast.examDate).toBe('2026-01-16');
    });

    it('is not at-risk for an empty schedule with no pending work', () => {
      const forecast = getCompletionForecast({
        dailyGoals: [],
        referenceDateStr: '2026-01-15',
        examDateStr: '2026-02-01',
      });
      expect(forecast.atRisk).toBe(false);
      expect(forecast.projectedCompletionDate).toBe('2026-01-15');
    });
  });

  describe('rebalanceScheduleEvenly', () => {
    it('edge case: 0 days remaining (exam date already passed) does not rebalance', () => {
      const dailyGoals = [{ date: '2026-01-10', tasks: [{ completed: false }] }];
      const result = rebalanceScheduleEvenly({
        dailyGoals,
        referenceDateStr: '2026-01-15',
        examDateStr: '2026-01-14',
      });
      expect(result.rebalanced).toBe(false);
      expect(result.reason).toBe('NO_DAYS_REMAINING');
      expect(result.remainingDays).toBe(0);
      expect(result.dailyGoals).toBe(dailyGoals); // unchanged reference
    });

    it('edge case: empty schedule has nothing to rebalance', () => {
      const result = rebalanceScheduleEvenly({
        dailyGoals: [],
        referenceDateStr: '2026-01-15',
        examDateStr: '2026-01-20',
      });
      expect(result.rebalanced).toBe(false);
      expect(result.reason).toBe('NO_PENDING_TASKS');
      expect(result.remainingDays).toBe(6); // Jan 15 - Jan 20 inclusive
    });

    it('distributes pending tasks evenly across remaining days without overlap', () => {
      const dailyGoals = [
        {
          date: '2026-01-10',
          tasks: [
            { _id: 't1', completed: false },
            { _id: 't2', completed: false },
            { _id: 't3', completed: true },
          ],
        },
        { date: '2026-01-13', tasks: [{ _id: 't4', completed: false }] },
      ];

      // Remaining days: Jan 15, 16, 17 (3 days). Pending tasks: t1, t2, t4 (3 tasks).
      const result = rebalanceScheduleEvenly({
        dailyGoals,
        referenceDateStr: '2026-01-15',
        examDateStr: '2026-01-17',
      });

      expect(result.rebalanced).toBe(true);
      expect(result.remainingDays).toBe(3);
      expect(result.pendingTaskCount).toBe(3);

      // Every task appears exactly once across the whole rebalanced schedule.
      const allTaskIds = result.dailyGoals.flatMap((g) => g.tasks.map((t) => t._id));
      expect(allTaskIds.filter((id) => id === 't1')).toHaveLength(1);
      expect(allTaskIds.filter((id) => id === 't2')).toHaveLength(1);
      expect(allTaskIds.filter((id) => id === 't4')).toHaveLength(1);

      // Each of the 3 remaining days gets exactly 1 of the 3 pending tasks.
      const futureGoals = result.dailyGoals.filter((g) => g.date >= '2026-01-15');
      futureGoals.forEach((g) => expect(g.tasks.length).toBe(1));

      // The completed task stays on its original (overdue) date.
      const overdueGoal = result.dailyGoals.find((g) => g.date === '2026-01-10');
      expect(overdueGoal.tasks).toEqual([{ _id: 't3', completed: true }]);
    });

    it('handles more pending tasks than remaining days via round-robin', () => {
      const dailyGoals = [
        {
          date: '2026-01-14',
          tasks: [1, 2, 3, 4, 5].map((n) => ({ _id: `t${n}`, completed: false })),
        },
      ];

      const result = rebalanceScheduleEvenly({
        dailyGoals,
        referenceDateStr: '2026-01-15',
        examDateStr: '2026-01-16', // 2 remaining days for 5 tasks
      });

      expect(result.remainingDays).toBe(2);
      expect(result.pendingTaskCount).toBe(5);
      const counts = result.dailyGoals.map((g) => g.tasks.length);
      // 5 tasks over 2 days round-robin -> 3 and 2, evenly balanced (no day left with 0 while another has all 5)
      expect(counts.sort()).toEqual([2, 3]);
    });
  });
});