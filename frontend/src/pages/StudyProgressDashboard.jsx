import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Target,
  Flame,
  BookOpen,
  Brain,
  Award,
  Clock,
  Users,
  Activity,
  Calendar,
  ChevronDown,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Zap,
  Trophy,
  Star,
  LineChart,
  PieChart,
  Grid3X3,
  List,
} from 'lucide-react';

import {
  StatCard,
  SubjectProgressCard,
  MilestoneCard,
  GoalProgressCard,
  StreakDisplay,
  ActivityLogItem,
  LeaderboardRow,
  PredictionCard,
  PeerComparisonRow,
} from './ProgressCards';

import {
  StudyTimeAreaChart,
  AccuracyTrendChart,
  SubjectBreakdownPie,
  WeeklyBarChart,
  SubjectRadarChart,
  ActivityMixPie,
  DayOfWeekBarChart,
  MilestonesTimelineChart,
  LeaderboardChart,
  OverallScoreGauge,
} from './ProgressCharts';

import {
  generateDailyStudyData,
  generateWeeklySummary,
  generateSubjectProgress,
  generateMilestones,
  generateActivityLog,
  generateLeaderboard,
  generateHeatmapData,
  generateGoalProgress,
  generatePerformancePrediction,
  generatePeerComparison,
  generateOverallStats,
} from './progressData';

import {
  WEEKDAY_LABELS,
  formatDuration,
  formatPercent,
} from './progressTypes';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'predictions', label: 'Predictions', icon: Brain },
  { id: 'goals', label: 'Goals', icon: Target },
];

const ViewToggle = ({ view, setView }) => (
  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
    <button
      onClick={() => setView('grid')}
      className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
    >
      <Grid3X3 size={16} />
    </button>
    <button
      onClick={() => setView('list')}
      className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
    >
      <List size={16} />
    </button>
  </div>
);

