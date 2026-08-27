import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Target,
  BarChart3,
  Zap,
  ChevronRight,
} from 'lucide-react';

const statusConfig = {
  Weak: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    ring: 'ring-red-200 dark:ring-red-800',
    progressColor: 'bg-red-500',
  },
  Medium: {
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    ring: 'ring-amber-200 dark:ring-amber-800',
    progressColor: 'bg-amber-500',
  },
  Strong: {
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
    progressColor: 'bg-emerald-500',
  },
};

const VelocityIndicator = ({ velocity }) => {
  if (velocity > 0.1) {
    return (
      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
        <TrendingUp className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">+{(velocity * 100).toFixed(0)}%</span>
      </div>
    );
  }
  if (velocity < -0.1) {
    return (
      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
        <TrendingDown className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{(velocity * 100).toFixed(0)}%</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
      <Minus className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">Stable</span>
    </div>
  );
};

const TopicMasteryCard = ({ topic, onClick }) => {
  const config = statusConfig[topic.status] || statusConfig.Medium;

  const timeSinceLastAttempt = topic.lastAttemptAt
    ? Math.floor(
        (Date.now() - new Date(topic.lastAttemptAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all hover:shadow-lg hover:scale-[1.01] cursor-pointer ${config.bg} ${config.border}`}
      onClick={onClick}
    >
      {/* Status badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.badge}`}
        >
          {topic.status}
        </span>
        <VelocityIndicator velocity={topic.improvementVelocity} />
      </div>

      {/* Topic name */}
      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 truncate">
        {topic.topicName}
      </h4>

      {/* Score display */}
      <div className="flex items-end gap-2 mb-3">
        <span className={`text-3xl font-extrabold ${config.color}`}>{topic.avgScore}%</span>
        {topic.weightage > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Weight: {topic.weightage}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${config.progressColor}`}
          style={{ width: `${Math.min(100, topic.avgScore)}%` }}
        />
      </div>

      {/* Meta info */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          <span>{topic.attemptCount} attempts</span>
        </div>
        <div className="flex items-center gap-1">
          <BarChart3 className="w-3 h-3" />
          <span>Conf: {Math.round(topic.confidenceScore * 100)}%</span>
        </div>
      </div>

      {timeSinceLastAttempt !== null && (
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 dark:text-gray-500">
          <Clock className="w-3 h-3" />
          <span>
            {timeSinceLastAttempt === 0
              ? 'Attempted today'
              : `${timeSinceLastAttempt}d ago`}
          </span>
        </div>
      )}

      {/* Urgency indicator for weak + high weightage */}
      {topic.status === 'Weak' && topic.weightage > 5 && (
        <div className="absolute top-2 right-2">
          <Zap className="w-4 h-4 text-red-500 animate-pulse" />
        </div>
      )}

      {onClick && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default TopicMasteryCard;
