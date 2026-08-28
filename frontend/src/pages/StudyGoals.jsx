import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchGoals,
  fetchDashboard,
  fetchStreakMetrics,
  fetchSubjectAnalytics,
  fetchWeeklyReports,
  generateWeeklyReport,
  clearErrors,
} from '../store/slices/studyGoalSlice';
import StudyGoalCard from '../components/planner/StudyGoalCard';
import CreateGoalModal from '../components/planner/CreateGoalModal';
import WeeklyReportCard from '../components/planner/WeeklyReportCard';
import StreakCounter from '../components/planner/StreakCounter';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'expired', label: 'Expired' },
];

const TYPE_FILTERS = [
  { value: '', label: 'All Types' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom' },
];

export default function StudyGoals() {
  const dispatch = useDispatch();
  const {
    goals,
    goalsPagination,
    dashboard,
    streakMetrics,
    subjectAnalytics,
    weeklyReports,
    loadingGoals,
    loadingDashboard,
    loadingStreaks,
    creatingGoal,
  } = useSelector((state) => state.studyGoals);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeTab, setActiveTab] = useState('goals');
  const [generatingReport, setGeneratingReport] = useState(false);

  // Load data on mount
  useEffect(() => {
    dispatch(fetchDashboard());
    dispatch(fetchStreakMetrics());
    dispatch(fetchSubjectAnalytics());
    dispatch(fetchGoals({ status: statusFilter || undefined, goalType: typeFilter || undefined }));
    dispatch(fetchWeeklyReports());

    return () => dispatch(clearErrors());
  }, [dispatch]);

  // Refetch goals when filters change
  useEffect(() => {
    dispatch(fetchGoals({ status: statusFilter || undefined, goalType: typeFilter || undefined }));
  }, [dispatch, statusFilter, typeFilter]);

  const handleGenerateReport = () => {
    setGeneratingReport(true);
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    dispatch(
      generateWeeklyReport({
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
      })
    ).then(() => {
      setGeneratingReport(false);
      dispatch(fetchWeeklyReports());
    });
  };

  // Memoize filtered goals
  const displayedGoals = useMemo(() => goals || [], [goals]);

  // Active goals count from dashboard
  const activeGoalCount = dashboard?.activeGoalCount || 0;
  const weeklyProgress = dashboard?.weeklyProgress || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              🎯 Study Goals
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track your study targets, build streaks, and monitor weekly progress
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={creatingGoal}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-colors text-sm"
          >
            {creatingGoal ? 'Creating...' : '+ New Goal'}
          </button>
        </div>

        {/* Dashboard Summary Cards */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Active Goals */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-lg">
                  📋
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {activeGoalCount}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Active Goals</p>
                </div>
              </div>
            </div>

            {/* Weekly Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-lg">
                  ✅
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {weeklyProgress.completionRate || 0}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Weekly Completion</p>
                </div>
              </div>
            </div>

            {/* Goals This Week */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-lg">
                  📊
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {weeklyProgress.totalGoalsCompleted || 0}/{weeklyProgress.totalGoalsSet || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Goals This Week</p>
                </div>
              </div>
            </div>

            {/* Total Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-lg">
                  📈
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {weeklyProgress.totalProgressValue || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Progress</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar — Streak + Subjects */}
          <div className="lg:col-span-1 space-y-4">
            {/* Streak Counter */}
            {streakMetrics && (
              <StreakCounter
                currentStreak={streakMetrics.currentStreak || 0}
                longestStreak={streakMetrics.longestStreak || 0}
                consistencyScore={streakMetrics.consistencyScore || 0}
              />
            )}

            {/* Subject Breakdown */}
            {subjectAnalytics && subjectAnalytics.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  📚 Subject Progress
                </h3>
                <div className="space-y-3">
                  {subjectAnalytics.map((sub) => (
                    <div key={sub.subjectId}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400 truncate">
                          {sub.subjectName}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {sub.avgCompletionRate}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            sub.avgCompletionRate >= 80
                              ? 'bg-emerald-500'
                              : sub.avgCompletionRate >= 50
                              ? 'bg-amber-500'
                              : 'bg-red-400'
                          }`}
                          style={{ width: `${sub.avgCompletionRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            {streakMetrics && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  🏅 All-Time Stats
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Goals Completed</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {streakMetrics.totalGoalsCompleted}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Goals Missed</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {streakMetrics.totalGoalsMissed}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Active Study Days</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {streakMetrics.activeDaysCount}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
              <button
                onClick={() => setActiveTab('goals')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'goals'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                📋 My Goals
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'reports'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                📊 Weekly Reports
              </button>
            </div>

            {/* Goals Tab */}
            {activeTab === 'goals' && (
              <div>
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <div className="flex items-center gap-1">
                    {STATUS_FILTERS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setStatusFilter(f.value)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                          statusFilter === f.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  >
                    {TYPE_FILTERS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Goals Grid */}
                {loadingGoals ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : displayedGoals.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-3">🎯</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      No goals yet
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Create your first study goal to start tracking your progress
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      + Create Goal
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedGoals.map((goal) => (
                      <StudyGoalCard key={goal.id} goal={goal} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {goalsPagination && goalsPagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
                    Page {goalsPagination.page} of {goalsPagination.totalPages}
                  </div>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div>
                {/* Generate Report Button */}
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {weeklyReports.length} report{weeklyReports.length !== 1 ? 's' : ''} available
                  </p>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {generatingReport ? 'Generating...' : '📊 Generate This Week\'s Report'}
                  </button>
                </div>

                {/* Reports List */}
                {weeklyReports.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-3">📊</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      No reports yet
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Generate your first weekly report to see your study analytics
                    </p>
                    <button
                      onClick={handleGenerateReport}
                      disabled={generatingReport}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      Generate Report
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {weeklyReports.map((report) => (
                      <WeeklyReportCard key={report.id} report={report} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
