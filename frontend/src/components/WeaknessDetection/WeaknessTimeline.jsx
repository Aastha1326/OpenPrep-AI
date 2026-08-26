import React from 'react';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Zap,
  BookOpen,
  Calendar,
} from 'lucide-react';

const snapshotTypeLabels = {
  auto: { label: 'Auto Snapshot', icon: Clock, color: 'text-gray-500' },
  manual: { label: 'Manual Analysis', icon: FileText, color: 'text-blue-500' },
  'post-quiz': { label: 'Post-Quiz', icon: Zap, color: 'text-purple-500' },
  'post-study': { label: 'Post-Study', icon: BookOpen, color: 'text-emerald-500' },
};

const TimelineEntry = ({ report, isLast }) => {
  const date = new Date(report.createdAt);
  const timeAgo = getTimeAgo(date);
  const typeInfo = snapshotTypeLabels[report.snapshotType] || snapshotTypeLabels.auto;
  const TypeIcon = typeInfo.icon;

  const TrendIcon =
    report.trendDirection === 'improving'
      ? TrendingUp
      : report.trendDirection === 'declining'
        ? TrendingDown
        : Minus;

  const trendColor =
    report.trendDirection === 'improving'
      ? 'text-emerald-500'
      : report.trendDirection === 'declining'
        ? 'text-red-500'
        : 'text-gray-500';

  return (
    <div className="flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-3 h-3 rounded-full border-2 ${
            report.trendDirection === 'improving'
              ? 'bg-emerald-400 border-emerald-200 dark:border-emerald-800'
              : report.trendDirection === 'declining'
                ? 'bg-red-400 border-red-200 dark:border-red-800'
                : 'bg-gray-400 border-gray-200 dark:border-gray-700'
          }`}
        />
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <TypeIcon className={`w-3.5 h-3.5 ${typeInfo.color}`} />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {typeInfo.label}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {report.overallScore}%
          </span>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">
              {report.comparisonDelta > 0 ? '+' : ''}
              {report.comparisonDelta}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            {report.weakCount} weak
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            {report.mediumCount} medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {report.strongCount} strong
          </span>
        </div>
      </div>
    </div>
  );
};

function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const WeaknessTimeline = ({ reports = [] }) => {
  if (!reports || reports.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <Calendar className="w-5 h-5 inline mr-2" />
          Analysis Timeline
        </h3>
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No analysis history yet</p>
            <p className="text-xs mt-1">Run your first weakness analysis to start tracking</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        <Calendar className="w-5 h-5 inline mr-2" />
        Analysis Timeline
      </h3>

      <div className="space-y-0">
        {reports.map((report, index) => (
          <TimelineEntry
            key={report.id}
            report={report}
            isLast={index === reports.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default WeaknessTimeline;
