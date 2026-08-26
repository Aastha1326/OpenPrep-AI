import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Brain,
  Zap,
  RefreshCw,
  Download,
  Filter,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Loader2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  analyzeWeakness,
  fetchWeaknessProfile,
  fetchWeaknessReports,
  fetchWeaknessTrends,
  fetchWeaknessHeatmap,
  fetchRecommendations,
  fetchSubjectAnalysis,
  clearError,
  clearAnalysisResult,
  clearSelectedSubject,
} from '../store/slices/weaknessSlice';

import WeaknessTrendChart from '../components/WeaknessDetection/WeaknessTrendChart';
import WeaknessHeatMap from '../components/WeaknessDetection/WeaknessHeatMap';
import TopicMasteryCard from '../components/WeaknessDetection/TopicMasteryCard';
import SubjectBreakdown from '../components/WeaknessDetection/SubjectBreakdown';
import AIRecommendationsPanel from '../components/WeaknessDetection/AIRecommendationsPanel';
import WeaknessTimeline from '../components/WeaknessDetection/WeaknessTimeline';

const OverviewStatCard = ({ icon: Icon, label, value, subValue, color, trend }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all hover:shadow-md">
    <div className="flex items-center justify-between mb-2">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend && (
        <span
          className={`text-xs font-medium ${
            trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          {trend > 0 ? '+' : ''}
          {trend}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    {subValue && (
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{subValue}</p>
    )}
  </div>
);

const FilterBar = ({ filter, setFilter, onAnalyze, analyzing }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const filters = [
    { value: 'all', label: 'All Topics' },
    { value: 'Weak', label: 'Weak Only' },
    { value: 'Medium', label: 'Medium Only' },
    { value: 'Strong', label: 'Strong Only' },
  ];

  const currentFilter = filters.find((f) => f.value === filter);

  return (
    <div className="flex items-center gap-3">
      {/* Filter dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <Filter className="w-4 h-4" />
          {currentFilter?.label}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {showDropdown && (
          <div className="absolute top-full mt-1 left-0 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setFilter(f.value);
                  setShowDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                  filter === f.value
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Analyze button */}
      <button
        onClick={onAnalyze}
        disabled={analyzing}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {analyzing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
      </button>
    </div>
  );
};

const EmptyState = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12">
    <div className="text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
        <Brain className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        AI Weakness Detection Engine
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Analyze your quiz performance across all subjects to identify weak areas,
        track improvement trends, and get personalized AI-powered study recommendations.
      </p>
      <ul className="text-left space-y-3 mb-6">
        {[
          'Identifies topics categorized as Weak, Medium, or Strong',
          'Tracks improvement velocity over time',
          'Generates AI-powered personalized study recommendations',
          'Visual heatmap of your knowledge gaps across subjects',
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const WeaknessDetectionDashboard = () => {
  const dispatch = useDispatch();
  const {
    profile,
    reports,
    reportsPagination,
    trends,
    heatmap,
    heatmapSummary,
    recommendations,
    weakTopics,
    analysisResult,
    loading,
    analyzing,
    error,
  } = useSelector((state) => state.weakness);

  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Load initial data
    dispatch(fetchWeaknessProfile());
    dispatch(fetchWeaknessTrends(30));
    dispatch(fetchWeaknessHeatmap());
    dispatch(fetchRecommendations());
    dispatch(fetchWeaknessReports({ page: 1, limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearError()), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleAnalyze = () => {
    dispatch(analyzeWeakness('manual'));
  };

  const handleSelectSubject = (subjectId) => {
    dispatch(fetchSubjectAnalysis(subjectId));
    setActiveTab('topics');
  };

  // Filter topics based on filter selection
  const filteredTopics = profile?.topics
    ? filter === 'all'
      ? profile.topics
      : profile.topics.filter((t) => t.status === filter)
    : [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'heatmap', label: 'Heatmap', icon: AlertTriangle },
    { id: 'topics', label: 'Topics', icon: Zap },
    { id: 'timeline', label: 'Timeline', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Weakness Detection
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Analyze performance, track trends, and get AI-powered study recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => dispatch(clearError())}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Analysis result notification */}
        {analysisResult && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Analysis Complete! Your weakness profile has been updated.
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                Trend: {analysisResult.trend?.direction} • Delta:{' '}
                {analysisResult.trend?.delta > 0 ? '+' : ''}
                {analysisResult.trend?.delta}%
              </p>
            </div>
            <button
              onClick={() => dispatch(clearAnalysisResult())}
              className="text-emerald-500 hover:text-emerald-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex items-center gap-1 mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 overflow-x-auto">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}

          <div className="flex-1" />

          <FilterBar
            filter={filter}
            setFilter={setFilter}
            onAnalyze={handleAnalyze}
            analyzing={analyzing}
          />
        </div>

        {/* Loading state */}
        {loading && !profile && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading your weakness profile...
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !profile && <EmptyState />}

        {/* Main content */}
        {profile && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <OverviewStatCard
                    icon={BarChart3}
                    label="Overall Score"
                    value={`${profile.overallScore}%`}
                    color="bg-blue-500"
                    trend={analysisResult?.trend?.delta}
                  />
                  <OverviewStatCard
                    icon={XCircle}
                    label="Weak Topics"
                    value={profile.weakCount}
                    subValue="Need attention"
                    color="bg-red-500"
                  />
                  <OverviewStatCard
                    icon={AlertTriangle}
                    label="Medium Topics"
                    value={profile.mediumCount}
                    subValue="Approaching mastery"
                    color="bg-amber-500"
                  />
                  <OverviewStatCard
                    icon={CheckCircle}
                    label="Strong Topics"
                    value={profile.strongCount}
                    subValue="Well mastered"
                    color="bg-emerald-500"
                  />
                </div>

                {/* Coverage */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Topic Coverage
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {profile.coveragePercentage}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
                      style={{ width: `${profile.coveragePercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {profile.coveragePercentage}% of your topics have been attempted at least once
                  </p>
                </div>

                {/* Trend chart */}
                <WeaknessTrendChart trends={trends} />

                {/* Subject breakdown + Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SubjectBreakdown
                    subjects={profile.subjects}
                    onSelectSubject={handleSelectSubject}
                  />
                  <AIRecommendationsPanel
                    recommendations={recommendations}
                    loading={loading}
                  />
                </div>
              </div>
            )}

            {/* Heatmap Tab */}
            {activeTab === 'heatmap' && (
              <div className="space-y-6">
                <WeaknessHeatMap heatmap={heatmap} summary={heatmapSummary} />
              </div>
            )}

            {/* Topics Tab */}
            {activeTab === 'topics' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Topic Mastery{' '}
                    {filter !== 'all' && (
                      <span className="text-sm font-normal text-gray-500">
                        ({filter})
                      </span>
                    )}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {filteredTopics.length} topic{filteredTopics.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {filteredTopics.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No topics match the current filter
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredTopics.map((topic) => (
                      <TopicMasteryCard key={topic.topicId} topic={topic} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <WeaknessTimeline reports={reports} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WeaknessDetectionDashboard;
