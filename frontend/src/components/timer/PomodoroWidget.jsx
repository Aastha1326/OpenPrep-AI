import { useEffect, useRef, useState } from 'react';
import { usePomodoro, MODES } from '../../context/PomodoroContext';
import AmbientAudioPlayer from './AmbientAudioPlayer';
import TimerSettingsModal from './TimerSettingsModal';
import API from '../../services/api';
import { playTimerCompleteSound } from '../../utils/audio';

/**
 * PomodoroWidget — floating Pomodoro timer with full controls.
 *
 * Features:
 * - Circular SVG progress ring
 * - Start / Pause / Reset / Skip Break controls
 * - Ambient audio player
 * - Settings modal
 * - Browser notification on completion
 * - Backend focus session logging
 * - Collapsible mini/full mode
 */

const MODE_LABELS = {
  [MODES.WORK]: 'Focus',
  [MODES.SHORT_BREAK]: 'Short Break',
  [MODES.LONG_BREAK]: 'Long Break',
};

const MODE_COLORS = {
  [MODES.WORK]: { stroke: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  [MODES.SHORT_BREAK]: { stroke: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  [MODES.LONG_BREAK]: { stroke: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20' },
};

const PROGRESS_RADIUS = 54;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

const PomodoroWidget = ({ subjectId = null, className = '' }) => {
  const {
    mode, timeLeft, totalTime, isActive, cyclesCompleted,
    totalSessions, formattedTime, settings,
    start, pause, reset, skipBreak, completeSession,
  } = usePomodoro();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const hasLoggedRef = useRef(false);

  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const strokeDashoffset = PROGRESS_CIRCUMFERENCE * (1 - progress);

  const modeColor = MODE_COLORS[mode] || MODE_COLORS[MODES.WORK];

  // ── Session completion ──────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === 0 && !isActive && !hasLoggedRef.current) {
      hasLoggedRef.current = true;
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 3000);

      // Play completion sound
      playTimerCompleteSound();

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const label = MODE_LABELS[mode] || 'Session';
        new Notification(`${label} complete!`, {
          body: mode === MODES.WORK
            ? `Great focus! ${cyclesCompleted + 1} pomodoro${cyclesCompleted > 0 ? 's' : ''} done.`
            : 'Break is over — time to focus!',
          icon: '/favicon.svg',
        });
      }

      // Log focus session to backend (only for work sessions)
      if (mode === MODES.WORK) {
        const activeSeconds = totalTime;
        API.post('/progress/focus-session', {
          activeSeconds,
          pausedSeconds: 0,
          interruptions: 0,
          subjectId: subjectId || null,
        }).catch(() => { /* best-effort */ });
      }
    }
  }, [timeLeft, isActive, mode, cyclesCompleted, totalTime, subjectId]);

  // ── Reset log flag when starting a new session ──────────────────────
  useEffect(() => {
    if (isActive) {
      hasLoggedRef.current = false;
    }
  }, [isActive]);

  // ── Request notification permission on mount ────────────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space' && e.ctrlKey) {
        e.preventDefault();
        isActive ? pause() : start();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, start, pause]);

  if (isCollapsed) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg px-4 py-2.5 hover:shadow-xl transition cursor-pointer"
          aria-label="Expand Pomodoro timer"
        >
          <span className="relative flex h-3 w-3">
            {isActive && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            )}
            <span className={`relative inline-flex h-3 w-3 rounded-full ${isActive ? 'bg-amber-500' : 'bg-slate-400'}`} />
          </span>
          <span className="text-sm font-bold text-slate-800 dark:text-white tabular-nums font-mono">
            {formattedTime}
          </span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className={`fixed bottom-4 right-4 z-50 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden ${justCompleted ? 'ring-2 ring-amber-400' : ''} ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isActive && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              )}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isActive ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {MODE_LABELS[mode]}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
              aria-label="Timer settings"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
              aria-label="Minimize timer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Timer display */}
        <div className="flex flex-col items-center py-4">
          <div className="relative">
            <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
              {/* Background ring */}
              <circle
                cx="65" cy="65" r={PROGRESS_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-100 dark:text-slate-800"
              />
              {/* Progress ring */}
              <circle
                cx="65" cy="65" r={PROGRESS_RADIUS}
                fill="none"
                stroke={modeColor.stroke}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={PROGRESS_CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
                {formattedTime}
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                {MODE_LABELS[mode]}
              </span>
            </div>
          </div>
        </div>

        {/* Cycle indicator */}
        <div className="flex justify-center gap-1.5 pb-3">
          {Array.from({ length: settings.cyclesBeforeLongBreak }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i < cyclesCompleted
                  ? 'bg-amber-500'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
              aria-label={i < cyclesCompleted ? 'Cycle completed' : 'Cycle pending'}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 px-4 pb-3">
          {!isActive && timeLeft === 0 ? (
            <>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => { completeSession(); }}
                className="rounded-xl px-5 py-2 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 cursor-pointer transition"
              >
                {mode === MODES.WORK ? 'Start Break' : 'Start Focus'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition"
                aria-label="Reset timer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              {isActive ? (
                <button
                  type="button"
                  onClick={pause}
                  className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 cursor-pointer transition"
                  aria-label="Pause timer"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={start}
                  className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 cursor-pointer transition"
                  aria-label="Start timer"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Start
                </button>
              )}
              {mode !== MODES.WORK && (
                <button
                  type="button"
                  onClick={skipBreak}
                  className="rounded-xl px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition"
                  aria-label="Skip break"
                >
                  Skip
                </button>
              )}
            </>
          )}
        </div>

        {/* Ambient audio */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5">
          <AmbientAudioPlayer isPlaying={isActive && mode === MODES.WORK} />
        </div>

        {/* Session stats */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>{totalSessions} session{totalSessions !== 1 ? 's' : ''} today</span>
          <span>Ctrl+Space to toggle</span>
        </div>
      </div>

      {/* Settings modal */}
      <TimerSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
};

export default PomodoroWidget;
