import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Sparkles,
  Calendar,
  Clock,
  Activity,
} from 'lucide-react';
import api from '../services/api';

// Analytics Components
import WeeklyStudyOverview from '../components/Analytics/WeeklyStudyOverview';
import SubjectMasteryGrid from '../components/Analytics/SubjectMasteryGrid';
import QuizTrendChart from '../components/Analytics/QuizTrendChart';
import ActivityHeatmapCalendar from '../components/Analytics/ActivityHeatmapCalendar';
import StudyRecommendations from '../components/Analytics/StudyRecommendations';

/**
 * Loading skeleton for the analytics page
 */
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-stone-800 rounded-xl" />
            <div>
              <div className="h-4 w-32 bg-stone-800 rounded mb-1" />
              <div className="h-3 w-24 bg-stone-800/60 rounded" />
            </div>
          </div>
          <div className="h-48 bg-stone-800/40 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/**
 * StudyAnalytics Page
 * Comprehensive analytics dashboard showing weekly overview,
 * subject mastery, quiz trends, activity patterns, and
 * AI-powered study recommendations.
 */
export default function StudyAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    weeklyOverview: [],
    subjectMastery: [],
    quizTrend: [],
    activityPattern: { pattern: [], peakHours: [] },
    recommendations: { recommendations: [], summary: {}, consistency: 0, activeDays: 0 },
  });

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await api.get('/analytics-insights/overview');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err.response?.data?.error || 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Merge recommendation metadata
  const enrichedRecommendations = useMemo(() => {
    const recs = data.recommendations?.recommendations || [];
    return recs;
  }, [data.recommendations]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-stone-950/80 backdrop-blur-xl border-b border-stone-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back button + Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-stone-800/60 transition text-stone-400 hover:text-stone-200"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-black font-display text-stone-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  Study Analytics
                </h1>
                <p className="text-[11px] text-stone-500 font-mono hidden sm:block">
                  Performance insights & personalized recommendations
                </p>
              </div>
            </div>

            {/* Right: Refresh button */}
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-stone-800/60 border border-stone-700/40 rounded-lg text-xs font-semibold text-stone-300 hover:bg-stone-700/60 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnalyticsSkeleton />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-stone-900/60 border border-rose-500/20 rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-stone-200 mb-2">
                Failed to Load Analytics
              </h3>
              <p className="text-sm text-stone-400 mb-4">{error}</p>
              <button
                onClick={() => fetchAnalytics()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-lg transition"
              >
                Try Again
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Row 1: Weekly Overview + Subject Mastery */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WeeklyStudyOverview data={data.weeklyOverview} />
                <SubjectMasteryGrid subjects={data.subjectMastery} />
              </div>

              {/* Row 2: Quiz Trend + Activity Pattern */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <QuizTrendChart data={data.quizTrend} />
                <ActivityHeatmapCalendar data={data.activityPattern} />
              </div>

              {/* Row 3: Recommendations (full width) */}
              <StudyRecommendations
                recommendations={enrichedRecommendations}
                summary={data.recommendations?.summary || {}}
              />

              {/* Footer info */}
              <div className="flex items-center justify-center gap-2 py-4">
                <Sparkles className="w-3 h-3 text-stone-600" />
                <p className="text-[11px] text-stone-600 font-mono">
                  Analytics data updates in real-time as you study
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


