import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Filter, Calendar, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import API from '../../services/api';

const PyqTrendVisualizer = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await API.get('/academic/subjects');
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setSubjects(list);
        if (list.length > 0) {
          setSelectedSubject(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load subjects for PYQ trends:', err);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch trend analytics whenever filters change
  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (selectedSubject) params.subjectId = selectedSubject;
        if (startYear) params.startYear = startYear;
        if (endYear) params.endYear = endYear;

        const res = await API.get('/pyqs/trends', { params });
        setTrendData(res.data?.data || { trends: [], topTopics: [], difficultySummary: {} });
      } catch (err) {
        console.error('Failed to load PYQ trends:', err);
        setError('Failed to load PYQ frequency and difficulty trends.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [selectedSubject, startYear, endYear]);

  const trends = trendData?.trends || [];
  const topTopics = trendData?.topTopics || [];
  const difficultySummary = trendData?.difficultySummary || { Easy: 0, Medium: 0, Hard: 0 };

  const maxFrequency = useMemo(() => {
    let max = 1;
    trends.forEach((t) => {
      Object.values(t.topics || {}).forEach((freq) => {
        if (freq > max) max = freq;
      });
    });
    return max;
  }, [trends]);

  return (
    <div className="bg-[#fdfaf3] dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-md p-6 shadow-sm space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-neutral-300 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-yellow-700 dark:text-yellow-500" />
          <div>
            <h2 className="text-2xl font-bold font-playfair text-neutral-800 dark:text-neutral-100">
              PYQ Weightage & Difficulty Trend Visualizer
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Analyze year-over-year question frequencies and high-yield chapter trends
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-sm text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-yellow-600"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Start Year</label>
            <input
              type="number"
              placeholder="e.g. 2020"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              className="w-28 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-sm text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-yellow-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">End Year</label>
            <input
              type="number"
              placeholder="e.g. 2026"
              value={endYear}
              onChange={(e) => setEndYear(e.target.value)}
              className="w-28 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-sm text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-yellow-600"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-yellow-600" />
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Computing trend analysis graphs...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Trend Chart (2 columns) */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-800/60 p-5 rounded border border-neutral-300 dark:border-neutral-700 space-y-4">
            <h3 className="text-lg font-bold font-playfair text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-600" />
              Year-over-Year Topic Weightage Frequency
            </h3>

            {trends.length === 0 ? (
              <p className="text-sm text-neutral-500 italic py-12 text-center">
                No PYQ trend data available for the selected filters. Upload PYQ papers to generate graphs.
              </p>
            ) : (
              <div className="space-y-4 pt-2">
                {trends.map((item) => (
                  <div key={item.year} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                      <span>Year {item.year} ({item.totalPapers} paper{item.totalPapers === 1 ? '' : 's'})</span>
                    </div>
                    <div className="space-y-1.5 bg-neutral-50 dark:bg-neutral-900/40 p-2.5 rounded border border-neutral-200 dark:border-neutral-800">
                      {Object.keys(item.topics || {}).length === 0 ? (
                        <span className="text-xs text-neutral-400 italic">No topic frequency recorded for this year</span>
                      ) : (
                        Object.entries(item.topics).map(([topicName, freq]) => {
                          const widthPct = Math.min(100, Math.max(10, (freq / maxFrequency) * 100));
                          return (
                            <div key={topicName} className="space-y-0.5">
                              <div className="flex justify-between text-xs">
                                <span className="font-medium text-neutral-700 dark:text-neutral-200 truncate max-w-[70%]">
                                  {topicName}
                                </span>
                                <span className="text-neutral-500 font-semibold">{freq} pts</span>
                              </div>
                              <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-yellow-600 to-amber-600 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${widthPct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Analytics (Difficulty & High-Yield Topics) */}
          <div className="space-y-6">
            {/* Difficulty Breakdown */}
            <div className="bg-white dark:bg-neutral-800/60 p-5 rounded border border-neutral-300 dark:border-neutral-700 space-y-3">
              <h3 className="text-base font-bold font-playfair text-neutral-800 dark:text-neutral-100">
                Exam Difficulty Distribution
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded">
                  <p className="text-xs text-green-700 dark:text-green-300 font-semibold">Easy</p>
                  <p className="text-xl font-bold text-green-800 dark:text-green-200">{difficultySummary.Easy}</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">Medium</p>
                  <p className="text-xl font-bold text-amber-800 dark:text-amber-200">{difficultySummary.Medium}</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded">
                  <p className="text-xs text-red-700 dark:text-red-300 font-semibold">Hard</p>
                  <p className="text-xl font-bold text-red-800 dark:text-red-200">{difficultySummary.Hard}</p>
                </div>
              </div>
            </div>

            {/* High-Yield Topics Leaderboard */}
            <div className="bg-white dark:bg-neutral-800/60 p-5 rounded border border-neutral-300 dark:border-neutral-700 space-y-3">
              <h3 className="text-base font-bold font-playfair text-neutral-800 dark:text-neutral-100">
                Top High-Yield Topics
              </h3>
              {topTopics.length === 0 ? (
                <p className="text-xs text-neutral-500 italic">No topic weightage recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {topTopics.slice(0, 6).map((topic, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 text-xs"
                    >
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[70%]">
                        {idx + 1}. {topic.topicName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300 font-bold">
                        {topic.totalFrequency} weight
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PyqTrendVisualizer;
