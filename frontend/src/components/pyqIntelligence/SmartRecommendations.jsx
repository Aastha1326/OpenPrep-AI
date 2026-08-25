import React from 'react';
import { Sparkles, Target, TrendingUp, Repeat, Clock, ArrowRight, Zap } from 'lucide-react';

const typeConfig = {
  'high-frequency': { icon: Target, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'High Frequency' },
  'trending-up': { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Trending Up' },
  'repeated-question': { icon: Repeat, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Repeated' },
};

const priorityConfig = {
  high: { color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', label: 'High Priority' },
  medium: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', label: 'Medium' },
  low: { color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', label: 'Low' },
};

const SmartRecommendations = ({ recommendations }) => {
  if (!recommendations || !recommendations.recommendations || recommendations.recommendations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <Sparkles className="w-5 h-5 inline mr-2 text-purple-500" />
          Smart Study Recommendations
        </h3>
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No recommendations yet — upload more PYQ papers</p>
        </div>
      </div>
    );
  }

  const sorted = [...recommendations.recommendations].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          <Sparkles className="w-5 h-5 inline mr-2 text-purple-500" />
          Smart Study Recommendations
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {sorted.length} recommendation{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Trend summary */}
      {recommendations.trendSummary && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            <Sparkles className="w-3.5 h-3.5 inline mr-1" />
            {recommendations.trendSummary}
          </p>
        </div>
      )}

      {/* Frequency summary */}
      {recommendations.frequencySummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-750 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{recommendations.frequencySummary.totalChapters}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Chapters</p>
          </div>
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-750 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{recommendations.frequencySummary.totalTopics}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Topics</p>
          </div>
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-750 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{recommendations.frequencySummary.totalQuestions}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Questions</p>
          </div>
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-750 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{recommendations.frequencySummary.yearRange}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Year Range</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((rec, index) => {
          const type = typeConfig[rec.type] || typeConfig['high-frequency'];
          const priority = priorityConfig[rec.priority] || priorityConfig.medium;
          const TypeIcon = type.icon;

          return (
            <div key={index} className={`p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md ${type.bg}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700">
                  <TypeIcon className={`w-4.5 h-4.5 ${type.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{rec.title}</h4>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${priority.color}`}>
                      {priority.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{rec.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">{type.label}</span>
                    {rec.estimatedMarks && <span>{rec.estimatedMarks} total marks</span>}
                    {rec.appearances && <span>{rec.appearances}x appeared</span>}
                    {rec.pctChange && <span className={rec.pctChange > 0 ? 'text-emerald-500' : 'text-red-500'}>{rec.pctChange > 0 ? '+' : ''}{rec.pctChange}%</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SmartRecommendations;
