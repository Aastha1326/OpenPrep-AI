import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1 z-50">
        <p className="font-bold text-slate-100">{data.name}</p>
        <p className="text-indigo-400 font-semibold">Weightage: {data.weightage}%</p>
        <p className="text-slate-400">Questions Found: <strong className="text-slate-200">{data.questionCount}</strong></p>
      </div>
    );
  }
  return null;
};

const WeightageChart = ({ data = [], onChapterClick, title = 'Topic Weightage Breakdown' }) => {
  // Normalize and sort descending by weightage percentage
  const formattedData = (data || [])
    .map((item) => {
      const name = item.chapterName || item.topicName || item.name || item.topic || 'General Topic';
      const weightage = Number(item.weightage ?? item.percentage ?? item.percent ?? 0);
      const questionCount = Number(item.questionCount ?? item.questions ?? item.count ?? 0);
      return {
        name,
        weightage,
        questionCount,
      };
    })
    .sort((a, b) => b.weightage - a.weightage);

  if (formattedData.length === 0) {
    return (
      <div className="w-full bg-slate-900/90 border border-slate-800 p-6 rounded-2xl text-center text-xs text-slate-400 italic">
        No topic weightage data available.
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-slate-100 font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          {title}
        </h3>
        <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase bg-slate-800 px-2 py-0.5 rounded">
          Highest First
        </span>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={formattedData}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            onClick={(state) => {
              if (state && state.activeLabel && onChapterClick) {
                onChapterClick(state.activeLabel);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis
              type="number"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit="%"
              domain={[0, 'dataMax + 5']}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#cbd5e1"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={120}
              tickFormatter={(val) => (val.length > 16 ? `${val.substring(0, 16)}...` : val)}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
            <Bar
              dataKey="weightage"
              radius={[0, 6, 6, 0]}
              barSize={22}
              cursor={onChapterClick ? 'pointer' : 'default'}
            >
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeightageChart;
export { CustomTooltip };
