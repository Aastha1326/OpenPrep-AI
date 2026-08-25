import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Hash, TrendingUp, BookOpen } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

const FrequencyHeatMap = ({ frequency }) => {
  if (!frequency || !frequency.chapters || frequency.chapters.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <Hash className="w-5 h-5 inline mr-2" />
          Chapter Frequency Analysis
        </h3>
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Hash className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No PYQ data to analyze</p>
            <p className="text-xs mt-1">Upload PYQ papers to see frequency analysis</p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = frequency.chapters.slice(0, 10).map((ch) => ({
    name: ch.name.length > 20 ? ch.name.substring(0, 20) + '…' : ch.name,
    fullName: ch.name,
    questions: ch.totalAppearances,
    marks: ch.totalMarks,
    frequencyScore: ch.frequencyScore,
    topics: ch.uniqueTopics,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-sm">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">{d.fullName}</p>
          <p className="text-blue-600 dark:text-blue-400">{d.questions} questions • {d.marks} total marks</p>
          <p className="text-gray-500 dark:text-gray-400">{d.topics} unique topics • {d.frequencyScore}% frequency</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          <Hash className="w-5 h-5 inline mr-2" />
          Chapter Frequency Analysis
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {frequency.totalQuestions} questions • {frequency.yearRange}
        </span>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              className="dark:fill-gray-400"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="questions" name="Questions" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Frequency table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Chapter</th>
              <th className="text-center py-2 text-gray-500 dark:text-gray-400 font-medium">Questions</th>
              <th className="text-center py-2 text-gray-500 dark:text-gray-400 font-medium">Marks</th>
              <th className="text-center py-2 text-gray-500 dark:text-gray-400 font-medium">Frequency</th>
              <th className="text-center py-2 text-gray-500 dark:text-gray-400 font-medium">Topics</th>
            </tr>
          </thead>
          <tbody>
            {frequency.chapters.map((ch, i) => (
              <tr key={ch.name} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750">
                <td className="py-2 font-medium text-gray-900 dark:text-white">{ch.name}</td>
                <td className="text-center py-2 text-gray-700 dark:text-gray-300">{ch.totalAppearances}</td>
                <td className="text-center py-2 text-gray-700 dark:text-gray-300">{ch.totalMarks}</td>
                <td className="text-center py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    ch.frequencyScore > 40 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                    ch.frequencyScore > 20 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {ch.frequencyScore}%
                  </span>
                </td>
                <td className="text-center py-2 text-gray-500 dark:text-gray-400">{ch.uniqueTopics}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FrequencyHeatMap;
