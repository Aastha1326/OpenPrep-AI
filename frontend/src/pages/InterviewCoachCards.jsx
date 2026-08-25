import { motion } from 'framer-motion';
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
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Play,
  BarChart3,
  Timer,
  BookOpen,
} from 'lucide-react';
import { useState } from 'react';
import { FEEDBACK_CATEGORIES, getScoreRubric, INTERVIEW_TYPES } from './interviewCoachTypes';
import { formatDuration } from './interviewCoachTypes';

const MetricCard = ({ icon: Icon, label, value, subValue, trend, trendValue, color = '#6366f1', delay = 0 }) => {
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

const QuestionCard = ({ question, index, isExpanded, onToggle, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="glass-card rounded-2xl border border-white/20 dark:border-white/5 overflow-hidden"
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-all"
    >
      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{question.text}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${question.difficulty.bgColor}`}>
            {question.difficulty.label}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">{question.category}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {question.score !== undefined && (
          <span className={`text-sm font-bold ${
            question.score >= 80 ? 'text-green-600 dark:text-green-400'
            : question.score >= 60 ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-600 dark:text-red-400'
          }`}>
            {question.score}%
          </span>
        )}
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </div>
    </button>

    {isExpanded && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800"
      >
        {question.sampleAnswer && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Sample Answer:</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{question.sampleAnswer}</p>
          </div>
        )}
        {question.hints && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Hints:</p>
            <div className="flex flex-wrap gap-1">
              {question.hints.map((h, i) => (
                <span key={i} className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}
        {question.keyPoints && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Key Points:</p>
            <div className="space-y-1">
              {question.keyPoints.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                  {p}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    )}
  </motion.div>
);

const FeedbackScoreCard = ({ category, score, delay = 0 }) => {
  const rubric = getScoreRubric(score);
  const config = FEEDBACK_CATEGORIES[category];
  if (!config) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="glass-card rounded-2xl p-4 border border-white/20 dark:border-white/5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{config.label}</span>
        </div>
        <span className="text-lg font-bold" style={{ color: rubric.color }}>{score}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: delay + 0.3, duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: rubric.color }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-medium" style={{ color: rubric.color }}>{rubric.emoji} {rubric.label}</span>
        <span className="text-xs text-gray-400">Weight: {(config.weight * 100).toFixed(0)}%</span>
      </div>
    </motion.div>
  );
};

const ResponseReviewCard = ({ response, index, delay = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const rubric = getScoreRubric(response.score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="glass-card rounded-2xl border border-white/20 dark:border-white/5 overflow-hidden"
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 cursor-pointer hover:bg-white/5 transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${rubric.color}20` }}>
            <span className="text-lg">{rubric.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{response.question}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-bold" style={{ color: rubric.color }}>{response.score}%</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock size={10} /> {formatDuration(response.duration)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{response.category}</span>
            </div>
          </div>
          <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 mt-1 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-4 pb-4 space-y-3"
        >
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">AI Feedback:</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{response.aiFeedback}</p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {Object.entries(response.feedbackScores).map(([cat, score]) => (
              <div key={cat} className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{cat.replace('_', ' ')}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(score)}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {response.strengths.map((s, i) => (
              <span key={i} className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 size={10} /> {s}
              </span>
            ))}
            {response.improvements.map((imp, i) => (
              <span key={i} className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lightbulb size={10} /> {imp}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const TipCard = ({ tip, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -15 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.3 }}
    className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
      tip.priority === 'high'
        ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/30'
        : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
    }`}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
      tip.priority === 'high' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
    }`}>
      <Lightbulb size={16} />
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{tip.title}</p>
        {tip.priority === 'high' && (
          <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-bold">HIGH</span>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tip.tip}</p>
    </div>
  </motion.div>
);

const SessionHistoryCard = ({ session, delay = 0 }) => {
  const rubric = getScoreRubric(session.overallScore);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="glass-card rounded-2xl p-4 border border-white/20 dark:border-white/5 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${session.color}20` }}>
          {session.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{session.label} Interview</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {session.dateLabel} • {session.questionsAnswered} questions • {formatDuration(session.avgDuration)} avg
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-black" style={{ color: rubric.color }}>{session.overallScore}%</p>
          <p className="text-xs" style={{ color: rubric.color }}>{rubric.label}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Zap size={12} className="text-amber-500" />
        <span className="text-xs text-gray-500 dark:text-gray-400">Top: {session.topStrength}</span>
      </div>
    </motion.div>
  );
};

const WeeklyGoalCard = ({ goal, delay = 0 }) => {
  const metrics = [
    { label: 'Sessions', current: goal.completedSessions, target: goal.targetSessions, icon: '🎯' },
    { label: 'Questions', current: goal.completedQuestions, target: goal.targetQuestions, icon: '❓' },
    { label: 'Hours', current: goal.completedHours, target: goal.targetHours, icon: '⏰' },
    { label: 'Accuracy', current: goal.currentAccuracy, target: goal.targetAccuracy, icon: '🎯', unit: '%' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Target size={16} className="text-indigo-500" /> Weekly Goals
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m, i) => {
          const percent = Math.min((m.current / m.target) * 100, 100);
          const isComplete = m.current >= m.target;
          return (
            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  {m.icon} {m.label}
                </span>
                {isComplete && <CheckCircle2 size={14} className="text-green-500" />}
              </div>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{m.current}{m.unit || ''}</span>
                <span className="text-xs text-gray-400 mb-0.5">/ {m.target}{m.unit || ''}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

const StartSessionCard = ({ onStart, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.4 }}
    className="glass-card rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800/30 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10"
  >
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
        <Play size={28} className="text-white ml-1" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Start Mock Interview</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Practice with AI-powered questions and get instant feedback</p>
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {Object.values(INTERVIEW_TYPES).map(type => (
          <span key={type.label} className="text-xs px-2 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
            {type.icon} {type.label}
          </span>
        ))}
      </div>
      <button
        onClick={onStart}
        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all text-sm"
      >
        Begin Practice Session
      </button>
    </div>
  </motion.div>
);

export {
  MetricCard,
  QuestionCard,
  FeedbackScoreCard,
  ResponseReviewCard,
  TipCard,
  SessionHistoryCard,
  WeeklyGoalCard,
  StartSessionCard,
};
