import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Coffee, Brain, Clock, Zap, TrendingUp, AlertTriangle, CheckCircle,
  Target, Activity, BarChart3, Lightbulb, ArrowRight, Timer, Flame,
  ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react';

const TASK_TYPES = [
  { value: 'reading', label: 'Reading', icon: '📖' },
  { value: 'flashcards', label: 'Flashcards', icon: '🃏' },
  { value: 'quiz', label: 'Quiz', icon: '❓' },
  { value: 'notes', label: 'Notes', icon: '📝' },
  { value: 'revision', label: 'Revision', icon: '🔄' },
  { value: 'practice', label: 'Practice', icon: '🎯' },
  { value: 'other', label: 'Other', icon: '📚' },
];

const PRIORITY_COLORS = {
  high: 'text-red-400 bg-red-900/30 border-red-700/50',
  medium: 'text-amber-400 bg-amber-900/30 border-amber-700/50',
  low: 'text-blue-400 bg-blue-900/30 border-blue-700/50',
  positive: 'text-emerald-400 bg-emerald-900/30 border-emerald-700/50',
  info: 'text-purple-400 bg-purple-900/30 border-purple-700/50',
};

const PRIORITY_ICONS = {
  high: AlertTriangle,
  medium: Clock,
  low: Coffee,
  positive: CheckCircle,
  info: Lightbulb,
};

function StatCard({ icon: Icon, label, value, color, subtext }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-stone-900/60 border border-stone-700/40 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="text-xs text-stone-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-stone-100">{value}</p>
      {subtext && <p className="text-[10px] text-stone-500 mt-0.5">{subtext}</p>}
    </motion.div>
  );
}

function InsightCard({ insight, index }) {
  const [expanded, setExpanded] = useState(false);
  const PriorityIcon = PRIORITY_ICONS[insight.priority] || Lightbulb;
  const colorClass = PRIORITY_COLORS[insight.priority] || PRIORITY_COLORS.info;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border p-4 ${colorClass} cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <PriorityIcon className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">{insight.message}</p>
            {expanded && insight.action && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-2 pt-2 border-t border-current/20"
              >
                <p className="text-xs opacity-80 flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" /> {insight.action}
                </p>
              </motion.div>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </div>
    </motion.div>
  );
}

function SubjectBar({ subject, maxGain }) {
  const width = maxGain > 0 ? (subject.avgFocusGain / maxGain) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-xs text-stone-300 w-24 truncate">{subject.name}</span>
      <div className="flex-1 h-3 bg-stone-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, width)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400"
        />
      </div>
      <span className="text-xs text-stone-400 w-16 text-right">+{subject.avgFocusGain}</span>
      <span className="text-[10px] text-stone-500 w-12 text-right">{subject.sessionCount}s</span>
    </div>
  );
}

function HourlyHeatmap({ data }) {
  if (!data || data.length === 0) return null;
  const maxGain = Math.max(...data.map((d) => d.avgFocusGain), 1);
  const hourMap = {};
  data.forEach((d) => { hourMap[d.hour] = d; });

  return (
    <div className="grid grid-cols-12 gap-1">
      {Array.from({ length: 24 }, (_, i) => {
        const d = hourMap[i];
        const intensity = d ? d.avgFocusGain / maxGain : 0;
        return (
          <div key={i} className="text-center">
            <div
              className="w-full aspect-square rounded-sm transition-all"
              style={{
                backgroundColor: d
                  ? `rgba(245, 158, 11, ${Math.max(0.1, intensity)})`
                  : 'rgba(68, 64, 60, 0.3)',
              }}
              title={`${i}:00 — ${d ? `+${d.avgFocusGain} gain, ${d.sessionCount} sessions` : 'No data'}`}
            />
            {i % 3 === 0 && <span className="text-[8px] text-stone-600">{i}</span>}
          </div>
        );
      })}
    </div>
  );
}

