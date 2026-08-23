import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

/**
 * Custom tooltip for the quiz trend chart.
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-stone-900/95 backdrop-blur-md border border-stone-700/60 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs font-mono font-bold text-stone-300 mb-2">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-xs mb-1">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-stone-400">{entry.name}:</span>
          <span className="font-semibold text-stone-200">
            {entry.dataKey.includes('Accuracy') || entry.dataKey.includes('accuracy')
              ? `${entry.value}%`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * QuizTrendChart
 * Displays quiz accuracy over time with a 7-day rolling average
 * and performance trend direction indicator.
 */
export default function QuizTrendChart({ data = [] }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d) => ({
      ...d,
      shortDate: d.date?.slice(5) || '',
    }));
  }, [data]);

  const trend = useMemo(() => {
    if (chartData.length < 5) return { direction: 'stable', change: 0 };
    const recent = chartData.slice(-5);
    const older = chartData.slice(-10, -5);

    const recentAvg = recent.reduce((s, d) => s + (d.accuracy || 0), 0) / recent.length;
    const olderAvg = older.length
      ? older.reduce((s, d) => s + (d.accuracy || 0), 0) / older.length
      : recentAvg;

    const change = Math.round(recentAvg - olderAvg);
    return {
      direction: change > 3 ? 'up' : change < -3 ? 'down' : 'stable',
      change,
      recentAvg: Math.round(recentAvg),
    };
  }, [chartData]);

  const trendConfig = {
    up: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', label: 'Improving' },
    down: { icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/25', label: 'Declining' },
    stable: { icon: Minus, color: 'text-stone-400', bg: 'bg-stone-500/10 border-stone-500/25', label: 'Stable' },
  };

  const cfg = trendConfig[trend.direction];
  const TrendIcon = cfg.icon;

  const totalAttempts = chartData.reduce((s, d) => s + (d.attemptCount || 0), 0);
  const totalQuestions = chartData.reduce((s, d) => s + (d.totalQuestions || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/15 border border-cyan-500/25 rounded-xl">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-100 font-display">
              Quiz Performance Trend
            </h3>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              {totalAttempts} attempts · {totalQuestions} questions
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${cfg.bg}`}>
          <TrendIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
          <span className={`text-xs font-bold font-mono ${cfg.color}`}>
            {cfg.label} {trend.change > 0 ? '+' : ''}{trend.change}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rollingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
              <XAxis
                dataKey="shortDate"
                tick={{ fill: '#78716c', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#44403c' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#78716c', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={70}
                stroke="#525252"
                strokeDasharray="3 3"
                label={{ value: '70%', fill: '#525252', fontSize: 10 }}
              />
              <Area
                type="monotone"
                dataKey="accuracy"
                name="Accuracy"
                stroke="#06b6d4"
                fill="url(#accuracyGradient)"
                strokeWidth={2}
                dot={{ fill: '#06b6d4', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: '#06b6d4', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="rollingAccuracy"
                name="7-Day Avg"
                stroke="#f59e0b"
                fill="url(#rollingGradient)"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Activity className="w-10 h-10 text-stone-700 mx-auto mb-2" />
              <p className="text-sm text-stone-600">No quiz data yet.</p>
              <p className="text-xs text-stone-700 mt-1">Complete quizzes to see your performance trend.</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
