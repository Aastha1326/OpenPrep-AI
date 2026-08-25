import React from 'react';
import { TrendingUp, TrendingDown, Minus, Target, Zap } from 'lucide-react';

const statusColors = {
  Weak: { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  Medium: { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  Strong: { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
};

const TopicProgressGrid = ({ topics = [] }) => {
  if (!topics || topics.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Topic Progress</h3>
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No topic data yet — complete quizzes to track progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Topic Progress</h3>
      <div className="space-y-3">
        {topics.map((t) => {
          const colors = statusColors[t.status] || statusColors.Medium;
          const VelocityIcon = t.velocity > 5 ? TrendingUp : t.velocity < -5 ? TrendingDown : Minus;
          const velColor = t.velocity > 5 ? 'text-emerald-500' : t.velocity < -5 ? 'text-red-500' : 'text-gray-500';

          return (
            <div key={t.topicId} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{t.topicName}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${colors.badge}`}>{t.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${colors.text}`}>{t.avgScore}%</span>
                  <div className={`flex items-center gap-0.5 ${velColor}`}>
                    <VelocityIcon className="w-3 h-3" />
                    <span className="text-[10px] font-medium">{t.velocity > 0 ? '+' : ''}{t.velocity}</span>
                  </div>
                </div>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${colors.bar} transition-all`} style={{ width: `${Math.min(100, t.avgScore)}%` }} />
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                <span>{t.totalAttempts} attempts</span>
                <span>Best: {t.bestScore}%</span>
                <span>First: {t.firstScore}%</span>
                <span>Latest: {t.latestScore}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopicProgressGrid;
