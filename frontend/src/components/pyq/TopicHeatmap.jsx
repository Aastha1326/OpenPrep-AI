/* eslint-disable no-unused-vars */
import { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Helper to determine if a question is MCQ
const isMultipleChoice = (q) => {
  const text = q.questionText || '';
  return /\b[A-D]\b\s*[).:]|[(][a-d][)]|\b(choose|multiple choice|mcq)\b/i.test(text);
};

const TopicHeatmap = ({ questions = [] }) => {
  // Extract all available years from the dataset
  const availableYears = useMemo(() => {
    const years = new Set();
    questions.forEach((q) => {
      if (q.year) years.add(Number(q.year));
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [questions]);

  // Filter States
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [qType, setQType] = useState('all'); // 'all' | 'mcq' | 'subjective'

  // Initialize filter defaults once availableYears is loaded
  useMemo(() => {
    if (availableYears.length > 0) {
      setStartYear((prev) => prev || availableYears[0].toString());
      setEndYear((prev) => prev || availableYears[availableYears.length - 1].toString());
    }
  }, [availableYears]);

  // Filter and process the questions
  const { points, totalMarks } = useMemo(() => {
    const filteredQuestions = questions.filter((q) => {
      if (!q.topicName || !q.year) return false;
      const y = Number(q.year);
      const start = startYear ? Number(startYear) : -Infinity;
      const end = endYear ? Number(endYear) : Infinity;
      if (y < start || y > end) return false;

      const isMcq = isMultipleChoice(q);
      if (qType === 'mcq' && !isMcq) return false;
      if (qType === 'subjective' && isMcq) return false;

      return true;
    });

    // Compute total marks of this filtered slice for percentage calculation
    let sliceTotalMarks = 0;
    const topicMap = {};
    const yearsSet = new Set();

    filteredQuestions.forEach((q) => {
      const yearStr = q.year.toString();
      yearsSet.add(Number(q.year));
      const qMarks = Number(q.marks || 5);
      sliceTotalMarks += qMarks;

      if (!topicMap[q.topicName]) {
        topicMap[q.topicName] = {
          totalMarks: 0,
          totalQuestions: 0,
          byYear: {},
        };
      }

      topicMap[q.topicName].totalMarks += qMarks;
      topicMap[q.topicName].totalQuestions += 1;

      if (!topicMap[q.topicName].byYear[yearStr]) {
        topicMap[q.topicName].byYear[yearStr] = {
          marks: 0,
          questionsCount: 0,
        };
      }
      topicMap[q.topicName].byYear[yearStr].marks += qMarks;
      topicMap[q.topicName].byYear[yearStr].questionsCount += 1;
    });

    // Sort topics by total marks in the filtered slice (top 8 to avoid clutter)
    const sorted = Object.keys(topicMap)
      .sort((a, b) => topicMap[b].totalMarks - topicMap[a].totalMarks)
      .slice(0, 8);

    const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);
    const scatterPoints = [];

    sorted.forEach((topic, tIdx) => {
      sortedYears.forEach((year) => {
        const yearData = topicMap[topic].byYear[year.toString()];
        if (yearData && yearData.marks > 0) {
          scatterPoints.push({
            topicName: topic,
            topicIndex: tIdx,
            year: year,
            marks: yearData.marks,
            questionsInYear: yearData.questionsCount,
            totalTopicQuestions: topicMap[topic].totalQuestions,
            totalTopicMarks: topicMap[topic].totalMarks,
          });
        }
      });
    });

    return {
      points: scatterPoints,
      sortedTopics: sorted,
      totalMarks: sliceTotalMarks || 1,
    };
  }, [questions, startYear, endYear, qType]);

  const getPointColor = (marks) => {
    if (marks >= 15) return '#ef4444'; // High Yield -> Red
    if (marks >= 10) return '#f97316'; // Medium-High Yield -> Orange
    if (marks >= 5) return '#eab308';  // Medium Yield -> Amber
    return '#38bdf8'; // Low Yield -> Light Blue
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const weightagePct = ((data.totalTopicMarks / totalMarks) * 100).toFixed(1);
      return (
        <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-bold text-stone-100">{data.topicName}</p>
          <p className="text-stone-400">Exam Year: <span className="text-stone-250 font-medium">{data.year}</span></p>
          <p className="text-stone-400">Questions in {data.year}: <span className="text-stone-250 font-medium">{data.questionsInYear}</span></p>
          <p className="text-stone-400">Total Questions: <span className="text-stone-250 font-medium">{data.totalTopicQuestions}</span></p>
          <p className="text-indigo-400 font-semibold">Marks in {data.year}: {data.marks}</p>
          <p className="text-emerald-400 font-semibold">Overall Weightage: {weightagePct}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between min-h-[420px]">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h3 className="text-stone-200 font-bold text-sm tracking-wide">
            Historic Topic Frequency Heatmap
          </h3>
          {/* Legend */}
          <div className="flex flex-wrap gap-2.5 text-[10px] font-medium text-stone-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#ef4444]" /> High (≥15)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#f97316]" /> Med-High (10-14)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#eab308]" /> Med (5-9)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8]" /> Low (&lt;5)
            </span>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
              From Year
            </label>
            <select
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              className="w-full bg-neutral-850 border border-neutral-750 text-stone-300 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
              To Year
            </label>
            <select
              value={endYear}
              onChange={(e) => setEndYear(e.target.value)}
              className="w-full bg-neutral-850 border border-neutral-750 text-stone-300 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Q-Type
            </label>
            <select
              value={qType}
              onChange={(e) => setQType(e.target.value)}
              className="w-full bg-neutral-850 border border-neutral-750 text-stone-300 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="mcq">MCQ Only</option>
              <option value="subjective">Subjective Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="w-full h-64">
        {points.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center border border-dashed border-neutral-800 rounded-xl">
            <p className="text-xs text-stone-500">No questions match the current filters.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis
                type="number"
                dataKey="year"
                name="Year"
                domain={['auto', 'auto']}
                stroke="#666"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => val.toString()}
              />
              <YAxis
                type="category"
                dataKey="topicName"
                name="Topic"
                stroke="#666"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                width={85}
              />
              <ZAxis type="number" dataKey="marks" range={[60, 360]} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#333' }} />
              <Scatter name="Topic Marks" data={points}>
                {points.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getPointColor(entry.marks)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TopicHeatmap;

