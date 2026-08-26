import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  CalendarClock,
  TimerOff,
  Settings,
  Target,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import API from '../../services/api';
// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns { totalDays, days, hours, minutes, seconds, isPast } until the
 * given ISO date string (or Date object).
 */
function computeCountdown(examDate) {
  const now = new Date();
  const target = new Date(examDate);
  const diffMs = target - now;

  if (diffMs <= 0) {
    return { totalDays: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  return { totalDays: days, days, hours, minutes, seconds, isPast: false };
}

/**
 * Returns Tailwind-compatible colour tokens based on urgency level:
 *   - > 30 days  → emerald / green
 *   - 7–30 days  → amber / gold
 *   - < 7 days   → crimson / red
 */
function getUrgencyTheme(totalDays) {
  if (totalDays > 30) {
    return {
      ring: 'ring-emerald-500/60',
      border: 'border-emerald-600/40',
      badge: 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/40',
      accent: 'text-emerald-400',
      glowClass: '',
      label: 'Plenty of time',
      labelColor: 'text-emerald-400',
    };
  }
  if (totalDays >= 7) {
    return {
      ring: 'ring-amber-500/60',
      border: 'border-amber-600/40',
      badge: 'bg-amber-900/60 text-amber-300 border border-amber-600/40',
      accent: 'text-amber-400',
      glowClass: '',
      label: 'Time to accelerate',
      labelColor: 'text-amber-400',
    };
  }
  return {
    ring: 'ring-red-500/70',
    border: 'border-red-700/50',
    badge: 'bg-red-950/70 text-red-300 border border-red-700/50',
    accent: 'text-red-400',
    glowClass: 'shadow-[0_0_20px_rgba(239,68,68,0.35)]',
    label: 'Final sprint!',
    labelColor: 'text-red-400',
  };
}
const MOTIVATION_QUOTES = [
  'Small progress every day becomes a big result.',
  'Your future self is built by what you study today.',
  'Consistency beats intensity when preparation is long.',
  'One focused session today is one step closer to your goal.',
  'Keep going. Every revision makes you stronger.',
];

function getProgressPercentage(startDate, examDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(examDate).getTime();
  const now = Date.now();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;

  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

function getMilestoneState(milestone) {
  const diff = new Date(milestone.date).getTime() - Date.now();

  if (milestone.completed) return 'completed';
  if (diff < 0) return 'overdue';
  if (diff <= 7 * 24 * 60 * 60 * 1000) return 'approaching';

  return 'upcoming';
}
// ── Sub-components ────────────────────────────────────────────────────────────

const DigitBlock = ({ value, label, accentClass }) => (
  <div className="flex flex-col items-center min-w-[3.5rem]">
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`text-3xl font-bold font-mono tabular-nums leading-none ${accentClass}`}
    >
      {String(value).padStart(2, '0')}
    </motion.span>
    <span className="text-[10px] uppercase tracking-widest text-neutral-400 mt-0.5">{label}</span>
  </div>
);

const Separator = ({ accentClass }) => (
  <span className={`text-2xl font-bold pb-3 ${accentClass} opacity-70`}>:</span>
);

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * ExamCountdownWidget
 *
 * Props:
 *   - examDate  {string | Date}  ISO exam date (Exam.date from API)
 *   - examName  {string}         Human-readable exam name
 */
const ExamCountdownWidget = ({ examDate, examName }) => {
  const [preferences, setPreferences] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const navigate = useNavigate();

  const configuredExamDate = preferences?.targetExamDate || examDate;
  const configuredExamName = examName || 'Target Exam';

  const [countdown, setCountdown] = useState(() =>
    configuredExamDate ? computeCountdown(configuredExamDate) : null
  );

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await API.get('/users/exam-countdown');
        const data = response.data?.data;

        if (data) {
          setPreferences(data);
          localStorage.setItem('examCountdownPreferences', JSON.stringify(data));
        }
      } catch (error) {
        const cached = localStorage.getItem('examCountdownPreferences');

        if (cached) {
          setPreferences(JSON.parse(cached));
        }
      }
    };

    const cached = localStorage.getItem('examCountdownPreferences');

    if (cached) {
      try {
        setPreferences(JSON.parse(cached));
      } catch {
        localStorage.removeItem('examCountdownPreferences');
      }
    }

    loadPreferences();
  }, []);

  useEffect(() => {
    if (!configuredExamDate) return;
    setCountdown(computeCountdown(configuredExamDate));
    const id = setInterval(() => {
      setCountdown(computeCountdown(configuredExamDate));
    }, 1000);
    return () => clearInterval(id);
  }, [configuredExamDate]);

  useEffect(() => {
    if (!configuredExamDate) return;
    const id = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % MOTIVATION_QUOTES.length);
    }, 30000);
    return () => clearInterval(id);
  }, [configuredExamDate]);

  const savePreferences = async (nextPreferences) => {
    setSaving(true);
    try {
      setPreferences(nextPreferences);
      localStorage.setItem('examCountdownPreferences', JSON.stringify(nextPreferences));
      await API.put('/users/exam-countdown', nextPreferences);
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to save exam countdown preferences', error);
    } finally {
      setSaving(false);
    }
  };

  // If no exam is set, render a prompt button
  if (!countdown) {
    return (
      <div className="relative rounded-lg border border-amber-600/40 bg-neutral-900/80 p-4">
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="w-full flex items-center justify-center gap-2 text-amber-300 text-sm font-semibold"
        >
          <CalendarClock className="w-4 h-4" />
          Set your target exam
        </button>
      </div>
    );
  }

  const { days, hours, minutes, seconds, isPast } = countdown;
  const theme = getUrgencyTheme(days);
  const isCritical = days < 7 && !isPast;
  const startDate =
    preferences?.createdAt ||
    localStorage.getItem('examCountdownStartedAt') ||
    new Date().toISOString();

  if (!localStorage.getItem('examCountdownStartedAt') && configuredExamDate) {
    localStorage.setItem('examCountdownStartedAt', new Date().toISOString());
  }

  const timeProgress = getProgressPercentage(startDate, configuredExamDate);
  const milestones = preferences?.milestones || [];
  const completedMilestones = milestones.filter((m) => m.completed).length;
  const milestoneProgress = milestones.length
    ? Math.round((completedMilestones / milestones.length) * 100)
    : 0;

  return (
    <AnimatePresence>
      <motion.div
        id="exam-countdown-widget"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4 }}
        className={`
          relative rounded-lg border bg-neutral-900/80 backdrop-blur-sm p-4
          ring-1 ${theme.ring} ${theme.border} ${theme.glowClass}
          flex flex-col gap-3 min-w-[280px]
        `}
        aria-label={`Exam countdown: ${configuredExamName}`}
        role="timer"
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className={`w-4 h-4 shrink-0 ${theme.accent}`} />
            <div className="flex flex-col">
              <span className="text-neutral-300 text-xs font-semibold tracking-wide uppercase truncate max-w-[160px]">
                {configuredExamName}
              </span>
              {preferences?.targetScore != null && (
                <span className="text-[10px] text-neutral-500">
                  Target score: {preferences.targetScore}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}>
              {theme.label}
            </span>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="p-1.5 rounded-md text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 transition-colors"
              aria-label="Edit exam countdown settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Countdown digits */}
        {isPast ? (
          <div className="flex items-center gap-2 text-neutral-400 text-sm italic">
            <TimerOff className="w-4 h-4" />
            <span>Exam date has passed</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 justify-center py-1">
            <DigitBlock value={days}    label="Days" accentClass={theme.accent} />
            <Separator accentClass={theme.accent} />
            <DigitBlock value={hours}   label="Hrs"  accentClass={theme.accent} />
            <Separator accentClass={theme.accent} />
            <DigitBlock value={minutes} label="Min"  accentClass={theme.accent} />
            <Separator accentClass={theme.accent} />
            <DigitBlock value={seconds} label="Sec"  accentClass={theme.accent} />
          </div>
        )}

        {/* Progress rings */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex flex-col items-center">
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(currentColor ${timeProgress}%, rgb(38 38 38) ${timeProgress}% 100%)`,
              }}
            >
              <div className="absolute inset-1 rounded-full bg-neutral-900 flex items-center justify-center">
                <span className={`text-sm font-bold ${theme.accent}`}>
                  {Math.round(timeProgress)}%
                </span>
              </div>
            </div>
            <span className="text-[10px] text-neutral-400 mt-1">Time elapsed</span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(currentColor ${milestoneProgress}%, rgb(38 38 38) ${milestoneProgress}% 100%)`,
              }}
            >
              <div className="absolute inset-1 rounded-full bg-neutral-900 flex items-center justify-center">
                <span className="text-sm font-bold text-amber-400">
                  {milestoneProgress}%
                </span>
              </div>
            </div>
            <span className="text-[10px] text-neutral-400 mt-1">Milestones</span>
          </div>
        </div>

        {/* Milestones */}
        {milestones.length > 0 && (
          <div className="border-t border-neutral-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400">
                Study milestones
              </span>
              <span className="text-[10px] text-neutral-500">
                {completedMilestones}/{milestones.length}
              </span>
            </div>
            <div className="space-y-2">
              {milestones.map((milestone) => {
                const state = getMilestoneState(milestone);
                return (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {state === 'completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      )}
                      <span className="truncate text-neutral-300">{milestone.title}</span>
                    </div>
                    <span
                      className={
                        state === 'overdue'
                          ? 'text-red-400'
                          : state === 'approaching'
                          ? 'text-amber-400'
                          : state === 'completed'
                          ? 'text-emerald-400'
                          : 'text-neutral-500'
                      }
                    >
                      {state === 'overdue'
                        ? 'Overdue'
                        : state === 'approaching'
                        ? 'Soon'
                        : state === 'completed'
                        ? 'Done'
                        : new Date(milestone.date).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Motivation quote */}
        <div className="border-t border-neutral-800 pt-3">
          <p className="text-xs text-neutral-400 italic text-center">
            "{MOTIVATION_QUOTES[quoteIndex]}"
          </p>
          <button
            type="button"
            onClick={() => setQuoteIndex((i) => (i + 1) % MOTIVATION_QUOTES.length)}
            className="block mx-auto mt-1 text-[10px] text-amber-400 hover:text-amber-300"
          >
            New motivation
          </button>
        </div>

        {/* 7-Day Sprint CTA */}
        {isCritical && (
          <motion.button
            id="launch-7-day-sprint-btn"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/dashboard?mode=sprint')}
            className="
              w-full flex items-center justify-center gap-2
              bg-gradient-to-r from-red-700 via-red-600 to-red-700
              text-white text-xs font-bold uppercase tracking-widest
              px-3 py-2 rounded-md border border-red-500/60
              shadow-[0_0_12px_rgba(239,68,68,0.4)]
              hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]
              hover:from-red-600 hover:to-red-600
              transition-all duration-200 cursor-pointer animate-pulse
            "
            aria-label="Launch 7-Day Sprint Revision"
          >
            <Zap className="w-3.5 h-3.5 shrink-0" fill="currentColor" />
            Launch 7-Day Sprint Revision
          </motion.button>
        )}
        
        {showSettings && (
          <div role="dialog" aria-label="Exam countdown settings" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-neutral-900 p-4 rounded-lg shadow-xl">
              <h2 className="text-white text-lg font-bold mb-4">Exam Countdown Settings</h2>
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-indigo-600 text-white rounded">
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ExamCountdownWidget;