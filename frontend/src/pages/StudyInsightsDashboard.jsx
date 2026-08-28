import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Brain,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Award,
  BookOpen,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  AlertTriangle,
  Star,
  Flame,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Users,
  Lightbulb,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  Coffee,
  Eye,
  Dumbbell,
} from 'lucide-react';

// ─── Mock Data (simulated API responses) ───────────────────────────────────
const SUBJECTS = [
  { id: 'anatomy', name: 'Anatomy', icon: '🦴', color: '#ef4444', mastery: 78, quizzes: 45, avgScore: 82, studyHours: 32, trend: 'up', topics: 24, mastered: 19 },
  { id: 'physiology', name: 'Physiology', icon: '❤️', color: '#f59e0b', mastery: 65, quizzes: 38, avgScore: 75, studyHours: 28, trend: 'up', topics: 20, mastered: 13 },
  { id: 'pathology', name: 'Pathology', icon: '🔬', color: '#8b5cf6', mastery: 72, quizzes: 52, avgScore: 79, studyHours: 35, trend: 'stable', topics: 30, mastered: 22 },
  { id: 'pharmacology', name: 'Pharmacology', icon: '💊', color: '#06b6d4', mastery: 58, quizzes: 41, avgScore: 71, studyHours: 25, trend: 'down', topics: 28, mastered: 16 },
  { id: 'microbiology', name: 'Microbiology', icon: '🦠', color: '#10b981', mastery: 83, quizzes: 35, avgScore: 88, studyHours: 22, trend: 'up', topics: 18, mastered: 15 },
  { id: 'biochemistry', name: 'Biochemistry', icon: '🧬', color: '#ec4899', mastery: 70, quizzes: 40, avgScore: 76, studyHours: 30, trend: 'up', topics: 22, mastered: 15 },
  { id: 'radiology', name: 'Radiology', icon: '📡', color: '#f97316', mastery: 45, quizzes: 25, avgScore: 65, studyHours: 15, trend: 'down', topics: 16, mastered: 7 },
  { id: 'forensic', name: 'Forensic Medicine', icon: '🔍', color: '#6366f1', mastery: 88, quizzes: 30, avgScore: 91, studyHours: 18, trend: 'up', topics: 14, mastered: 12 },
];

const WEEKLY_DATA = [
  { day: 'Mon', studyMinutes: 180, quizzes: 12, score: 78, focus: 85 },
  { day: 'Tue', studyMinutes: 240, quizzes: 18, score: 82, focus: 90 },
  { day: 'Wed', studyMinutes: 120, quizzes: 8, score: 72, focus: 70 },
  { day: 'Thu', studyMinutes: 200, quizzes: 15, score: 85, focus: 88 },
  { day: 'Fri', studyMinutes: 150, quizzes: 10, score: 80, focus: 82 },
  { day: 'Sat', studyMinutes: 300, quizzes: 22, score: 88, focus: 92 },
  { day: 'Sun', studyMinutes: 100, quizzes: 6, score: 75, focus: 75 },
];

const MONTHLY_TREND = [
  { month: 'Aug', score: 72, hours: 80, quizzes: 45 },
  { month: 'Sep', score: 75, hours: 95, quizzes: 52 },
  { month: 'Oct', score: 78, hours: 110, quizzes: 60 },
  { month: 'Nov', score: 80, hours: 120, quizzes: 68 },
  { month: 'Dec', score: 82, hours: 105, quizzes: 55 },
  { month: 'Jan', score: 85, hours: 130, quizzes: 72 },
];

const AI_INSIGHTS = [
  { type: 'strength', title: 'Strong in Forensic Medicine', description: 'Your 88% mastery is exceptional. Consider mentoring peers or tackling advanced forensic topics.', icon: '🏆', color: '#22c55e' },
  { type: 'weakness', title: 'Radiology Needs Attention', description: 'At 45% mastery, this is your weakest area. Focus on imaging interpretation drills this week.', icon: '⚠️', color: '#ef4444' },
  { type: 'trend', title: 'Pharmacology Declining', description: 'Your scores dropped 7% over 2 weeks. Review drug interactions and mechanisms.', icon: '📉', color: '#f59e0b' },
  { type: 'recommendation', title: 'Optimal Study Time', description: 'Your peak performance is 10AM-12PM. Schedule difficult topics during this window.', icon: '⏰', color: '#3b82f6' },
  { type: 'streak', title: '14-Day Streak!', description: 'Amazing consistency! Keep it going to unlock the "Dedication Master" badge.', icon: '🔥', color: '#f97316' },
  { type: 'suggestion', title: 'Try Active Recall', description: 'Your recall improves 23% when using active recall vs passive reading. Use flashcards more!', icon: '🧠', color: '#8b5cf6' },
];

