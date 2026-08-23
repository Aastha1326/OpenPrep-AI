import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PomodoroProvider, usePomodoro, MODES, formatTime, nextMode, durationForMode } from './PomodoroContext';

// ── Helper to wrap hook in provider ──────────────────────────────────
const wrapper = ({ children }) => <PomodoroProvider>{children}</PomodoroProvider>;

describe('PomodoroContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatTime', () => {
    it('formats seconds to MM:SS', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(65)).toBe('01:05');
      expect(formatTime(1500)).toBe('25:00');
      expect(formatTime(3599)).toBe('59:59');
    });
  });

  describe('durationForMode', () => {
    const settings = { workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, cyclesBeforeLongBreak: 4 };

    it('returns work duration in seconds', () => {
      expect(durationForMode(MODES.WORK, settings)).toBe(1500);
    });

    it('returns short break duration in seconds', () => {
      expect(durationForMode(MODES.SHORT_BREAK, settings)).toBe(300);
    });

    it('returns long break duration in seconds', () => {
      expect(durationForMode(MODES.LONG_BREAK, settings)).toBe(900);
    });
  });

  describe('nextMode', () => {
    const settings = { workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, cyclesBeforeLongBreak: 4 };

    it('goes to short break after work when cycles < threshold', () => {
      // After 1st work session: cyclesCompleted = 1 → 1 % 4 ≠ 0 → SHORT_BREAK
      expect(nextMode(MODES.WORK, 1, settings)).toBe(MODES.SHORT_BREAK);
      // After 2nd work session: cyclesCompleted = 2 → 2 % 4 ≠ 0 → SHORT_BREAK
      expect(nextMode(MODES.WORK, 2, settings)).toBe(MODES.SHORT_BREAK);
      // After 3rd work session: cyclesCompleted = 3 → 3 % 4 ≠ 0 → SHORT_BREAK
      expect(nextMode(MODES.WORK, 3, settings)).toBe(MODES.SHORT_BREAK);
    });

    it('goes to long break after work when cycles reached threshold', () => {
      // After 4th work session: cyclesCompleted = 4 → 4 % 4 === 0 → LONG_BREAK
      expect(nextMode(MODES.WORK, 4, settings)).toBe(MODES.LONG_BREAK);
    });

    it('goes back to work after any break', () => {
      expect(nextMode(MODES.SHORT_BREAK, 0, settings)).toBe(MODES.WORK);
      expect(nextMode(MODES.LONG_BREAK, 3, settings)).toBe(MODES.WORK);
    });
  });

  describe('usePomodoro hook', () => {
    it('provides initial state', () => {
      const { result } = renderHook(() => usePomodoro(), { wrapper });

      expect(result.current.mode).toBe(MODES.WORK);
      expect(result.current.isActive).toBe(false);
      expect(result.current.timeLeft).toBe(1500); // 25 min
      expect(result.current.cyclesCompleted).toBe(0);
      expect(result.current.totalSessions).toBe(0);
      expect(result.current.formattedTime).toBe('25:00');
    });

    it('starts the timer', () => {
      const { result } = renderHook(() => usePomodoro(), { wrapper });

      act(() => result.current.start());
      expect(result.current.isActive).toBe(true);

      act(() => vi.advanceTimersByTime(1000));
      expect(result.current.timeLeft).toBe(1499);
    });

    it('pauses the timer', () => {
      const { result } = renderHook(() => usePomodoro(), { wrapper });

      act(() => result.current.start());
      act(() => vi.advanceTimersByTime(3000));
      act(() => result.current.pause());
      expect(result.current.isActive).toBe(false);

      const timeAfterPause = result.current.timeLeft;
      act(() => vi.advanceTimersByTime(2000));
      expect(result.current.timeLeft).toBe(timeAfterPause);
    });

    it('resets the timer to work mode', () => {
      const { result } = renderHook(() => usePomodoro(), { wrapper });

      act(() => result.current.start());
      act(() => vi.advanceTimersByTime(5000));
      act(() => result.current.reset());

      expect(result.current.mode).toBe(MODES.WORK);
      expect(result.current.timeLeft).toBe(1500);
      expect(result.current.cyclesCompleted).toBe(0);
      expect(result.current.isActive).toBe(false);
    });

    it('completes work session and transitions to short break', () => {
      const { result } = renderHook(() => usePomodoro(), { wrapper });

      act(() => result.current.start());
      act(() => vi.advanceTimersByTime(1500 * 1000)); // Fast-forward 25 min
      expect(result.current.timeLeft).toBe(0);

      act(() => result.current.completeSession());
      expect(result.current.mode).toBe(MODES.SHORT_BREAK);
      expect(result.current.timeLeft).toBe(300); // 5 min
      expect(result.current.cyclesCompleted).toBe(1);
      expect(result.current.totalSessions).toBe(1);
    });

    it('transitions to long break after 4 cycles', () => {
      const { result } = renderHook(() => usePomodoro(), { wrapper });

      // Complete 3 work sessions → short breaks
      for (let i = 0; i < 3; i++) {
        act(() => result.current.start());
        act(() => vi.advanceTimersByTime(1500 * 1000));
        act(() => result.current.completeSession());
        // Skip break
        act(() => result.current.skipBreak());
      }
      expect(result.current.cyclesCompleted).toBe(3);

      // 4th work session → long break
      act(() => result.current.start());
      act(() => vi.advanceTimersByTime(1500 * 1000));
      act(() => result.current.completeSession());
      expect(result.current.mode).toBe(MODES.LONG_BREAK);
      expect(result.current.timeLeft).toBe(900); // 15 min
      expect(result.current.cyclesCompleted).toBe(4);
    });

    it('skipBreak returns to work mode', () => {
      const { result } = renderHook(() => usePomodoro(), { wrapper });

      act(() => result.current.setMode(MODES.SHORT_BREAK));
      expect(result.current.mode).toBe(MODES.SHORT_BREAK);

      act(() => result.current.skipBreak());
      expect(result.current.mode).toBe(MODES.WORK);
      expect(result.current.isActive).toBe(false);
    });

    it('updates settings', () => {
      const { result } = renderHook(() => usePomodoro(), { wrapper });

      act(() => result.current.updateSettings({ workDuration: 30 }));
      expect(result.current.settings.workDuration).toBe(30);
      expect(result.current.timeLeft).toBe(1800); // 30 min
    });

    it('persists settings to localStorage', () => {
      const { result } = renderHook(() => usePomodoro(), { wrapper });

      act(() => result.current.updateSettings({ workDuration: 45 }));
      const saved = JSON.parse(localStorage.getItem('openprep_pomodoro'));
      expect(saved.settings.workDuration).toBe(45);
    });

    it('restores active timer from localStorage', () => {
      // Simulate an active timer saved before page reload
      const startTimestamp = Date.now() - 5000; // 5 seconds ago
      localStorage.setItem('openprep_pomodoro', JSON.stringify({
        settings: { workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, cyclesBeforeLongBreak: 4 },
        activeTimer: { mode: 'work', timeLeft: 1490, cyclesCompleted: 1, totalSessions: 1, startTimestamp },
      }));

      const { result } = renderHook(() => usePomodoro(), { wrapper });

      expect(result.current.isActive).toBe(true);
      expect(result.current.mode).toBe(MODES.WORK);
      expect(result.current.timeLeft).toBe(1485); // 1490 - 5 seconds elapsed
    });
  });
});
