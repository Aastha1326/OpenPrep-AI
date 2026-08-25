import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Lightbulb } from 'lucide-react';

const directionConfig = {
  increasing: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Rising' },
  decreasing: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Falling' },
  stable: { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800', label: 'Stable' },
};

const LINE_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const TrendAnalysisChart = ({ trends }) => {
  if (!trends || !trends.trends || trends.trends.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <TrendingUp className="w-5 h-5 inline mr-2" />
          Trend Analysis
        </h3>
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No trend data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Build chart data from year data in each trend
  const allYears = new Set();
  trends.trends.forEach((t) => t.yearData.forEach((d) => allYears.add(d.year)));
  const sortedYears = [...allYears].sort();

  const chartData = sortedYears.map((year) => {
    const point = { year: String(year) };
    trends.trends.slice(0, 6).forEach((t, i) => {
      const entry = t.yearData.find((d) => d.year === year);
      point[t.chapter] = entry?.marks || 0;
    });
    return point;
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-sm">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }} className="text-xs">
              {p.name}: {p.value} marks
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          <TrendingUp className="w-5 h-5 inline mr-2" />
          Trend Analysis
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">{trends.yearRange}</span>
      </div>

      {/* AI Insight */}
      {trends.insight && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-purple-700 dark:text-purple-300">{trends.insight}</p>
          </div>
        </div>
      )}

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            {trends.trends.slice(0, 6).map((t, i) => (
              <Line
                key={t.chapter}
                type="monotone"
                dataKey={t.chapter}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trend cards */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {trends.trends.slice(0, 6).map((t, i) => {
          const config = directionConfig[t.direction] || directionConfig.stable;
          const DirIcon = config.icon;
          return (
            <div key={t.chapter} className={`p-3 rounded-lg border border-gray-100 dark:border-gray-700 ${config.bg}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-900 dark:text-white truncate">{t.chapter}</span>
                <DirIcon className={`w-3.5 h-3.5 ${config.color}`} />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${config.color}`}>
                  {t.pctChange > 0 ? '+' : ''}{t.pctChange}%
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{config.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrendAnalysisChart;
