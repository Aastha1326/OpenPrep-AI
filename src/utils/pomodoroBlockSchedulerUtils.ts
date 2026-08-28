/**
 * Automated Study Pomodoro Timer & Intermittent Rest Block Scheduler
 */

export interface PomodoroBlockSchedule {
  studyDurationMinutes: number;
  breakDurationMinutes: number;
  longBreakAfterSessions: number;
  totalCycleTimeMinutes: number;
}

/**
 * Calculates optimal Pomodoro study/rest cycle schedule.
 */
export function calculatePomodoroBlockSchedule(totalAvailableMinutes: number): PomodoroBlockSchedule {
  const study = 25;
  const shortBreak = 5;
  const cycleTime = study + shortBreak; // 30 mins per session

  return {
    studyDurationMinutes: study,
    breakDurationMinutes: shortBreak,
    longBreakAfterSessions: 4,
    totalCycleTimeMinutes: cycleTime,
  };
}
