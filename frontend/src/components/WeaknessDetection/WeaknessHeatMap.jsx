import React, { useState } from 'react';
import { Grid3X3, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

/**
 * WeaknessHeatMap — renders a visual heatmap grid where:
 * - Rows = subjects
 * - Cells = topics within each subject
 * - Color = red (Weak), yellow (Medium), green (Strong)
 * - Opacity = confidence score
 */

const statusColors = {
  Weak: {
    bg: 'bg-red-100 dark:bg-red-900/40',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
  },
  Medium: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  Strong: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    border: 'border-emerald-300 dark:border-emerald-700',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
};

const StatusIcon = ({ status }) => {
  if (status === 'Weak') return <XCircle className="w-3.5 h-3.5 text-red-500" />;
  if (status === 'Medium') return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
  return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
};

const TopicCell = ({ topic }) => {
  const colors = statusColors[topic.status] || statusColors.Medium;
  const confidenceOpacity = Math.max(0.4, topic.confidenceScore);

  return (
    <div
      className={`relative rounded-lg border p-2.5 transition-all hover:scale-105 hover:shadow-md cursor-default ${colors.bg} ${colors.border}`}
      style={{ opacity: confidenceOpacity }}
      title={`${topic.topicName}\nScore: ${topic.avgScore}%\nStatus: ${topic.status}\nAttempts: ${topic.attemptCount}\nConfidence: ${Math.round(topic.confidenceScore * 100)}%`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <StatusIcon status={topic.status} />
        <span className={`text-xs font-medium truncate ${colors.text}`}>
          {topic.topicName}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-lg font-bold ${colors.text}`}>{topic.avgScore}%</span>
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          {topic.attemptCount} attempt{topic.attemptCount !== 1 ? 's' : ''}
        </span>
      </div>
      {/* Confidence bar */}
      <div className="mt-1.5 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${topic.status === 'Weak' ? 'bg-red-400' : topic.status === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'}`}
          style={{ width: `${topic.confidenceScore * 100}%` }}
        />
      </div>
      <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 block">
        Confidence: {Math.round(topic.confidenceScore * 100)}%
      </span>
    </div>
  );
};

const SubjectRow = ({ subject }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left mb-2 group"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        )}
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          {subject.subjectName}
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({subject.weakTopics}/{subject.totalTopics} weak)
        </span>
        <div className="flex-1" />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
          Avg: {subject.avgScore}%
        </span>
      </button>

      {expanded && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 ml-6">
          {subject.topics.map((topic) => (
            <TopicCell key={topic.topicId} topic={topic} />
          ))}
        </div>
      )}
    </div>
  );
};

const WeaknessHeatMap = ({ heatmap = [], summary = null }) => {
  if (!heatmap || heatmap.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <Grid3X3 className="w-5 h-5 inline mr-2" />
          Weakness Heatmap
        </h3>
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Grid3X3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No topic data available</p>
            <p className="text-xs mt-1">Add subjects and topics to see your heatmap</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          <Grid3X3 className="w-5 h-5 inline mr-2" />
          Weakness Heatmap
        </h3>
        {summary && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-red-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-400" />
              Weak ({summary.weakCount})
            </span>
            <span className="flex items-center gap-1 text-amber-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
              Medium ({summary.mediumCount})
            </span>
            <span className="flex items-center gap-1 text-emerald-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
              Strong ({summary.strongCount})
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {heatmap.map((subject) => (
          <SubjectRow key={subject.subjectId} subject={subject} />
        ))}
      </div>
    </div>
  );
};

export default WeaknessHeatMap;
