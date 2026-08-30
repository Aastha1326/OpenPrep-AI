import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/**
 * PomodoroContext — global Pomodoro timer state shared across the app.
 *
 * Manages work / short-break / long-break cycles, localStorage persistence,
 * and document.title countdown updates.
 */

export const MODES = Object.freeze({
  WORK: 'work',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak',
});

const DEFAULT_SETTINGS = Object.freeze({
  workDuration: 25,        // minutes
  shortBreakDuration: 5,   // minutes
  longBreakDuration: 15,   // minutes
  cyclesBeforeLongBreak: 4,
});

const STORAGE_KEY = 'openprep_pomodoro';

// ── localStorage helpers ────────────────────────────────────────────────

const readSettings = () => {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

const readActiveTimer = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.activeTimer || !parsed.activeTimer.startTimestamp) return null;
    return parsed.activeTimer;
  } catch {
    return null;
  }
};

const persistState = (settings, activeTimer) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ settings, activeTimer: activeTimer || null })
    );
  } catch { /* quota exceeded — ignore */ }
};

// ── Helpers ─────────────────────────────────────────────────────────────

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const durationForMode = (mode, settings) => {
  switch (mode) {
    case MODES.WORK:        return settings.workDuration * 60;
    case MODES.SHORT_BREAK: return settings.shortBreakDuration * 60;
    case MODES.LONG_BREAK:  return settings.longBreakDuration * 60;
    default:                return settings.workDuration * 60;
  }
};

const nextMode = (currentMode, cyclesCompleted, settings) => {
  if (currentMode === MODES.WORK) {
    return cyclesCompleted % settings.cyclesBeforeLongBreak === 0
      ? MODES.LONG_BREAK
      : MODES.SHORT_BREAK;
  }
  // After any break → back to work
  return MODES.WORK;
};

// ── Context ─────────────────────────────────────────────────────────────

export const PomodoroContext = createContext(null);

export const PomodoroProvider = ({ children }) => {
  const [settings, setSettingsState] = useState(readSettings);

  // Derive initial timer state from localStorage (handles page-reload restoration).
  // Each useState uses a lazy initializer so the read only happens once.
  const getSavedTimer = () => {
    const saved = readActiveTimer();
    if (!saved) return null;
    const elapsed = Math.floor((Date.now() - saved.startTimestamp) / 1000);
    const remaining = saved.timeLeft - elapsed;
    return remaining > 0 ? { ...saved, timeLeft: remaining } : null;
  };

  const [mode, setMode] = useState(() => {
    const saved = getSavedTimer();
    return saved ? saved.mode : MODES.WORK;
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = getSavedTimer();
    return saved ? saved.timeLeft : durationForMode(MODES.WORK, readSettings());
  });
  const [isActive, setIsActive] = useState(() => {
    const saved = getSavedTimer();
    return !!saved;
  });
  const [cyclesCompleted, setCyclesCompleted] = useState(() => {
    const saved = getSavedTimer();
    return saved ? (saved.cyclesCompleted || 0) : 0;
  });
  const [totalSessions, setTotalSessions] = useState(() => {
    const saved = getSavedTimer();
    return saved ? (saved.totalSessions || 0) : 0;
  });

  const intervalRef = useRef(null);
  const startTimestampRef = useRef(null);
  const savedTimeLeftRef = useRef(timeLeft);

  const totalTime = durationForMode(mode, settings);

  // ── Tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    startTimestampRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive]);

  // ── document.title updates ──────────────────────────────────────────
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (isActive && timeLeft > 0) {
      const modeLabel = mode === MODES.WORK ? 'Focus' : mode === MODES.SHORT_BREAK ? 'Break' : 'Long Break';
      document.title = `(${formatTime(timeLeft)}) ${modeLabel} — OpenPrep AI`;
    } else {
      document.title = 'OpenPrep AI';
    }

    return () => { document.title = 'OpenPrep AI'; };
  }, [isActive, timeLeft, mode]);

  // ── Persist state to localStorage ───────────────────────────────────
  useEffect(() => {
    const activeTimer = isActive
      ? { mode, timeLeft, cyclesCompleted, totalSessions, startTimestamp: Date.now() }
      : null;
    persistState(settings, activeTimer);
  }, [isActive, mode, timeLeft, cyclesCompleted, totalSessions, settings]);

  // ── Actions ─────────────────────────────────────────────────────────

  const start = useCallback(() => {
    startTimestampRef.current = Date.now();
    savedTimeLeftRef.current = timeLeft;
    setIsActive(true);
  }, [timeLeft]);

  const pause = useCallback(() => {
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
    setMode(MODES.WORK);
    setTimeLeft(durationForMode(MODES.WORK, settings));
    setCyclesCompleted(0);
  }, [settings]);

  const skipBreak = useCallback(() => {
    setIsActive(false);
    setMode(MODES.WORK);
    setTimeLeft(durationForMode(MODES.WORK, settings));
  }, [settings]);

  const completeSession = useCallback(() => {
    setIsActive(false);
    const newCycles = mode === MODES.WORK ? cyclesCompleted + 1 : cyclesCompleted;
    if (mode === MODES.WORK) {
      setCyclesCompleted(newCycles);
      setTotalSessions((s) => s + 1);
    }
    const upcoming = nextMode(mode, newCycles, settings);
    setMode(upcoming);
    setTimeLeft(durationForMode(upcoming, settings));
  }, [mode, cyclesCompleted, settings]);

  const setModeExplicit = useCallback((newMode) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(durationForMode(newMode, settings));
  }, [settings]);

  const updateSettings = useCallback((patch) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      // If timer is not active, update timeLeft to match new duration
      if (!isActive) {
        setTimeLeft(durationForMode(mode, next));
      }
      return next;
    });
  }, [isActive, mode]);

  const formattedTime = formatTime(timeLeft);

  const value = {
    // State
    mode,
    timeLeft,
    totalTime,
    isActive,
    cyclesCompleted,
    totalSessions,
    settings,
    formattedTime,

    // Actions
    start,
    pause,
    reset,
    skipBreak,
    completeSession,
    setMode: setModeExplicit,
    updateSettings,
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = () => {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoro must be used within a PomodoroProvider');
  return ctx;
};

export { formatTime, durationForMode, nextMode };