const FilterBar = ({ search, setSearch, filter, setFilter, subjects }) => (
  <div className="flex flex-wrap items-center gap-3 mb-6">
    <div className="relative flex-1 min-w-[200px] max-w-sm">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Search subjects, activities..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
      />
    </div>
    <div className="relative">
      <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
      >
        <option value="all">All Subjects</option>
        {subjects.map(s => (
          <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

const OverviewTab = ({ dailyData, weeklyData, subjects, stats, leaderboard, milestones }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard icon={Clock} label="Total Hours" value={`${stats.totalStudyHours}h`} trend="up" trendValue={stats.weeklyChange.hours} color="#6366f1" delay={0} />
      <StatCard icon={Brain} label="Quizzes Done" value={stats.totalQuizzes.toLocaleString()} trend="up" trendValue={stats.weeklyChange.quizzes} color="#8b5cf6" delay={0.05} />
      <StatCard icon={Target} label="Accuracy" value={`${stats.overallAccuracy}%`} trend={stats.weeklyChange.accuracy >= 0 ? 'up' : 'down'} trendValue={stats.weeklyChange.accuracy} color="#10b981" delay={0.1} />
      <StatCard icon={Flame} label="Current Streak" value={`${stats.currentStreak} days`} subValue={`Longest: ${stats.longestStreak}`} color="#f59e0b" delay={0.15} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <StudyTimeAreaChart data={dailyData} />
      </div>
      <StreakDisplay streak={stats.currentStreak} longest={stats.longestStreak} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AccuracyTrendChart data={dailyData} />
      <SubjectBreakdownPie subjects={subjects} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <WeeklyBarChart data={weeklyData} />
      <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Milestones</h3>
          <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full font-medium">{milestones.length} total</span>
        </div>
        <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
          {milestones.slice(0, 10).map((m, i) => (
            <MilestoneCard key={m.id} milestone={m} delay={i * 0.05} />
          ))}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <OverallScoreGauge score={stats.overallAccuracy} label="Exam Readiness" />
      <PeerComparisonRow peer={{ subject: 'Overall Performance', icon: '📊', yourScore: stats.overallAccuracy, avgScore: 65, topScore: 95, percentile: 72 }} delay={0} />
    </div>
  </div>
);

const SubjectsTab = ({ subjects, search, filter }) => {
  const filtered = useMemo(() => {
    return subjects.filter(s => {
      if (filter !== 'all' && s.id !== filter) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [subjects, search, filter]);

  return (
    <div className="space-y-6">
      <SubjectRadarChart subjects={subjects} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((subject, i) => (
          <SubjectProgressCard key={subject.id} subject={subject} delay={i * 0.05} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Hours by Subject</h3>
          <div className="space-y-3">
            {subjects.sort((a, b) => b.totalHours - a.totalHours).map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-sm w-6 text-center">{s.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{s.name}</span>
                    <span className="text-xs font-bold" style={{ color: s.color }}>{s.totalHours}h</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(s.totalHours / 120) * 100}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <MilestonesTimelineChart milestones={[]} />
      </div>
    </div>
  );
};

const ActivityTab = ({ activityLog, dailyData }) => {
  const [typeFilter, setTypeFilter] = useState('all');
  const types = [...new Set(activityLog.map(a => a.type))];
  const filtered = typeFilter === 'all' ? activityLog : activityLog.filter(a => a.type === typeFilter);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityMixPie data={activityLog} />
        <DayOfWeekBarChart data={dailyData} />
      </div>

      <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Activity Log</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                typeFilter === 'all' ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              All
            </button>
            {types.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-all capitalize ${
                  typeFilter === t ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
          {filtered.slice(0, 40).map((a, i) => (
            <ActivityLogItem key={a.id} activity={a} delay={i * 0.02} />
          ))}
        </div>
      </div>
    </div>
  );
};

const LeaderboardTab = ({ leaderboard }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" /> Leaderboard
          </h3>
          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded-full">{leaderboard.length} users</span>
        </div>
        <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
          {leaderboard.map((entry, i) => (
            <LeaderboardRow key={entry.rank} entry={entry} delay={i * 0.03} />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <LeaderboardChart leaderboard={leaderboard} />
        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Your Stats vs Top 5</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">#12</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your Rank</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-2xl font-black text-green-600 dark:text-green-400">78%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your Accuracy</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">12,450</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your Points</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400">23🔥</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your Streak</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PredictionsTab = ({ predictions, peerComparison }) => (
  <div className="space-y-6">
    <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={18} className="text-purple-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Performance Predictions</h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Based on your current progress and study patterns, here are predicted scores for upcoming exams.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {predictions.map((p, i) => (
          <PredictionCard key={p.subjectId} prediction={p} delay={i * 0.08} />
        ))}
      </div>
    </div>

    <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-blue-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Peer Comparison</h3>
      </div>
      <div className="space-y-1">
        {peerComparison.map((p, i) => (
          <PeerComparisonRow key={p.subjectId} peer={p} delay={i * 0.05} />
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><div className="w-3 h-1.5 bg-indigo-500 rounded-full" /> Your score</span>
        <span className="flex items-center gap-1"><div className="w-3 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full" /> Average</span>
      </div>
    </div>
  </div>
);

const GoalsTab = ({ goals, milestones, realMilestones, milestoneFilter, setMilestoneFilter, onClaimMilestone, claimingId }) => {
  const completedGoals = goals.filter(g => g.current >= g.target).length;
  
  const displayMilestones = realMilestones && realMilestones.length > 0 ? realMilestones : milestones;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {goals.map((g, i) => (
          <GoalProgressCard key={g.id} goal={g} delay={i * 0.08} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Goal Summary</h3>
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full font-medium">
              {completedGoals}/{goals.length} achieved
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <p className="text-3xl font-black text-green-600 dark:text-green-400">{completedGoals}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{goals.length - completedGoals}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">In Progress</p>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {Math.round(goals.reduce((sum, g) => sum + (g.current / g.target) * 100, 0) / goals.length)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Progress</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Milestones
            </h3>
            <select
              value={milestoneFilter}
              onChange={(e) => setMilestoneFilter(e.target.value)}
              className="text-xs bg-gray-100 dark:bg-gray-800 border-none rounded px-2 py-1 outline-none text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="space-y-1 max-h-[250px] overflow-y-auto pr-1">
            {displayMilestones.map((m, i) => (
              <MilestoneCard key={m.id} milestone={m} delay={i * 0.03} onClaim={onClaimMilestone} claimingId={claimingId} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import { useEffect } from 'react';

const StudyProgressDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('grid');
  
  const [realMilestones, setRealMilestones] = useState([]);
  const [milestoneFilter, setMilestoneFilter] = useState('all');
  const [claimingId, setClaimingId] = useState(null);

  const dailyData = useMemo(() => generateDailyStudyData(90), []);
  const weeklyData = useMemo(() => generateWeeklySummary(12), []);
  const subjects = useMemo(() => generateSubjectProgress(), []);
  const milestones = useMemo(() => generateMilestones(30), []);
  const activityLog = useMemo(() => generateActivityLog(80), []);
  const leaderboard = useMemo(() => generateLeaderboard(20), []);
  const goals = useMemo(() => generateGoalProgress(), []);
  const predictions = useMemo(() => generatePerformancePrediction(), []);
  const peerComparison = useMemo(() => generatePeerComparison(), []);
  const stats = useMemo(() => generateOverallStats(), []);

  useEffect(() => {
    let isMounted = true;
    const fetchMilestones = async () => {
      try {
        const { default: API } = await import('../../services/api');
        const statusParam = milestoneFilter === 'all' ? undefined : milestoneFilter;
        const res = await API.get('/milestones', { params: { status: statusParam } });
        if (isMounted && res.data.success) {
          setRealMilestones(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch milestones', err);
      }
    };
    fetchMilestones();
    return () => { isMounted = false; };
  }, [milestoneFilter]);

  const handleClaimMilestone = async (id) => {
    try {
      setClaimingId(id);
      const { default: API } = await import('../../services/api');
      const res = await API.put(`/milestones/${id}/claim`);
      if (res.data.success) {
        // Refresh milestones
        const statusParam = milestoneFilter === 'all' ? undefined : milestoneFilter;
        const fetchRes = await API.get('/milestones', { params: { status: statusParam } });
        if (fetchRes.data.success) {
          setRealMilestones(fetchRes.data.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClaimingId(null);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab dailyData={dailyData} weeklyData={weeklyData} subjects={subjects} stats={stats} leaderboard={leaderboard} milestones={realMilestones.length ? realMilestones : milestones} />;
      case 'subjects':
        return <SubjectsTab subjects={subjects} search={search} filter={filter} />;
      case 'activity':
        return <ActivityTab activityLog={activityLog} dailyData={dailyData} />;
      case 'leaderboard':
        return <LeaderboardTab leaderboard={leaderboard} />;
      case 'predictions':
        return <PredictionsTab predictions={predictions} peerComparison={peerComparison} />;
      case 'goals':
        return <GoalsTab 
                  goals={goals} 
                  milestones={milestones} 
                  realMilestones={realMilestones}
                  milestoneFilter={milestoneFilter}
                  setMilestoneFilter={setMilestoneFilter}
                  onClaimMilestone={handleClaimMilestone}
                  claimingId={claimingId}
               />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                  <LineChart size={22} />
                </div>
                Study Progress
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-13">Track your learning journey and performance analytics</p>
            </div>
            <div className="flex items-center gap-3">
              <ViewToggle view={view} setView={setView} />
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all">
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 -mx-2 px-2"
        >
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {activeTab !== 'overview' && (
          <FilterBar search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} subjects={subjects} />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudyProgressDashboard;
