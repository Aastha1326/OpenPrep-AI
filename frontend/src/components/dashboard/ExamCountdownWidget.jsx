import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, CalendarClock, TimerOff } from 'lucide-react';

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
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(() =>
    examDate ? computeCountdown(examDate) : null
  );

  useEffect(() => {
    if (!examDate) return;
    // Recalculate once immediately on mount / examDate change
    setCountdown(computeCountdown(examDate));

    const timer = setInterval(() => {
      setCountdown(computeCountdown(examDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [examDate]);

  // If no exam is set, render nothing
  if (!examDate || !countdown) return null;

  const { days, hours, minutes, seconds, isPast } = countdown;
  const theme = getUrgencyTheme(days);
  const isCritical = days < 7 && !isPast;

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
        aria-label={`Exam countdown: ${examName}`}
        role="timer"
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className={`w-4 h-4 shrink-0 ${theme.accent}`} />
            <span className="text-neutral-300 text-xs font-semibold tracking-wide uppercase truncate max-w-[160px]">
              {examName || 'Target Exam'}
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}>
            {theme.label}
          </span>
        </div>

        {/* Countdown digits */}
        {isPast ? (
          <div className="flex items-center gap-2 text-neutral-400 text-sm italic">
            <TimerOff className="w-4 h-4" />
            <span>Exam date has passed</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 justify-center py-1">
            <DigitBlock value={days}    label="Days"    accentClass={theme.accent} />
            <Separator accentClass={theme.accent} />
            <DigitBlock value={hours}   label="Hrs"     accentClass={theme.accent} />
            <Separator accentClass={theme.accent} />
            <DigitBlock value={minutes} label="Min"     accentClass={theme.accent} />
            <Separator accentClass={theme.accent} />
            <DigitBlock value={seconds} label="Sec"     accentClass={theme.accent} />
          </div>
        )}

        {/* 7-Day Sprint CTA – only when < 7 days remain */}
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
              transition-all duration-200 cursor-pointer
              animate-pulse
            "
            aria-label="Launch 7-Day Sprint Revision"
          >
            <Zap className="w-3.5 h-3.5 shrink-0" fill="currentColor" />
            Launch 7-Day Sprint Revision
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ExamCountdownWidget;
