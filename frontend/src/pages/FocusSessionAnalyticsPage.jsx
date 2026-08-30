import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Timer,
  Play,
  Pause,
  Square,
  Flame,
  Clock,
  Target,
  TrendingUp,
  BarChart3,
  Zap,
  Activity,
  BookOpen,
  Brain,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Coffee,
  Star,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import {
  startFocusSession,
  endFocusSession,
  toggleFocusPause,
  getFocusSessions,
  getWeeklyAnalytics,
  getFocusDashboard,
  getHourlyHeatmap,
  getEfficiencyTrend,
} from '../services/focusSessionAnalyticsApi';

// ── Constants ────────────────────────────────────────────────────────────

const TASK_TYPES = [
  { id: 'reading', label: 'Reading', icon: BookOpen, color: '#3b82f6' },
  { id: 'flashcards', label: 'Flashcards', icon: Zap, color: '#8b5cf6' },
  { id: 'quiz', label: 'Quiz', icon: Brain, color: '#f59e0b' },
  { id: 'notes', label: 'Notes', icon: Star, color: '#22c55e' },
  { id: 'revision', label: 'Revision', icon: RotateCcw, color: '#06b6d4' },
  { id: 'practice', label: 'Practice', icon: Target, color: '#ef4444' },
  { id: 'other', label: 'Other', icon: Coffee, color: '#6366f1' },
];

const PLANNED_DURATIONS = [15, 25, 30, 45, 60, 90];

const QUALITY_COLORS = {
  excellent: '#22c55e',
  good: '#3b82f6',
  average: '#f59e0b',
  poor: '#ef4444',
};

// ── Helper Functions ─────────────────────────────────────────────────────

function formatMinutes(mins) {
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getQualityLabel(score) {
  if (score >= 85) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 45) return 'average';
  return 'poor';
}

function getHeatmapColor(minutes, maxMinutes) {
  if (minutes === 0) return 'bg-stone-800/40';
  const intensity = Math.min(1, minutes / Math.max(maxMinutes, 1));
  if (intensity > 0.75) return 'bg-emerald-500';
  if (intensity > 0.5) return 'bg-emerald-600';
  if (intensity > 0.25) return 'bg-emerald-700';
  return 'bg-emerald-800/70';
}

// ── Components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-stone-900/60 border border-stone-700/40 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="text-xs text-stone-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-stone-100">{value}</p>
    </motion.div>
  );
}

