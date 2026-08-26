import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const trendIcons = { improving: TrendingUp, declining: TrendingDown, stable: Minus };
const trendColors = { improving: 'text-emerald-500', declining: 'text-red-500', stable: 'text-gray-500' };

const ScoreTrendChart = ({ trends = [], summary = null }) => {
  if (!trends || trends.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Score Trends</h3>
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No quiz attempts yet — take a quiz to see trends</p>
        </div>
      </div>
    );
  }

  const chartData = trends.map((t) => ({
    period: t.period.length > 7 ? t.period.substring(5) : t.period,
    avgScore: t.avgScore,
    attempts: t.attemptCount,
    minScore: t.minScore,
    maxScore: t.maxScore,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-sm">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
          <p className="text-blue-600 dark:text-blue-400">Avg: {d.avgScore}%</p>
          <p className="text-gray-500 dark:text-gray-400">{d.attempts} attempts</p>
          <p className="text-gray-500 dark:text-gray-400">Range: {d.minScore}–{d.maxScore}%</p>
        </div>
      );
    }
    return null;
  };

  const TrendIcon = summary ? (trendIcons[summary.recentTrend] || Minus) : Minus;
  const trendColor = summary ? (trendColors[summary.recentTrend] || 'text-gray-500') : 'text-gray-500';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Score Trends</h3>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-sm font-medium capitalize">{summary?.recentTrend || 'stable'}</span>
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={summary?.avgScore || 50} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
            <Area type="monotone" dataKey="avgScore" stroke="#3b82f6" strokeWidth={2} fill="url(#scoreGrad)" dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScoreTrendChart;
