import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { BarChart3, Flame, BookOpen, Clock, Zap } from 'lucide-react';

/**
 * Custom tooltip for the weekly study overview chart.
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
            {entry.dataKey === 'focusMinutes'
              ? `${entry.value} min`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * WeeklyStudyOverview
 * Renders a stacked bar chart showing daily study activity
 * broken down by quiz questions, flashcards, and focus minutes.
 */
export default function WeeklyStudyOverview({ data = [] }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    // Show last 14 days for readability
    return data.slice(-14).map((day) => ({
      ...day,
      shortDate: day.date?.slice(5) || '', // MM-DD
      dayLabel: day.dayOfWeek || '',
    }));
  }, [data]);

  const stats = useMemo(() => {
    if (!data || data.length === 0)
      return { totalQuestions: 0, totalFlashcards: 0, totalMinutes: 0, activeDays: 0, avgScore: 0 };
    return {
      totalQuestions: data.reduce((s, d) => s + (d.questionsSolved || 0), 0),
      totalFlashcards: data.reduce((s, d) => s + (d.flashcardsReviewed || 0), 0),
      totalMinutes: data.reduce((s, d) => s + (d.focusMinutes || 0), 0),
      activeDays: data.filter((d) => (d.studyScore || 0) > 10).length,
      avgScore: Math.round(
        data.reduce((s, d) => s + (d.studyScore || 0), 0) / (data.length || 1)
      ),
    };
  }, [data]);

  const statCards = [
    { label: 'Questions Solved', value: stats.totalQuestions, icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Flashcards Reviewed', value: stats.totalFlashcards, icon: BookOpen, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
    { label: 'Focus Minutes', value: stats.totalMinutes, icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Active Days', value: stats.activeDays, icon: Flame, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/15 border border-indigo-500/25 rounded-xl">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-100 font-display">
              Weekly Study Overview
            </h3>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              Last 14 days · Avg score: {stats.avgScore}/100
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${stat.bg}`}
          >
            <stat.icon className={`w-4 h-4 ${stat.color} shrink-0`} />
            <div>
              <p className="text-lg font-black font-mono text-stone-100 leading-none">
                {stat.value}
              </p>
              <p className="text-[10px] text-stone-500 uppercase tracking-wider mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
              <XAxis
                dataKey="shortDate"
                tick={{ fill: '#78716c', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#44403c' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#78716c', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(120,113,108,0.08)' }} />
              <Legend
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }}
              />
              <Bar
                dataKey="questionsSolved"
                name="Quiz Questions"
                fill="#6366f1"
                radius={[3, 3, 0, 0]}
                stackId="study"
              />
              <Bar
                dataKey="flashcardsReviewed"
                name="Flashcards"
                fill="#a855f7"
                radius={[3, 3, 0, 0]}
                stackId="study"
              />
              <Bar
                dataKey="focusMinutes"
                name="Focus (min)"
                fill="#22c55e"
                radius={[3, 3, 0, 0]}
                stackId="study"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-10 h-10 text-stone-700 mx-auto mb-2" />
              <p className="text-sm text-stone-600">No study data yet. Start studying to see your overview!</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
