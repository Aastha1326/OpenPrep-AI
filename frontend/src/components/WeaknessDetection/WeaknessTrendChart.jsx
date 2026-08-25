import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * WeaknessTrendChart — renders historical weakness scores as a multi-line chart.
 * Shows overall score trend, weak/medium/strong topic counts, and trend indicators.
 */
const WeaknessTrendChart = ({ trends = [] }) => {
  if (!trends || trends.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance Trends
        </h3>
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No trend data yet</p>
            <p className="text-xs mt-1">Complete quizzes to see your progress over time</p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = trends.map((t) => ({
    date: new Date(t.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    fullDate: t.createdAt,
    score: t.overallScore,
    weak: t.weakCount,
    medium: t.mediumCount,
    strong: t.strongCount,
    snapshotType: t.snapshotType,
  }));

  // Calculate overall trend
  const latestScore = chartData[chartData.length - 1]?.score || 0;
  const firstScore = chartData[0]?.score || 0;
  const overallDelta = latestScore - firstScore;

  const TrendIcon =
    overallDelta > 3 ? TrendingUp : overallDelta < -3 ? TrendingDown : Minus;
  const trendColor =
    overallDelta > 3
      ? 'text-emerald-500'
      : overallDelta < -3
        ? 'text-red-500'
        : 'text-gray-500';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
            {label}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Overall Score: <span className="font-bold">{data?.score}%</span>
            </p>
            <div className="flex gap-3 text-xs">
              <span className="text-red-500">Weak: {data?.weak}</span>
              <span className="text-amber-500">Medium: {data?.medium}</span>
              <span className="text-emerald-500">Strong: {data?.strong}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Performance Trends
        </h3>
        <div className={`flex items-center gap-1.5 ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-sm font-medium">
            {overallDelta > 0 ? '+' : ''}
            {overallDelta.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              className="dark:stroke-gray-700"
            />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              className="dark:fill-gray-400"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              className="dark:fill-gray-400"
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={65} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#scoreGradient)"
              dot={{ r: 4, fill: '#3b82f6' }}
              activeDot={{ r: 6 }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => (
                <span className="text-gray-700 dark:text-gray-300 text-xs">{value}</span>
              )}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend for reference lines */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-emerald-500 inline-block" style={{ borderTop: '1px dashed' }} />
          Strong threshold (65%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-red-500 inline-block" style={{ borderTop: '1px dashed' }} />
          Weak threshold (40%)
        </span>
      </div>
    </div>
  );
};

export default WeaknessTrendChart;
