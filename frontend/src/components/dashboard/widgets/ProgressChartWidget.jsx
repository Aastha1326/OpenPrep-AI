import React from 'react';
import { useSelector } from 'react-redux';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, Clock, Target, CheckCircle2 } from 'lucide-react';
import VintagePaper from '../VintagePaper';

const ProgressChartWidget = () => {
  const { weeklyChartData, stats } = useSelector((state) => state.dashboard);

  const chartData = (weeklyChartData && weeklyChartData.length > 0)
    ? weeklyChartData.map((d) => ({
        name: d.day || d.name,
        completion: d.completion ?? d.score ?? 0,
      }))
    : [
        { name: 'Mon', completion: 40 },
        { name: 'Tue', completion: 65 },
        { name: 'Wed', completion: 50 },
        { name: 'Thu', completion: 85 },
        { name: 'Fri', completion: 70 },
        { name: 'Sat', completion: 90 },
        { name: 'Sun', completion: 80 },
      ];

  const totalStudyHours = stats?.totalStudyHours ?? 0;
  const syllabusProgress = stats?.syllabusProgress ?? 0;
  const attemptsCount = stats?.attemptsCount ?? 0;

  return (
    <VintagePaper className="h-full flex flex-col justify-between p-5 border-t-4 border-t-amber-600">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h3 className="font-playfair font-bold text-lg text-neutral-800 dark:text-neutral-100">
            Study Progress & Activity
          </h3>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full">
          Weekly Trend
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="p-2 bg-neutral-100/70 dark:bg-neutral-800/60 rounded border border-amber-900/10">
          <div className="text-xs text-neutral-500 flex items-center justify-center gap-1">
            <Target className="w-3.5 h-3.5 text-blue-500" /> Quizzes
          </div>
          <div className="text-lg font-bold font-playfair text-neutral-800 dark:text-neutral-100">
            {attemptsCount}
          </div>
        </div>
        <div className="p-2 bg-neutral-100/70 dark:bg-neutral-800/60 rounded border border-amber-900/10">
          <div className="text-xs text-neutral-500 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Mastery
          </div>
          <div className="text-lg font-bold font-playfair text-neutral-800 dark:text-neutral-100">
            {syllabusProgress}%
          </div>
        </div>
        <div className="p-2 bg-neutral-100/70 dark:bg-neutral-800/60 rounded border border-amber-900/10">
          <div className="text-xs text-neutral-500 flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Hours
          </div>
          <div className="text-lg font-bold font-playfair text-neutral-800 dark:text-neutral-100">
            {totalStudyHours.toFixed(1)}h
          </div>
        </div>
      </div>

      <div className="w-full h-48 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            <XAxis dataKey="name" stroke="#888888" fontSize={11} />
            <YAxis stroke="#888888" fontSize={11} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                borderRadius: '6px',
                color: '#fff',
                border: 'none',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="completion"
              stroke="#d97706"
              strokeWidth={3}
              dot={{ fill: '#d97706', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </VintagePaper>
  );
};

export default ProgressChartWidget;
