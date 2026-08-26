import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Award,
  Brain,
  Zap,
  Star,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Calendar,
  Bell,
  BellOff,
  BookOpen,
  Timer,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  SPACED_REPETITION_LEVELS,
  REVIEW_TYPES,
  REMINDER_TYPES,
  formatDuration,
  formatDate,
  getIntervalLabel,
} from './revisionTypes';

const StatCard = ({ icon: Icon, label, value, subValue, trend, trendValue, color = '#6366f1', delay = 0 }) => {
  const isPositive = trend === 'up';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
            <Icon size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
          </div>
        </div>
        {trendValue !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trendValue)}%
          </div>
        )}
      </div>
      {subValue && <p className="text-xs text-gray-400 mt-2">{subValue}</p>}
    </motion.div>
  );
};

const FlashcardItem = ({ card, delay = 0, onReview }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const level = SPACED_REPETITION_LEVELS[card.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`glass-card rounded-2xl border overflow-hidden transition-all ${
        card.isOverdue ? 'border-red-300 dark:border-red-800/50' : 'border-white/20 dark:border-white/5'
      }`}
    >
      <div
        className={`p-4 cursor-pointer transition-all min-h-[120px] flex flex-col justify-center ${
          isFlipped ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${level.color}20`, color: level.color }}>
            {level.emoji} {level.label}
          </span>
          <span className="text-xs text-gray-400">{card.subjectIcon} {card.subjectName}</span>
        </div>
        <p className={`text-sm font-semibold ${isFlipped ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'} text-center`}>
          {isFlipped ? card.back : card.front}
        </p>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          {isFlipped ? 'Click to see front' : 'Click to reveal answer'}
        </p>
      </div>

      <div className="px-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>EF: {card.easeFactor.toFixed(1)}</span>
          <span>Interval: {getIntervalLabel(card.interval)}</span>
          <span>×{card.streak}</span>
        </div>
        {card.isOverdue && (
          <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">
            {card.daysOverdue}d overdue
          </span>
        )}
      </div>

      {!isFlipped && (
        <div className="px-4 pb-3 flex gap-2">
          <button className="flex-1 text-xs py-2 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium hover:bg-red-200 dark:hover:bg-red-900/30 transition-all">
            😟 Again
          </button>
          <button className="flex-1 text-xs py-2 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium hover:bg-amber-200 dark:hover:bg-amber-900/30 transition-all">
            🤔 Hard
          </button>
          <button className="flex-1 text-xs py-2 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium hover:bg-green-200 dark:hover:bg-green-900/30 transition-all">
            😊 Good
          </button>
          <button className="flex-1 text-xs py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/30 transition-all">
            🌟 Easy
          </button>
        </div>
      )}
    </motion.div>
  );
};

const ReviewScheduleCard = ({ slot, delay = 0 }) => {
  const typeConfig = REVIEW_TYPES[slot.reviewType];
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2 }}
      className={`flex items-center gap-3 p-3 rounded-xl border-l-3 transition-all ${
        slot.completed
          ? 'bg-green-50 dark:bg-green-900/10 border-l-green-400'
          : slot.priority === 'urgent'
          ? 'bg-red-50 dark:bg-red-900/10 border-l-red-400'
          : slot.priority === 'high'
          ? 'bg-amber-50 dark:bg-amber-900/10 border-l-amber-400'
          : 'bg-white dark:bg-gray-800/50 border-l-indigo-300'
      }`}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: `${typeConfig?.color || '#6366f1'}20` }}>
        {typeConfig?.icon || '📝'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{slot.subjectIcon} {slot.subjectName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{slot.label} • {slot.time} • {slot.estimatedMinutes}min</p>
      </div>
      <div className="text-right flex-shrink-0">
        {slot.completed ? (
          <CheckCircle2 size={18} className="text-green-500" />
        ) : (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            slot.priority === 'urgent' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            : slot.priority === 'high' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {slot.priority}
          </span>
        )}
      </div>
    </motion.div>
  );
};

