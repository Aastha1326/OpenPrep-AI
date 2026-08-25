import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Target,
  Award,
  Clock,
  Brain,
  Zap,
  Star,
  ChevronRight,
  BookOpen,
  Trophy,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { formatDuration, formatPercent, getStreakTier } from './progressTypes';

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
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20`, color }}
          >
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

const SubjectProgressCard = ({ subject, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.3 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5 hover:shadow-lg transition-all duration-300 cursor-pointer group"
  >
    <div className="flex items-center gap-3 mb-4">
      <span className="text-2xl">{subject.icon}</span>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{subject.name}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subject.totalHours}h studied • {subject.quizzesTaken} quizzes</p>
      </div>
      <span className="text-lg font-bold" style={{ color: subject.color }}>{subject.completionPercent}%</span>
    </div>
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${subject.completionPercent}%` }}
        transition={{ delay: delay + 0.3, duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ backgroundColor: subject.color }}
      />
    </div>
    <div className="flex items-center justify-between mt-3">
      <div className="flex gap-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">{subject.topicsCovered}</span>/{subject.totalTopics} topics
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">{subject.avgAccuracy}%</span> accuracy
        </span>
      </div>
      <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors" />
    </div>
  </motion.div>
);

const MilestoneCard = ({ milestone, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.3 }}
    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-white/5 ${
      milestone.isNew ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-200/30' : ''
    }`}
  >
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
      style={{ backgroundColor: `${milestone.color}20` }}
    >
      {milestone.icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{milestone.label}</p>
        {milestone.isNew && (
          <span className="text-[10px] font-bold bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full">NEW</span>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{milestone.description}</p>
    </div>
    <span className="text-xs text-gray-400 flex-shrink-0">{milestone.dateLabel}</span>
  </motion.div>
);

const GoalProgressCard = ({ goal, delay = 0 }) => {
  const percent = Math.min((goal.current / goal.target) * 100, 100);
  const isComplete = goal.current >= goal.target;
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="glass-card rounded-2xl p-4 border border-white/20 dark:border-white/5"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{goal.label}</span>
        {isComplete ? (
          <CheckCircle2 size={18} className="text-green-500" />
        ) : (
          <span className="text-xs text-gray-500 dark:text-gray-400">{goal.unit}</span>
        )}
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-xl font-bold text-gray-900 dark:text-white">{goal.current}</span>
        <span className="text-sm text-gray-400 mb-0.5">/ {goal.target}</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ delay: delay + 0.3, duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-indigo-500'}`}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">{percent.toFixed(0)}% complete</p>
    </motion.div>
  );
};

const StreakDisplay = ({ streak, longest }) => {
  const tier = getStreakTier(streak);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-2xl p-6 border border-white/20 dark:border-white/5 text-center"
    >
      <div className="text-5xl mb-2">{tier.emoji}</div>
      <p className="text-4xl font-black text-gray-900 dark:text-white">{streak}</p>
      <p className="text-sm font-medium mt-1" style={{ color: tier.color }}>{tier.label}</p>
      <p className="text-xs text-gray-400 mt-1">day streak</p>
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">Longest: <span className="font-semibold text-gray-700 dark:text-gray-300">{longest} days</span></p>
      </div>
    </motion.div>
  );
};

const ActivityLogItem = ({ activity, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.2 }}
    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-200"
  >
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
      style={{ backgroundColor: `${activity.color}20` }}
    >
      {activity.icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {activity.subjectName} • {activity.duration}min
        {activity.score !== null && ` • ${activity.score}%`}
      </p>
    </div>
    <span className="text-xs text-gray-400 flex-shrink-0">{activity.timeLabel}</span>
  </motion.div>
);

const LeaderboardRow = ({ entry, delay = 0, isCurrentUser = false }) => (
  <motion.div
    initial={{ opacity: 0, x: -15 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.2 }}
    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
      isCurrentUser ? 'bg-indigo-500/10 border border-indigo-300/30' : 'hover:bg-white/5'
    }`}
  >
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
      entry.rank <= 3 ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
    }`}>
      {entry.rank}
    </div>
    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
      <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{entry.name}</p>
        {entry.rankChange > 0 && <span className="text-green-500 text-xs">↑{entry.rankChange}</span>}
        {entry.rankChange < 0 && <span className="text-red-500 text-xs">↓{Math.abs(entry.rankChange)}</span>}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {entry.totalPoints.toLocaleString()} pts • {entry.currentStreak}🔥 streak
      </p>
    </div>
    <div className="text-right flex-shrink-0">
      <p className="text-sm font-bold text-gray-900 dark:text-white">{entry.avgAccuracy}%</p>
      <p className="text-xs text-gray-400">accuracy</p>
    </div>
  </motion.div>
);

const PredictionCard = ({ prediction, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
  >
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xl">{prediction.icon}</span>
      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{prediction.subjectName}</h4>
    </div>
    <div className="flex items-end justify-between mb-3">
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{prediction.currentScore}%</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500 dark:text-gray-400">Predicted</p>
        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{prediction.predictedScore}%</p>
      </div>
    </div>
    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${prediction.predictedScore}%` }} />
    </div>
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500 dark:text-gray-400">Confidence: {(prediction.confidence * 100).toFixed(0)}%</span>
      <span className="text-amber-600 dark:text-amber-400">~{prediction.neededHours}h more needed</span>
    </div>
    <div className="mt-2 flex flex-wrap gap-1">
      {prediction.weakTopics.map((topic, i) => (
        <span key={i} className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
          {topic}
        </span>
      ))}
    </div>
  </motion.div>
);

const PeerComparisonRow = ({ peer, delay = 0 }) => {
  const diff = peer.yourScore - peer.avgScore;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2 }}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all"
    >
      <span className="text-lg">{peer.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{peer.subject}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
            <div className="absolute h-full bg-gray-300 dark:bg-gray-600 rounded-full" style={{ width: `${peer.avgScore}%` }} />
            <div className="absolute h-full bg-indigo-500 rounded-full" style={{ width: `${peer.yourScore}%` }} />
          </div>
          <span className={`text-xs font-semibold ${diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Top {100 - peer.percentile}%</p>
      </div>
    </motion.div>
  );
};

const HeatmapCell = ({ hours, dayLabel, weekLabel }) => {
  const intensity = Math.min(hours / 6, 1);
  const bgColor = hours === 0
    ? 'bg-gray-100 dark:bg-gray-800'
    : `bg-indigo-${intensity > 0.6 ? '500' : intensity > 0.3 ? '400' : '300'}`;

  return (
    <div
      className={`w-4 h-4 rounded-sm ${bgColor} cursor-pointer transition-transform hover:scale-125`}
      title={`${weekLabel} ${dayLabel}: ${hours.toFixed(1)}h`}
      style={hours > 0 ? {
        backgroundColor: `rgba(99, 102, 241, ${0.2 + intensity * 0.8})`,
      } : undefined}
    />
  );
};

export {
  StatCard,
  SubjectProgressCard,
  MilestoneCard,
  GoalProgressCard,
  StreakDisplay,
  ActivityLogItem,
  LeaderboardRow,
  PredictionCard,
  PeerComparisonRow,
  HeatmapCell,
};