function LiveTimer({ session, onEnd, onPause, onInterruption }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!session || session.status === 'completed' || session.status === 'abandoned') return;
    const start = new Date(session.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session || (session.status !== 'active' && session.status !== 'paused')) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const planned = (session.plannedMinutes || 25) * 60;
  const progress = Math.min(100, Math.round((elapsed / planned) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-stone-900/80 border-2 border-amber-500/40 rounded-2xl p-6 text-center"
    >
      <div className="mb-2">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          session.status === 'active' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-amber-900/40 text-amber-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${session.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          {session.status === 'active' ? 'FOCUSING' : 'PAUSED'}
        </span>
      </div>

      <p className="text-5xl font-mono font-bold text-stone-100 my-4">
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </p>

      <p className="text-sm text-stone-400 mb-4">
        {session.taskType} &middot; {session.plannedMinutes || 25}min planned &middot; #{session.pomodoroNumber}
      </p>

      {/* Progress bar */}
      <div className="h-2 bg-stone-800 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: progress >= 100 ? '#22c55e' : '#f59e0b',
          }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onPause}
          className="px-4 py-2 rounded-xl bg-stone-800 border border-stone-700/50 text-stone-300 hover:text-stone-100 text-sm flex items-center gap-2 transition-all"
        >
          {session.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {session.status === 'active' ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={onInterruption}
          className="px-4 py-2 rounded-xl bg-stone-800 border border-stone-700/50 text-stone-300 hover:text-stone-100 text-sm flex items-center gap-2 transition-all"
        >
          <AlertTriangle className="h-4 w-4" />
          Interrupt
        </button>
        <button
          onClick={onEnd}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium flex items-center gap-2 transition-all"
        >
          <Square className="h-4 w-4" />
          End Session
        </button>
      </div>
    </motion.div>
  );
}

function SessionRow({ session }) {
  const quality = getQualityLabel(session.focusScore || 0);
  const taskType = TASK_TYPES.find((t) => t.id === session.taskType);

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-stone-800/40 border border-stone-700/20 hover:border-stone-600/40 transition-all">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${taskType?.color || '#6366f1'}20` }}>
          {taskType ? <taskType.icon className="h-4 w-4" style={{ color: taskType.color }} /> : <Coffee className="h-4 w-4 text-stone-400" />}
        </div>
        <div>
          <p className="text-sm font-medium text-stone-200">{session.taskType}</p>
          <p className="text-[10px] text-stone-500">{session.actualMinutes || 0}min &middot; {session.interruptions || 0} interruptions</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-bold text-stone-100">{session.efficiencyScore || 0}%</p>
          <p className="text-[10px] text-stone-500">efficiency</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
          quality === 'excellent' ? 'bg-emerald-900/40 text-emerald-400' :
          quality === 'good' ? 'bg-blue-900/40 text-blue-400' :
          quality === 'average' ? 'bg-amber-900/40 text-amber-400' :
          'bg-red-900/40 text-red-400'
        }`}>
          {quality}
        </span>
        <span className="text-[10px] text-stone-500">{formatTimeAgo(session.startedAt)}</span>
      </div>
    </div>
  );
}

function HeatmapGrid({ data, maxMinutes }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-1">
      {days.map((day, dayIdx) => (
        <div key={day} className="flex items-center gap-1">
          <span className="text-[10px] text-stone-500 w-7">{day}</span>
          {(data[dayIdx] || []).map((minutes, hourIdx) => (
            <div
              key={hourIdx}
              className={`w-3 h-3 rounded-sm ${getHeatmapColor(minutes, maxMinutes)} transition-colors`}
              title={`${day} ${hourIdx}:00 — ${Math.round(minutes)}min`}
            />
          ))}
        </div>
      ))}
      <div className="flex items-center gap-1 ml-8">
        {Array.from({ length: 24 }, (_, i) => (
          <span key={i} className="w-3 text-center text-[7px] text-stone-600">
            {i % 6 === 0 ? i : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────

export default function FocusSessionAnalyticsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Data
  const [dashboard, setDashboard] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [trend, setTrend] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Active session state
  const [activeSession, setActiveSession] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [newTaskType, setNewTaskType] = useState('reading');
  const [newPlannedMinutes, setNewPlannedMinutes] = useState(25);
  const [newSubjectName, setNewSubjectName] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [dashRes, weekRes, heatRes, trendRes, sessRes] = await Promise.allSettled([
        getFocusDashboard(),
        getWeeklyAnalytics(),
        getHourlyHeatmap(),
        getEfficiencyTrend({ days: 30 }),
        getFocusSessions({ limit: 10 }),
      ]);
      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data.data);
      if (weekRes.status === 'fulfilled') setWeekly(weekRes.value.data.data);
      if (heatRes.status === 'fulfilled') setHeatmap(heatRes.value.data.data);
      if (trendRes.status === 'fulfilled') setTrend(trendRes.value.data.data);
      if (sessRes.status === 'fulfilled') setSessions(sessRes.value.data.data);
    } catch (err) {
      console.error('Failed to load focus analytics', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleStartSession = async () => {
    try {
      const res = await startFocusSession({
        taskType: newTaskType,
        plannedMinutes: newPlannedMinutes,
        subjectName: newSubjectName || null,
      });
      setActiveSession(res.data.data);
      setShowStartModal(false);
      setActiveTab('timer');
    } catch (err) {
      console.error('Failed to start session', err);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      await endFocusSession(activeSession.id);
      setActiveSession(null);
      fetchAll();
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Failed to end session', err);
    }
  };

  const handlePauseSession = async () => {
    if (!activeSession) return;
    try {
      const res = await toggleFocusPause(activeSession.id);
      setActiveSession(res.data.data);
    } catch (err) {
      console.error('Failed to toggle pause', err);
    }
  };

  const handleInterruption = async () => {
    if (!activeSession) return;
    try {
      await import('../services/focusSessionAnalyticsApi').then((mod) =>
        mod.recordInterruption(activeSession.id, { reason: 'manual' })
      );
    } catch (err) {
      console.error('Failed to record interruption', err);
    }
  };

  const maxHeatmapMinutes = useMemo(() => {
    if (!heatmap || heatmap.length === 0) return 1;
    let max = 0;
    for (const row of heatmap) {
      for (const val of row) {
        if (val > max) max = val;
      }
    }
    return max || 1;
  }, [heatmap]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'timer', label: 'Active', icon: Timer },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 p-6">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="h-12 bg-stone-900/60 rounded-xl w-72" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-stone-900/60 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
                    className="p-2 rounded-xl bg-stone-900/60 border border-stone-700/40 text-stone-400 hover:text-stone-200 transition-all">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-100 flex items-center gap-2">
                <Timer className="h-7 w-7 text-amber-400" />
                Focus Session Analytics
              </h1>
              <p className="text-sm text-stone-400">
                Track your focus sessions, efficiency, and streaks
                {dashboard?.streaks?.currentStreak > 0 && (
                  <span className="ml-2 text-amber-400 font-semibold">
                    &middot; 🔥 {dashboard.streaks.currentStreak} day streak
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowStartModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-amber-600/20"
          >
            <Play className="h-4 w-4" />
            Start Session
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-stone-900/40 rounded-xl p-1 border border-stone-700/30 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                    }`}>
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ Dashboard Tab ═══ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Clock} label="Today" value={formatMinutes(dashboard?.today?.totalMinutes || 0)} color="#3b82f6" delay={0.1} />
              <StatCard icon={Flame} label="Streak" value={`${dashboard?.streaks?.currentStreak || 0} days`} color="#f59e0b" delay={0.15} />
              <StatCard icon={BarChart3} label="This Week" value={`${dashboard?.week?.totalHours || 0}h`} color="#8b5cf6" delay={0.2} />
              <StatCard icon={TrendingUp} label="This Month" value={`${dashboard?.month?.totalHours || 0}h`} color="#22c55e" delay={0.25} />
            </div>

            {/* Goal Progress */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-400" /> Daily Goal
                </h3>
                <span className="text-sm font-bold text-amber-400">{dashboard?.today?.goalProgress || 0}%</span>
              </div>
              <div className="h-3 bg-stone-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dashboard?.today?.goalProgress || 0}%` }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="h-full rounded-full bg-amber-500"
                />
              </div>
              <p className="text-xs text-stone-500 mt-2">
                {dashboard?.today?.totalMinutes || 0} / {dashboard?.today?.goalTarget || 120} minutes
                {dashboard?.today?.goalMet && <span className="ml-2 text-emerald-400 font-semibold">Goal achieved!</span>}
              </p>
            </motion.div>

            {/* Quality Distribution */}
            {weekly?.qualityDistribution && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                          className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-stone-200 mb-4">Session Quality Distribution</h3>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(weekly.qualityDistribution).map(([level, count]) => (
                    <div key={level} className="text-center p-3 rounded-xl bg-stone-800/40 border border-stone-700/20">
                      <p className="text-2xl font-bold" style={{ color: QUALITY_COLORS[level] }}>{count}</p>
                      <p className="text-[10px] text-stone-400 capitalize">{level}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Daily Breakdown */}
            {weekly?.dailyBreakdown && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                          className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-stone-200 mb-4">This Week</h3>
                <div className="space-y-2">
                  {weekly.dailyBreakdown.map((day, i) => {
                    const maxDayMinutes = Math.max(...weekly.dailyBreakdown.map((d) => d.totalMinutes), 1);
                    const pct = Math.round((day.totalMinutes / maxDayMinutes) * 100);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-stone-400 w-8">{day.dayName}</span>
                        <div className="flex-1 h-5 bg-stone-800/40 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.5 + i * 0.05, duration: 0.6 }}
                            className="h-full rounded-full bg-amber-500/70"
                          />
                        </div>
                        <span className="text-xs text-stone-300 w-12 text-right">{day.totalMinutes}m</span>
                        <span className="text-[10px] text-stone-500 w-8 text-right">{day.sessionCount}s</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Subject Breakdown */}
            {weekly?.subjectBreakdown?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                          className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-stone-200 mb-4">Subject Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {weekly.subjectBreakdown.map((sub, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-stone-800/40 border border-stone-700/20">
                      <div>
                        <p className="text-sm font-medium text-stone-200">{sub.name}</p>
                        <p className="text-[10px] text-stone-500">{sub.sessionCount} sessions &middot; avg {sub.avgEfficiency}% eff</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-stone-100">{formatMinutes(sub.totalMinutes)}</p>
                        <p className="text-[10px] text-stone-500">{sub.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ═══ Active Timer Tab ═══ */}
        {activeTab === 'timer' && (
          <div className="space-y-6">
            {activeSession ? (
              <LiveTimer
                session={activeSession}
                onEnd={handleEndSession}
                onPause={handlePauseSession}
                onInterruption={handleInterruption}
              />
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-10 text-center">
                <Timer className="h-12 w-12 text-stone-600 mx-auto mb-4" />
                <p className="text-stone-400 mb-4">No active session. Start a new focus session to begin tracking.</p>
                <button
                  onClick={() => setShowStartModal(true)}
                  className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium transition-all"
                >
                  Start Focus Session
                </button>
              </motion.div>
            )}

            {/* Recent Sessions */}
            {sessions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-stone-200">Recent Sessions</h3>
                {sessions.map((s) => <SessionRow key={s.id} session={s} />)}
              </div>
            )}
          </div>
        )}

        {/* ═══ History Tab ═══ */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-stone-500">No sessions recorded yet.</div>
            ) : (
              sessions.map((s) => <SessionRow key={s.id} session={s} />)
            )}
          </div>
        )}

        {/* ═══ Analytics Tab ═══ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Efficiency Trend */}
            {trend.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-stone-200 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-400" /> Efficiency Trend (30 days)
                </h3>
                <div className="space-y-1">
                  {trend.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] text-stone-500 w-16">{d.date.slice(5)}</span>
                      <div className="flex-1 h-4 bg-stone-800/40 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500/70" style={{ width: `${d.avgEfficiency}%` }} />
                      </div>
                      <span className="text-xs text-stone-300 w-8 text-right">{d.avgEfficiency}%</span>
                      <span className="text-[10px] text-stone-500 w-6 text-right">{d.sessionCount}x</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Heatmap */}
            {heatmap.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                          className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-stone-200 mb-4">Focus Activity Heatmap (30 days)</h3>
                <HeatmapGrid data={heatmap} maxMinutes={maxHeatmapMinutes} />
              </motion.div>
            )}

            {/* Task Type Breakdown */}
            {weekly?.taskTypeBreakdown?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                          className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-stone-200 mb-4">Task Type Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {weekly.taskTypeBreakdown.map((t, i) => {
                    const tt = TASK_TYPES.find((x) => x.id === t.type);
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-stone-800/40 border border-stone-700/20">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${tt?.color || '#6366f1'}20` }}>
                          {tt ? <tt.icon className="h-4 w-4" style={{ color: tt.color }} /> : <Coffee className="h-4 w-4 text-stone-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-200 capitalize">{t.type}</p>
                          <p className="text-[10px] text-stone-500">{formatMinutes(t.totalMinutes)} &middot; {t.percentage}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Weekly Summary */}
            {weekly?.summary && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                          className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-stone-200 mb-4">Weekly Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Time', value: `${weekly.summary.totalHours}h` },
                    { label: 'Sessions', value: weekly.summary.totalSessions },
                    { label: 'Completion', value: `${weekly.summary.completionRate}%` },
                    { label: 'Avg Efficiency', value: `${weekly.summary.avgEfficiency}%` },
                    { label: 'Avg Focus Score', value: weekly.summary.avgFocusScore },
                    { label: 'Interruptions', value: weekly.summary.totalInterruptions },
                    { label: 'Goals Met', value: weekly.summary.goalsMet },
                    { label: 'Best Day', value: weekly.summary.bestDay || 'N/A' },
                  ].map((item, i) => (
                    <div key={i} className="text-center p-3 rounded-xl bg-stone-800/40 border border-stone-700/20">
                      <p className="text-xl font-bold text-stone-100">{item.value}</p>
                      <p className="text-[10px] text-stone-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ═══ Start Session Modal ═══ */}
        <AnimatePresence>
          {showStartModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowStartModal(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                          className="bg-stone-900 border border-stone-700/40 rounded-2xl p-6 w-full max-w-md space-y-5"
                          onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                  <Play className="h-5 w-5 text-amber-400" />
                  Start Focus Session
                </h3>

                {/* Task Type */}
                <div>
                  <label className="text-sm font-medium text-stone-200 mb-2 block">Task Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {TASK_TYPES.map((tt) => (
                      <button key={tt.id} onClick={() => setNewTaskType(tt.id)}
                              className={`p-2 rounded-xl text-center transition-all border ${
                                newTaskType === tt.id
                                  ? 'border-amber-500 bg-stone-800/80'
                                  : 'border-stone-700/30 bg-stone-800/40 hover:border-stone-600/50'
                              }`}>
                        <tt.icon className="h-4 w-4 mx-auto mb-1" style={{ color: tt.color }} />
                        <p className="text-[10px] text-stone-300">{tt.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="text-sm font-medium text-stone-200 mb-2 block">Planned Duration</label>
                  <div className="flex gap-2">
                    {PLANNED_DURATIONS.map((mins) => (
                      <button key={mins} onClick={() => setNewPlannedMinutes(mins)}
                              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                                newPlannedMinutes === mins
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-stone-800/40 border border-stone-700/30 text-stone-400 hover:text-stone-200'
                              }`}>
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject Name (optional) */}
                <div>
                  <label className="text-sm font-medium text-stone-200 mb-2 block">Subject (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Anatomy, Pharmacology..."
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-stone-800/60 border border-stone-700/40 rounded-xl text-stone-200 placeholder-stone-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowStartModal(false)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-stone-800 text-stone-300 hover:text-stone-100 transition-all">
                    Cancel
                  </button>
                  <button onClick={handleStartSession}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white transition-all flex items-center justify-center gap-2">
                    <Play className="h-4 w-4" />
                    Start ({newPlannedMinutes}m)
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
