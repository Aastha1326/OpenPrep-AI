/**
 * Unit Tests for Pomodoro Block Scheduler Utilities
 */

import { describe, it, expect } from 'vitest';
import { calculatePomodoroBlockSchedule } from './pomodoroBlockSchedulerUtils';

describe('PomodoroBlockSchedulerUtils', () => {
  it('should calculate 25-min study and 5-min break pomodoro cycles', () => {
    const res = calculatePomodoroBlockSchedule(120);
    expect(res.studyDurationMinutes).toBe(25);
    expect(res.breakDurationMinutes).toBe(5);
  });
});
