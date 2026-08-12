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

const ChapterWeightageChart = ({ data = [], onChapterClick }) => {
  const chartData = data.map((ch) => ({
    name: ch.chapterName,
    percentage: ch.percentage || 0,
    marks: ch.marks || 0,
    questions: ch.questionCount || 0,
  }));

  const COLORS = ['#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const info = payload[0].payload;
      return (
        <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-bold text-stone-100">{info.name}</p>
          <p className="text-indigo-400">Weightage: {info.percentage}%</p>
          <p className="text-stone-400">Total Marks: {info.marks}</p>
          <p className="text-stone-400">Total Questions: {info.questions}</p>
          {onChapterClick && (
            <p className="text-[10px] text-emerald-400 font-semibold mt-2 animate-pulse">
              Click bar to start practice deck
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80 bg-neutral-900 border border-neutral-800 p-5 rounded-2xl shadow-xl">
      <h3 className="text-stone-250 font-semibold mb-4 text-sm tracking-wide">Chapter weightage breakdown (%)</h3>
      <div className="w-full h-[90%]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 20 }}
            onClick={(state) => {
              if (state && state.activeLabel && onChapterClick) {
                onChapterClick(state.activeLabel);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis
              dataKey="name"
              stroke="#737373"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => (val.length > 15 ? `${val.substring(0, 15)}...` : val)}
            />
            <YAxis
              stroke="#737373"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={50} cursor="pointer">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChapterWeightageChart;
