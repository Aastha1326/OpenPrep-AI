import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Brain, BarChart3, TrendingUp, Repeat, Sparkles, Loader2, AlertCircle,
  BookOpen, ChevronDown, Search,
} from 'lucide-react';
import {
  fetchFrequencyAnalysis, fetchTrendAnalysis, fetchRepeatDetection,
  fetchSmartRecommendations, fetchFullIntelligence, clearPyqError,
} from '../store/slices/pyqIntelligenceSlice';
import axios from 'axios';

import FrequencyHeatMap from '../components/pyqIntelligence/FrequencyHeatMap';
import TrendAnalysisChart from '../components/pyqIntelligence/TrendAnalysisChart';
import RepeatDetector from '../components/pyqIntelligence/RepeatDetector';
import SmartRecommendations from '../components/pyqIntelligence/SmartRecommendations';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const PYQIntelligenceDashboard = () => {
  const dispatch = useDispatch();
  const { frequency, trends, repeats, recommendations, loading, error } = useSelector(
    (state) => state.pyqIntelligence
  );

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/academic/subjects`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data?.success) {
          setSubjects(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedSubjectId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch intelligence data when subject changes
  useEffect(() => {
    if (!selectedSubjectId) return;
    dispatch(fetchFullIntelligence(selectedSubjectId));
  }, [dispatch, selectedSubjectId]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearPyqError()), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'repeats', label: 'Repeats', icon: Repeat },
    { id: 'recommendations', label: 'AI Picks', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                PYQ Intelligence Engine
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Frequency analysis, trend detection, repeat detection & smart study recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button onClick={() => dispatch(clearPyqError())} className="ml-auto text-red-500 hover:text-red-700">✕</button>
          </div>
        )}

        {/* Subject selector + Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          {/* Subject selector */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <BookOpen className="w-4 h-4 text-gray-400" />
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-sm text-gray-900 dark:text-white outline-none pr-6 appearance-none cursor-pointer"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 -ml-5 pointer-events-none" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 overflow-x-auto">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 text-indigo-500 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing PYQ data...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !frequency && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">PYQ Intelligence Engine</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
              Analyze Previous Year Question Papers to discover chapter weightage patterns, identify repeated questions, and get smart study recommendations.
            </p>
            <ul className="text-left max-w-sm mx-auto space-y-2">
              {[
                'Chapter frequency mapping across all years',
                'Trend detection for increasing/decreasing weightages',
                'Near-duplicate question detection',
                'AI-powered prioritized study recommendations',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Content */}
        {frequency && !loading && (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Summary stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{frequency.totalQuestions}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Questions</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{frequency.chapters.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Chapters</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{frequency.topics.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Topics</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{frequency.yearRange}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Year Range</p>
                  </div>
                </div>

                <FrequencyHeatMap frequency={frequency} />
                <SmartRecommendations recommendations={recommendations} />
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="space-y-6">
                <TrendAnalysisChart trends={trends} />
              </div>
            )}

            {activeTab === 'repeats' && (
              <div className="space-y-6">
                <RepeatDetector repeats={repeats} />
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                <SmartRecommendations recommendations={recommendations} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PYQIntelligenceDashboard;