const STUDY_RECOMMENDATIONS = [
  { subject: 'Radiology', action: 'Complete 20 imaging cases', priority: 'high', estimatedTime: '45 min', impact: '+12% mastery' },
  { subject: 'Pharmacology', action: 'Review drug interaction tables', priority: 'high', estimatedTime: '30 min', impact: '+8% mastery' },
  { subject: 'Physiology', action: 'Practice cardiac cycle questions', priority: 'medium', estimatedTime: '20 min', impact: '+5% mastery' },
  { subject: 'Pathology', action: 'Study neoplasm classification', priority: 'medium', estimatedTime: '25 min', impact: '+4% mastery' },
  { subject: 'Anatomy', action: 'Review brachial plexus', priority: 'low', estimatedTime: '15 min', impact: '+2% mastery' },
];

const LEARNING_STYLES = {
  visual: { label: 'Visual Learner', percentage: 45, color: '#3b82f6', icon: '👁️' },
  auditory: { label: 'Auditory Learner', percentage: 20, color: '#8b5cf6', icon: '👂' },
  kinesthetic: { label: 'Kinesthetic', percentage: 25, color: '#22c55e', icon: '🤲' },
  reading: { label: 'Reading/Writing', percentage: 10, color: '#f59e0b', icon: '📝' },
};

// ─── Helper Components ──────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, subtext, trend, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5 hover:border-stone-600/60 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl`} style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend === 'up' ? '+' : ''}{trend === 'up' ? '12' : '5'}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-stone-100">{value}</p>
      <p className="text-sm text-stone-400 mt-0.5">{label}</p>
      {subtext && <p className="text-xs text-stone-500 mt-1">{subtext}</p>}
    </motion.div>
  );
}

