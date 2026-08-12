import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const TopicHeatmap = ({ questions = [] }) => {
  // Aggregate occurrences of topicName + year
  const points = [];
  const topicMap = {};
  const yearsSet = new Set();

  questions.forEach((q) => {
    if (!q.topicName || !q.year) return;
    const yearStr = q.year.toString();
    yearsSet.add(q.year);

    if (!topicMap[q.topicName]) {
      topicMap[q.topicName] = {};
    }
    topicMap[q.topicName][yearStr] = (topicMap[q.topicName][yearStr] || 0) + Number(q.marks || 5);
  });

  const sortedTopics = Object.keys(topicMap).sort((a, b) => {
    // Sort by total aggregated marks across all years
    const sumA = Object.values(topicMap[a]).reduce((acc, curr) => acc + curr, 0);
    const sumB = Object.values(topicMap[b]).reduce((acc, curr) => acc + curr, 0);
    return sumB - sumA;
  }).slice(0, 8); // Top 8 topics to prevent vertical clutter

  const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);

  sortedTopics.forEach((topic, tIdx) => {
    sortedYears.forEach((year) => {
      const marksVal = topicMap[topic][year.toString()] || 0;
      if (marksVal > 0) {
        points.push({
          topicName: topic,
          topicIndex: tIdx,
          year: year,
          marks: marksVal,
        });
      }
    });
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-bold text-stone-100">{data.topicName}</p>
          <p className="text-stone-400">Exam Year: {data.year}</p>
          <p className="text-indigo-400 font-semibold">Total Marks weightage: {data.marks}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80 bg-neutral-900 border border-neutral-800 p-5 rounded-2xl shadow-xl">
      <h3 className="text-stone-250 font-semibold mb-4 text-sm tracking-wide">Recurring concepts over years (Topic frequency)</h3>
      <div className="w-full h-[90%]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis
              type="number"
              dataKey="year"
              name="Year"
              domain={['auto', 'auto']}
              stroke="#737373"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => val.toString()}
            />
            <YAxis
              type="category"
              dataKey="topicName"
              name="Topic"
              stroke="#737373"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <ZAxis type="number" dataKey="marks" range={[60, 400]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#444' }} />
            <Scatter
              name="Topic Marks"
              data={points}
              fill="#6366f1"
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopicHeatmap;