function TrendChart({ data }) {
  if (!data || data.length === 0) return null;
  const maxGain = Math.max(...data.map((d) => d.avgFocusGain), 1);
  const barHeight = 80;

  return (
    <div className="flex items-end gap-1" style={{ height: barHeight + 20 }}>
      {data.slice(-8).map((d, i) => {
        const h = (d.avgFocusGain / maxGain) * barHeight;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] text-stone-500">+{d.avgFocusGain}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: Math.max(2, h) }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="w-full rounded-t bg-gradient-to-t from-amber-700 to-amber-500"
            />
            <span className="text-[8px] text-stone-500">{d.week.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function BreakRecommendationDashboard() {
  const [recommendation, setRecommendation] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTaskType, setSelectedTaskType] = useState('reading');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, analyticsRes] = await Promise.allSettled([
        fetch('/api/break-recommendations/active', { credentials: 'include' }),
        fetch('/api/break-recommendations/analytics', { credentials: 'include' }),
      ]);
      if (recRes.status === 'fulfilled' && recRes.value.ok) {
        const data = await recRes.value.json();
        setRecommendation(data.data);
      }
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
        const data = await analyticsRes.value.json();
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Failed to load break recommendation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/break-recommendations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject: selectedSubject || undefined, taskType: selectedTaskType }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendation(data.data);
        await loadData();
      }
    } catch (err) {
      console.error('Failed to generate recommendation:', err);
    } finally {
      setGenerating(false);
    }
  };

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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'generate', label: 'Generate', icon: Zap },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-stone-950 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-stone-100 flex items-center gap-3">
            <Coffee className="h-7 w-7 text-amber-400" />
            Break Recommendation Engine
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Personalized study break schedules based on your cognitive patterns
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-stone-900/40 rounded-xl p-1 border border-stone-700/30 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ Overview Tab ═══ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Recommendation */}
            {recommendation ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-amber-900/20 to-stone-900/60 border border-amber-700/30 rounded-2xl p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-stone-100">Current Recommendation</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400 capitalize">
                    {recommendation.learningStyle}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-xl bg-stone-800/40">
                    <Timer className="h-6 w-6 text-amber-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-stone-100">{recommendation.pomodoroLength}m</p>
                    <p className="text-[10px] text-stone-500">Focus Duration</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-stone-800/40">
                    <Coffee className="h-6 w-6 text-blue-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-stone-100">{recommendation.shortBreakMinutes}m</p>
                    <p className="text-[10px] text-stone-500">Short Break</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-stone-800/40">
                    <Flame className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-stone-100">{recommendation.longBreakMinutes}m</p>
                    <p className="text-[10px] text-stone-500">Long Break</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-stone-800/40">
                    <Brain className="h-6 w-6 text-emerald-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-stone-100">{recommendation.peakPerformanceHour}:00</p>
                    <p className="text-[10px] text-stone-500">Peak Hour</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-700/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-400">Cognitive Load</span>
                      <span className="text-xs font-bold text-stone-200">{recommendation.cognitiveLoadScore}%</span>
                    </div>
                    <div className="h-1.5 bg-stone-700 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${recommendation.cognitiveLoadScore}%`,
                          backgroundColor: recommendation.cognitiveLoadScore > 70 ? '#ef4444' : recommendation.cognitiveLoadScore > 40 ? '#f59e0b' : '#22c55e',
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-700/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-400">Fatigue Index</span>
                      <span className="text-xs font-bold text-stone-200">{recommendation.fatigueIndex}%</span>
                    </div>
                    <div className="h-1.5 bg-stone-700 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${recommendation.fatigueIndex}%`,
                          backgroundColor: recommendation.fatigueIndex > 60 ? '#ef4444' : '#22c55e',
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-700/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-400">Compliance</span>
                      <span className="text-xs font-bold text-stone-200">{recommendation.breakCompliance ? '✓' : '—'}</span>
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1.5">
                      {recommendation.completedPomodoros} pomodoros completed
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-8 text-center"
              >
                <Coffee className="h-12 w-12 text-stone-600 mx-auto mb-3" />
                <p className="text-stone-400 mb-4">No recommendation yet. Generate your first personalized break schedule.</p>
                <button
                  onClick={() => setActiveTab('generate')}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-all"
                >
                  Generate Recommendation
                </button>
              </motion.div>
            )}

            {/* Stats Grid */}
            {analytics && analytics.totalSessions > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Target} label="Total Sessions" value={analytics.totalSessions} color="#f59e0b" />
                <StatCard icon={CheckCircle} label="Break Compliance" value={`${analytics.avgCompliance}%`} color="#22c55e" subtext={`${analytics.compliantCount} compliant`} />
                <StatCard icon={TrendingUp} label="Avg Focus Gain" value={`+${analytics.avgFocusGain}`} color="#8b5cf6" subtext="per break" />
                <StatCard icon={Brain} label="Optimal Pomodoro" value={`${analytics.optimalPomodoro}m`} color="#3b82f6" subtext={`${analytics.optimalBreak}m break`} />
              </div>
            )}

            {/* Subject Insights */}
            {analytics && analytics.subjectInsights && analytics.subjectInsights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5"
              >
                <h3 className="text-sm font-semibold text-stone-200 mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-400" /> Subject Breakdown
                </h3>
                {analytics.subjectInsights.slice(0, 6).map((s, i) => (
                  <SubjectBar key={i} subject={s} maxGain={Math.max(...analytics.subjectInsights.map((x) => x.avgFocusGain), 1)} />
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* ═══ Generate Tab ═══ */}
        {activeTab === 'generate' && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6 space-y-5"
            >
              <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" /> Generate New Recommendation
              </h3>
              <p className="text-sm text-stone-400">
                Our engine analyzes your recent focus patterns, cognitive load, and fatigue levels
                to create an optimized break schedule tailored to you.
              </p>

              {/* Task Type */}
              <div>
                <label className="text-sm font-medium text-stone-200 mb-2 block">Task Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {TASK_TYPES.map((tt) => (
                    <button
                      key={tt.value}
                      onClick={() => setSelectedTaskType(tt.value)}
                      className={`p-3 rounded-xl text-center transition-all border ${
                        selectedTaskType === tt.value
                          ? 'border-amber-500 bg-stone-800/80 text-stone-100'
                          : 'border-stone-700/30 bg-stone-800/40 text-stone-400 hover:border-stone-600/50'
                      }`}
                    >
                      <span className="text-lg block mb-1">{tt.icon}</span>
                      <span className="text-[10px]">{tt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-sm font-medium text-stone-200 mb-2 block">Subject (optional)</label>
                <input
                  type="text"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  placeholder="e.g., Anatomy, Pharmacology..."
                  className="w-full px-3 py-2 text-sm bg-stone-800/60 border border-stone-700/40 rounded-xl text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3 rounded-xl text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Analyzing patterns...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" /> Generate Recommendation
                  </>
                )}
              </button>
            </motion.div>

            {/* How It Works */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6"
            >
              <h3 className="text-sm font-semibold text-stone-200 mb-4">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Brain, title: 'Cognitive Analysis', desc: 'Analyzes your focus session efficiency, interruption patterns, and time-of-day performance.' },
                  { icon: Activity, title: 'Fatigue Modeling', desc: 'Tracks cumulative fatigue from study duration and adjusts break frequency accordingly.' },
                  { icon: Target, title: 'Personalized Scheduling', desc: 'Compares your best-performing sessions to compute your optimal pomodoro/break ratio.' },
                ].map((step, i) => (
                  <div key={i} className="p-4 rounded-xl bg-stone-800/40 border border-stone-700/20">
                    <step.icon className="h-6 w-6 text-amber-400 mb-2" />
                    <p className="text-sm font-medium text-stone-200 mb-1">{step.title}</p>
                    <p className="text-xs text-stone-500">{step.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* ═══ Insights Tab ═══ */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {analytics && analytics.recommendations && analytics.recommendations.length > 0 ? (
              analytics.recommendations.map((insight, i) => (
                <InsightCard key={i} insight={insight} index={i} />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-stone-500"
              >
                <Lightbulb className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Complete more focus sessions to unlock personalized insights.</p>
              </motion.div>
            )}

            {/* Learning Style Distribution */}
            {analytics && analytics.learningStyleDistribution && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5"
              >
                <h3 className="text-sm font-semibold text-stone-200 mb-4">Learning Style Distribution</h3>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(analytics.learningStyleDistribution).map(([style, count]) => (
                    <div key={style} className="text-center p-3 rounded-xl bg-stone-800/40 border border-stone-700/20">
                      <p className="text-2xl font-bold text-stone-100">{count}</p>
                      <p className="text-xs text-stone-400 capitalize">{style}</p>
                      <p className="text-[10px] text-stone-500">
                        {style === 'sprint' ? '<20min sessions' : style === 'marathon' ? '>40min sessions' : '20-40min sessions'}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ═══ Trends Tab ═══ */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Focus Gain Trend */}
            {analytics && analytics.trendData && analytics.trendData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5"
              >
                <h3 className="text-sm font-semibold text-stone-200 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-400" /> Weekly Focus Gain Trend
                </h3>
                <TrendChart data={analytics.trendData} />
              </motion.div>
            )}

            {/* Hourly Performance */}
            {analytics && analytics.hourlyPerformance && analytics.hourlyPerformance.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5"
              >
                <h3 className="text-sm font-semibold text-stone-200 mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" /> Hourly Performance Heatmap
                </h3>
                <HourlyHeatmap data={analytics.hourlyPerformance} />
                <div className="mt-3 flex items-center justify-between text-[10px] text-stone-500">
                  <span>Darker = Higher focus gain after breaks</span>
                  <span>{analytics.hourlyPerformance.length} hours with data</span>
                </div>
              </motion.div>
            )}

            {/* Weekly Compliance Trend */}
            {analytics && analytics.trendData && analytics.trendData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5"
              >
                <h3 className="text-sm font-semibold text-stone-200 mb-4">Weekly Compliance Rate</h3>
                <div className="space-y-2">
                  {analytics.trendData.slice(-8).map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[10px] text-stone-500 w-16">{d.week.slice(5)}</span>
                      <div className="flex-1 h-3 bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${d.complianceRate}%`,
                            backgroundColor: d.complianceRate > 80 ? '#22c55e' : d.complianceRate > 50 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                      <span className="text-xs text-stone-300 w-10 text-right">{d.complianceRate}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
