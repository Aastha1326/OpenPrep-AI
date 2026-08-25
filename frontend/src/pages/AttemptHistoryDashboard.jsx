import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BarChart3, TrendingUp, Clock, Target, Flame, Loader2, AlertCircle,
  ChevronDown, Calendar, Zap, Award,
} from 'lucide-react';
import {
  fetchAttemptHistory, fetchScoreTrends, fetchTopicProgress,
  fetchPerformanceSummary, clearAttemptError,
} from '../store/slices/attemptHistorySlice';
import axios from 'axios';

import ScoreTrendChart from '../components/attemptHistory/ScoreTrendChart';
import TopicProgressGrid from '../components/attemptHistory/TopicProgressGrid';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
    <div className="flex items-center gap-2 mb-2"><Icon className={`w-5 h-5 ${color}`} /><span className="text-xs text-gray-500 dark:text-gray-400">{label}</span></div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
  </div>
);

const AttemptHistoryDashboard = () => {
  const dispatch = useDispatch();
  const { attempts, pagination, trends, trendSummary, topicProgress, summary, loading, error } = useSelector((s) => s.attemptHistory);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [groupBy, setGroupBy] = useState('day');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/academic/subjects`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (res.data?.success) setSubjects(res.data.data);
      } catch (e) { console.error(e); }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    dispatch(fetchPerformanceSummary());
    dispatch(fetchScoreTrends({ subjectId: selectedSubject || undefined, groupBy }));
    dispatch(fetchTopicProgress(selectedSubject || undefined));
    dispatch(fetchAttemptHistory({ subjectId: selectedSubject || undefined, limit: 20 }));
  }, [dispatch, selectedSubject, groupBy]);

  useEffect(() => {
    if (error) { const t = setTimeout(() => dispatch(clearAttemptError()), 5000); return () => clearTimeout(t); }
  }, [error, dispatch]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'topics', label: 'Topics', icon: Target },
    { id: 'history', label: 'History', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attempt History & Trends</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track your quiz performance, topic progress, and improvement over time</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button onClick={() => dispatch(clearAttemptError())} className="ml-auto text-red-500">✕</button>
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Target} label="Total Attempts" value={summary.totalAttempts} color="text-blue-500" />
            <StatCard icon={Award} label="Avg Score" value={`${summary.avgScore}%`} color="text-emerald-500" sub={`Best: ${summary.bestScore}%`} />
            <StatCard icon={Flame} label="Day Streak" value={summary.streak} color="text-orange-500" sub={`${summary.weeklyAttempts} this week`} />
            <StatCard icon={Clock} label="Study Time" value={`${summary.totalStudyTime}m`} color="text-purple-500" sub={`${summary.monthlyAttempts} this month`} />
          </div>
        )}

        {/* Subject filter + Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="relative">
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 appearance-none pr-8">
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'}`}>
                  <Icon className="w-4 h-4" />{tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'overview' && (
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 mx-auto text-blue-500 animate-spin" />
          </div>
        )}

        {!loading && activeTab === 'overview' && (
          <ScoreTrendChart trends={trends} summary={trendSummary} />
        )}

        {!loading && activeTab === 'topics' && (
          <TopicProgressGrid topics={topicProgress} />
        )}

        {!loading && activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Attempts</h3>
            {attempts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No attempts yet</p>
            ) : (
              <div className="space-y-2">
                {attempts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${a.score >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : a.score >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {a.score}%
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.quiz?.title || 'Quiz'}</p>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                          {a.quiz?.subject && <span>{a.quiz.subject.name}</span>}
                          {a.quiz?.topic && <span>• {a.quiz.topic.name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                      <p>{a.totalQuestions} questions</p>
                      <p>{Math.round(a.timeSpent / 1000)}s</p>
                      <p className="text-[10px]">{new Date(a.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttemptHistoryDashboard;