function MasteryBar({ subject, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-stone-900/40 border border-stone-700/30 rounded-xl p-4 hover:border-stone-600/50 transition-all cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{subject.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-stone-200">{subject.name}</span>
            <span className="text-sm font-bold" style={{ color: subject.color }}>{subject.mastery}%</span>
          </div>
          <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${subject.mastery}%` }}
              transition={{ delay: index * 0.05 + 0.3, duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: subject.color }}
            />
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-stone-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-4 gap-3 mt-4 pt-3 border-t border-stone-700/30">
              <div className="text-center">
                <p className="text-lg font-bold text-stone-200">{subject.quizzes}</p>
                <p className="text-[10px] text-stone-500">Quizzes</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-stone-200">{subject.avgScore}%</p>
                <p className="text-[10px] text-stone-500">Avg Score</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-stone-200">{subject.studyHours}h</p>
                <p className="text-[10px] text-stone-500">Study Hours</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-stone-200">{subject.mastered}/{subject.topics}</p>
                <p className="text-[10px] text-stone-500">Topics</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                subject.trend === 'up' ? 'bg-emerald-900/30 text-emerald-400' :
                subject.trend === 'down' ? 'bg-red-900/30 text-red-400' :
                'bg-stone-800 text-stone-400'
              }`}>
                {subject.trend === 'up' ? '📈 Improving' : subject.trend === 'down' ? '📉 Declining' : '➡️ Stable'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InsightCard({ insight, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="p-4 rounded-xl border-l-4 bg-stone-900/40"
      style={{ borderLeftColor: insight.color }}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{insight.icon}</span>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-stone-200">{insight.title}</h4>
          <p className="text-xs text-stone-400 mt-1 leading-relaxed">{insight.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function BarChart({ data, xKey, yKey, color, height = 160 }) {
  const max = Math.max(...data.map(d => d[yKey]), 1);

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-stone-400 font-medium">{d[yKey]}</span>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(d[yKey] / max) * (height - 30)}px` }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
            className="w-full rounded-t-md"
            style={{ backgroundColor: color }}
          />
          <span className="text-[10px] text-stone-500">{d[xKey]}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + d.percentage, 0);
  let cumulative = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        {data.map((d, i) => {
          const strokeDasharray = `${d.percentage} ${100 - d.percentage}`;
          const strokeDashoffset = 100 - cumulative - d.percentage / 2;
          cumulative += d.percentage;
          return (
            <circle
              key={i}
              cx="18" cy="18" r="15.9155"
              fill="none"
              stroke={d.color}
              strokeWidth="3.5"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-stone-200">{total}%</span>
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function StudyInsightsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  // Computed stats
  const totalStudyMinutes = WEEKLY_DATA.reduce((s, d) => s + d.studyMinutes, 0);
  const totalQuizzes = WEEKLY_DATA.reduce((s, d) => s + d.quizzes, 0);
  const avgScore = Math.round(WEEKLY_DATA.reduce((s, d) => s + d.score, 0) / WEEKLY_DATA.length);
  const avgFocus = Math.round(WEEKLY_DATA.reduce((s, d) => s + d.focus, 0) / WEEKLY_DATA.length);
  const totalHours = SUBJECTS.reduce((s, sub) => s + sub.studyHours, 0);
  const overallMastery = Math.round(SUBJECTS.reduce((s, sub) => s + sub.mastery, 0) / SUBJECTS.length);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'insights', label: 'AI Insights', icon: Brain },
    { id: 'recommendations', label: 'Action Plan', icon: Target },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-12 bg-stone-900/60 rounded-xl w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-stone-900/60 rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-stone-900/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-stone-900/60 border border-stone-700/40 hover:border-stone-600/60 text-stone-400 hover:text-stone-200 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-100 flex items-center gap-2">
                <Brain className="h-7 w-7 text-purple-400" />
                Study Insights
              </h1>
              <p className="text-sm text-stone-400">AI-powered analytics for your medical studies</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-700/40 hover:border-stone-600/60 text-stone-400 hover:text-stone-200 transition-all"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-stone-900/40 rounded-xl p-1 border border-stone-700/30 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ Overview Tab ═══ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Clock} label="Study Hours (Week)" value={`${(totalStudyMinutes / 60).toFixed(1)}h`} subtext={`${totalStudyMinutes} minutes`} color="#8b5cf6" delay={0} />
              <StatCard icon={Target} label="Quizzes This Week" value={totalQuizzes} subtext="Across all subjects" color="#06b6d4" delay={0.1} />
              <StatCard icon={TrendingUp} label="Average Score" value={`${avgScore}%`} trend="up" color="#22c55e" delay={0.2} />
              <StatCard icon={Activity} label="Focus Score" value={`${avgFocus}%`} subtext="Average attention" color="#f59e0b" delay={0.3} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Study Pattern */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  <h3 className="text-sm font-semibold text-stone-200">Weekly Study Pattern</h3>
                </div>
                <BarChart data={WEEKLY_DATA} xKey="day" yKey="studyMinutes" color="#8b5cf6" height={160} />
                <p className="text-[10px] text-stone-500 mt-2 text-center">Minutes studied per day</p>
              </motion.div>

              {/* Score Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-stone-200">Monthly Score Trend</h3>
                </div>
                <BarChart data={MONTHLY_TREND} xKey="month" yKey="score" color="#22c55e" height={160} />
                <p className="text-[10px] text-stone-500 mt-2 text-center">Average quiz scores by month</p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Learning Style */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-5 w-5 text-blue-400" />
                  <h3 className="text-sm font-semibold text-stone-200">Learning Style</h3>
                </div>
                <div className="flex justify-center mb-4">
                  <DonutChart data={Object.values(LEARNING_STYLES)} />
                </div>
                <div className="space-y-2">
                  {Object.entries(LEARNING_STYLES).map(([key, style]) => (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      <span>{style.icon}</span>
                      <span className="text-stone-400 flex-1">{style.label}</span>
                      <span className="font-medium" style={{ color: style.color }}>{style.percentage}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Streak & Achievements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <h3 className="text-sm font-semibold text-stone-200">Streaks & Badges</h3>
                </div>
                <div className="text-center mb-4">
                  <p className="text-5xl font-bold text-orange-400">14</p>
                  <p className="text-sm text-stone-400">Day Study Streak</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['🏆', '⚡', '🔥', '💎', '🎯', '🌟'].map((badge, i) => (
                    <div key={i} className="text-center p-2 bg-stone-800/60 rounded-lg">
                      <span className="text-2xl">{badge}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-stone-500 text-center mt-2">6 of 24 badges earned</p>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-sm font-semibold text-stone-200">Overall Progress</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone-400">Overall Mastery</span>
                      <span className="text-purple-400 font-bold">{overallMastery}%</span>
                    </div>
                    <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${overallMastery}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone-400">Total Study Hours</span>
                      <span className="text-blue-400 font-bold">{totalHours}h</span>
                    </div>
                    <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, totalHours / 3)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone-400">Topics Mastered</span>
                      <span className="text-emerald-400 font-bold">119/172</span>
                    </div>
                    <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '69%' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* ═══ Subjects Tab ═══ */}
        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={BookOpen} label="Total Subjects" value={SUBJECTS.length} color="#8b5cf6" delay={0} />
              <StatCard icon={CheckCircle} label="Above 80%" value={SUBJECTS.filter(s => s.mastery >= 80).length} color="#22c55e" delay={0.1} />
              <StatCard icon={AlertTriangle} label="Below 60%" value={SUBJECTS.filter(s => s.mastery < 60).length} color="#ef4444" delay={0.2} />
              <StatCard icon={Dumbbell} label="Total Hours" value={`${totalHours}h`} color="#06b6d4" delay={0.3} />
            </div>

            <div className="space-y-3">
              {SUBJECTS.sort((a, b) => b.mastery - a.mastery).map((subject, i) => (
                <MasteryBar key={subject.id} subject={subject} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* ═══ AI Insights Tab ═══ */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/30 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h3 className="text-sm font-semibold text-purple-300">AI Study Analysis</h3>
              </div>
              <p className="text-xs text-stone-400">
                Based on your last 30 days of study data, quiz performance, and learning patterns, here are personalized insights to optimize your preparation.
              </p>
            </motion.div>

            <div className="space-y-3">
              {AI_INSIGHTS.map((insight, i) => (
                <InsightCard key={i} insight={insight} index={i} />
              ))}
            </div>

            {/* Performance Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-stone-200">Daily Performance Heatmap</h3>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-center text-[10px] text-stone-500 mb-1">{day}</div>
                ))}
                {Array.from({ length: 28 }, (_, i) => {
                  const intensity = Math.random();
                  const bg = intensity > 0.7 ? 'bg-emerald-500/80' :
                             intensity > 0.4 ? 'bg-emerald-500/40' :
                             intensity > 0.2 ? 'bg-emerald-500/20' : 'bg-stone-800/40';
                  return (
                    <div
                      key={i}
                      className={`h-6 rounded-sm ${bg} transition-colors hover:ring-1 hover:ring-emerald-400/50`}
                      title={`Day ${i + 1}: ${Math.round(intensity * 100)}% activity`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-1 mt-2">
                <span className="text-[10px] text-stone-500">Less</span>
                <div className="w-3 h-3 rounded-sm bg-stone-800/40" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500/20" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500/40" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500/80" />
                <span className="text-[10px] text-stone-500">More</span>
              </div>
            </motion.div>
          </div>
        )}

        {/* ═══ Action Plan Tab ═══ */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-700/30 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-blue-300">Personalized Action Plan</h3>
              </div>
              <p className="text-xs text-stone-400">
                Prioritized tasks based on your performance gaps, exam proximity, and learning objectives.
              </p>
            </motion.div>

            <div className="space-y-3">
              {STUDY_RECOMMENDATIONS.map((rec, i) => {
                const priorityColors = {
                  high: { bg: 'bg-red-900/20', border: 'border-red-700/40', badge: 'bg-red-900/40 text-red-400' },
                  medium: { bg: 'bg-amber-900/20', border: 'border-amber-700/40', badge: 'bg-amber-900/40 text-amber-400' },
                  low: { bg: 'bg-blue-900/20', border: 'border-blue-700/40', badge: 'bg-blue-900/40 text-blue-400' },
                };
                const colors = priorityColors[rec.priority];

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-4 rounded-xl border ${colors.border} ${colors.bg} hover:scale-[1.01] transition-transform`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                            {rec.priority.toUpperCase()}
                          </span>
                          <span className="text-xs text-stone-400">{rec.subject}</span>
                        </div>
                        <p className="text-sm font-medium text-stone-200">{rec.action}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-500">
                          <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {rec.estimatedTime}</span>
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {rec.impact}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-stone-500" />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Weekly Goal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Coffee className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-semibold text-stone-200">Weekly Goal Progress</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Study Hours', current: 21, target: 25, unit: 'h', color: '#8b5cf6' },
                  { label: 'Quizzes Done', current: 91, target: 100, unit: '', color: '#06b6d4' },
                  { label: 'Avg Score', current: 80, target: 85, unit: '%', color: '#22c55e' },
                ].map((goal, i) => {
                  const pct = Math.min(100, (goal.current / goal.target) * 100);
                  return (
                    <div key={i} className="text-center">
                      <p className="text-xs text-stone-500 mb-2">{goal.label}</p>
                      <p className="text-2xl font-bold" style={{ color: goal.color }}>
                        {goal.current}{goal.unit}
                      </p>
                      <p className="text-[10px] text-stone-500">of {goal.target}{goal.unit}</p>
                      <div className="h-1.5 bg-stone-800 rounded-full mt-2 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