const SubjectRetentionCard = ({ subject, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="glass-card rounded-2xl p-4 border border-white/20 dark:border-white/5 hover:shadow-lg transition-all"
  >
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xl">{subject.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{subject.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subject.totalCards} cards • Last: {formatDate(subject.lastReview)}</p>
      </div>
      <span className="text-lg font-bold" style={{ color: subject.retentionRate >= 80 ? '#22c55e' : subject.retentionRate >= 60 ? '#f59e0b' : '#ef4444' }}>
        {subject.retentionRate}%
      </span>
    </div>
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${subject.retentionRate}%` }}
        transition={{ delay: delay + 0.3, duration: 0.8 }}
        className="h-full rounded-full"
        style={{ backgroundColor: subject.retentionRate >= 80 ? '#22c55e' : subject.retentionRate >= 60 ? '#f59e0b' : '#ef4444' }}
      />
    </div>
    <div className="flex items-center justify-between text-xs text-gray-400">
      <span>EF: {subject.avgEaseFactor.toFixed(1)}</span>
      <span>Mastered: {subject.masteredPercent}%</span>
      <span>{subject.reviewsDue} due</span>
    </div>
    {subject.weakTopics.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-2">
        {subject.weakTopics.slice(0, 2).map((t, i) => (
          <span key={i} className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">{t}</span>
        ))}
      </div>
    )}
  </motion.div>
);

const ReminderCard = ({ reminder, delay = 0, onToggle }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.2 }}
    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
      reminder.enabled ? 'bg-indigo-50 dark:bg-indigo-900/10' : 'bg-gray-50 dark:bg-gray-800/50 opacity-60'
    }`}
  >
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${reminder.color}20` }}>
      <span className="text-lg">{reminder.icon}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-white">{reminder.label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{reminder.time} • {reminder.days.join(', ')} • Min {reminder.minCards} cards</p>
    </div>
    <button
      onClick={() => onToggle && onToggle(reminder.id)}
      className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${
        reminder.enabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${reminder.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  </motion.div>
);

const OptimalSlotCard = ({ slot, delay = 0 }) => {
  const typeConfig = REVIEW_TYPES[slot.type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
    >
      <div className="text-center flex-shrink-0 w-12">
        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{slot.time}</p>
      </div>
      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{slot.label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{typeConfig?.icon} {typeConfig?.label} • {slot.cardsTarget} cards • {slot.estimatedMinutes}min</p>
      </div>
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
        slot.intensity === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        : slot.intensity === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
        : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
      }`}>
        {slot.intensity}
      </span>
    </motion.div>
  );
};

const ForgettingCurveInfo = ({ delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.4 }}
    className="glass-card rounded-2xl p-5 border border-indigo-200 dark:border-indigo-800/30 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10"
  >
    <div className="flex items-center gap-2 mb-3">
      <Sparkles size={18} className="text-indigo-500" />
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Spaced Repetition Science</h3>
    </div>
    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
      Your brain forgets 58% within the first hour. Spaced repetition fights this by reviewing at optimal intervals — just before you'd forget.
    </p>
    <div className="grid grid-cols-3 gap-3 text-center">
      <div className="p-2 bg-white dark:bg-gray-800 rounded-xl">
        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">2.5x</p>
        <p className="text-[10px] text-gray-500">Better retention</p>
      </div>
      <div className="p-2 bg-white dark:bg-gray-800 rounded-xl">
        <p className="text-lg font-bold text-green-600 dark:text-green-400">50%</p>
        <p className="text-[10px] text-gray-500">Less study time</p>
      </div>
      <div className="p-2 bg-white dark:bg-gray-800 rounded-xl">
        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">30d</p>
        <p className="text-[10px] text-gray-500">To mastery</p>
      </div>
    </div>
  </motion.div>
);

const StreakCard = ({ streak, longest, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.4 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5 text-center"
  >
    <div className="text-4xl mb-2">🔥</div>
    <p className="text-3xl font-black text-gray-900 dark:text-white">{streak}</p>
    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">day streak</p>
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      <p className="text-xs text-gray-500 dark:text-gray-400">Longest: <span className="font-semibold text-gray-700 dark:text-gray-300">{longest} days</span></p>
    </div>
  </motion.div>
);

export {
  StatCard,
  FlashcardItem,
  ReviewScheduleCard,
  SubjectRetentionCard,
  ReminderCard,
  OptimalSlotCard,
  ForgettingCurveInfo,
  StreakCard,
};
