import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Target,
  Brain,
  Play,
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  History,
  Star,
  ChevronDown,
  Search,
  Filter,
  Zap,
  Trophy,
  LineChart,
  CheckCircle2,
  AlertTriangle,
  Timer,
  BarChart,
} from 'lucide-react';

import {
  MetricCard,
  QuestionCard,
  FeedbackScoreCard,
  ResponseReviewCard,
  TipCard,
  SessionHistoryCard,
  WeeklyGoalCard,
  StartSessionCard,
} from './InterviewCoachCards';

import {
  ScoreTrendChart,
  SkillRadarChart,
  CategoryPerformanceChart,
  CategoryTrendChart,
  InterviewTypePie,
  OverallScoreGauge,
  DurationScatterChart,
} from './InterviewCoachCharts';

import {
  generateMockQuestions,
  generateInterviewSession,
  generatePerformanceHistory,
  generateSkillRadar,
  generateCategoryPerformance,
  generateWeeklyGoal,
  generateInterviewTips,
} from './interviewCoachData';

import {
  INTERVIEW_TYPES,
  QUESTION_CATEGORIES,
  getScoreRubric,
  formatDuration,
} from './interviewCoachTypes';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'practice', label: 'Practice', icon: Play },
  { id: 'review', label: 'Review', icon: BookOpen },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'tips', label: 'Tips', icon: Lightbulb },
  { id: 'history', label: 'History', icon: History },
];

const FilterBar = ({ search, setSearch, typeFilter, setTypeFilter }) => (
  <div className="flex flex-wrap items-center gap-3 mb-6">
    <div className="relative flex-1 min-w-[200px] max-w-sm">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Search questions, categories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
      />
    </div>
    <div className="relative">
      <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
      >
        <option value="all">All Types</option>
        {Object.entries(INTERVIEW_TYPES).map(([key, val]) => (
          <option key={key} value={key}>{val.icon} {val.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

const OverviewTab = ({ session, history, skills, categories, goal }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard icon={Award} label="Total Sessions" value={history.length} subValue="This month" color="#6366f1" delay={0} />
      <MetricCard icon={Target} label="Avg Score" value={`${Math.round(history.reduce((s, h) => s + h.overallScore, 0) / history.length)}%`} trend="up" trendValue={8} color="#10b981" delay={0.05} />
      <MetricCard icon={Brain} label="Questions Done" value={history.reduce((s, h) => s + h.questionsAnswered, 0)} color="#8b5cf6" delay={0.1} />
      <MetricCard icon={Clock} label="Total Practice" value={`${Math.round(history.reduce((s, h) => s + h.avgDuration * h.questionsAnswered, 0) / 3600)}h`} color="#f59e0b" delay={0.15} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ScoreTrendChart data={history} />
      </div>
      <OverallScoreGauge score={session.overallScore} label="Latest Score" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkillRadarChart skills={skills} />
      <CategoryPerformanceChart categories={categories} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <WeeklyGoalCard goal={goal} delay={0} />
      <InterviewTypePie history={history} />
    </div>
  </div>
);

const PracticeTab = ({ questions, onStartSession }) => {
  const [expandedQ, setExpandedQ] = useState(null);
  const [selectedType, setSelectedType] = useState('all');

  const filtered = selectedType === 'all'
    ? questions
    : questions.filter(q => q.type === selectedType);

  return (
    <div className="space-y-6">
      <StartSessionCard onStart={onStartSession} delay={0} />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType('all')}
          className={`text-xs px-4 py-2 rounded-xl font-medium transition-all ${
            selectedType === 'all' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
          }`}
        >
          All
        </button>
        {Object.entries(INTERVIEW_TYPES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setSelectedType(key)}
            className={`text-xs px-4 py-2 rounded-xl font-medium transition-all ${
              selectedType === key ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {val.icon} {val.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            isExpanded={expandedQ === q.id}
            onToggle={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
            delay={i * 0.05}
          />
        ))}
      </div>
    </div>
  );
};

const ReviewTab = ({ session }) => {
  const [selectedResponse, setSelectedResponse] = useState(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-2">
        {Object.keys(FEEDBACK_CATEGORIES).map((cat) => {
          const avgScore = Math.round(
            session.responses.reduce((sum, r) => sum + r.feedbackScores[cat], 0) / session.responses.length
          );
          return <FeedbackScoreCard key={cat} category={cat} score={avgScore} delay={0} />;
        })}
      </div>

      <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={18} className="text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Overall Feedback</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{session.overallFeedback}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-500" /> Strengths
          </h3>
          <div className="flex flex-wrap gap-2">
            {session.strengths.map((s, i) => (
              <span key={i} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-amber-500" /> Areas to Improve
          </h3>
          <div className="flex flex-wrap gap-2">
            {session.improvements.map((imp, i) => (
              <span key={i} className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full font-medium">
                {imp}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Question-by-Question Review</h3>
        {session.responses.map((r, i) => (
          <ResponseReviewCard key={i} response={r} index={i} delay={i * 0.05} />
        ))}
      </div>
    </div>
  );
};

const AnalyticsTab = ({ history, categories, skills, session }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ScoreTrendChart data={history} />
      <SkillRadarChart skills={skills} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CategoryPerformanceChart categories={categories} />
      <DurationScatterChart responses={session.responses} />
    </div>
    <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Category Deep Dive</h3>
      <div className="space-y-3">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all"
          >
            <span className="text-lg">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</span>
                <span className={`text-xs font-semibold ${
                  cat.trend === 'improving' ? 'text-green-600 dark:text-green-400' : cat.trend === 'declining' ? 'text-red-600 dark:text-red-400' : 'text-gray-500'
                }`}>
                  {cat.trend === 'improving' ? '↑ Improving' : cat.trend === 'declining' ? '↓ Declining' : '→ Stable'}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${cat.avgScore}%` }} />
              </div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Avg: {cat.avgScore}%</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Best: {cat.bestScore}%</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Tried: {cat.questionsAttempted}q</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

const TipsTab = ({ tips }) => {
  const highPriority = tips.filter(t => t.priority === 'high');
  const otherTips = tips.filter(t => t.priority !== 'high');

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-5 border border-indigo-200 dark:border-indigo-800/30 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={18} className="text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">High Priority Tips</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Focus on these first for maximum improvement</p>
        <div className="space-y-3">
          {highPriority.map((tip, i) => (
            <TipCard key={tip.id} tip={tip} delay={i * 0.08} />
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Additional Tips</h3>
        <div className="space-y-3">
          {otherTips.map((tip, i) => (
            <TipCard key={tip.id} tip={tip} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </div>
  );
};

const HistoryTab = ({ history }) => (
  <div className="space-y-6">
    <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <History size={16} className="text-indigo-500" /> Practice History
        </h3>
        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded-full">{history.length} sessions</span>
      </div>
      <div className="space-y-3">
        {history.map((session, i) => (
          <SessionHistoryCard key={session.sessionId} session={session} delay={i * 0.05} />
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ScoreTrendChart data={history} />
      <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Session Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {Math.round(history.reduce((s, h) => s + h.overallScore, 0) / history.length)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Score</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-3xl font-black text-green-600 dark:text-green-400">
              {Math.max(...history.map(h => h.overallScore))}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Best Score</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {history.reduce((s, h) => s + h.questionsAnswered, 0)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Questions</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-3xl font-black text-purple-600 dark:text-purple-400">
              {formatDuration(Math.round(history.reduce((s, h) => s + h.avgDuration * h.questionsAnswered, 0) / history.length))}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Duration</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const InterviewCoachDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const session = useMemo(() => generateInterviewSession(), []);
  const history = useMemo(() => generatePerformanceHistory(14), []);
  const skills = useMemo(() => generateSkillRadar(), []);
  const categories = useMemo(() => generateCategoryPerformance(), []);
  const goal = useMemo(() => generateWeeklyGoal(), []);
  const tips = useMemo(() => generateInterviewTips(), []);
  const questions = useMemo(() => generateMockQuestions(20), []);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (typeFilter !== 'all' && q.type !== typeFilter) return false;
      if (search && !q.text.toLowerCase().includes(search.toLowerCase()) && !q.category.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [questions, typeFilter, search]);

  const handleStartSession = () => {
    setActiveTab('practice');
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab session={session} history={history} skills={skills} categories={categories} goal={goal} />;
      case 'practice':
        return <PracticeTab questions={filteredQuestions} onStartSession={handleStartSession} />;
      case 'review':
        return <ReviewTab session={session} />;
      case 'analytics':
        return <AnalyticsTab history={history} categories={categories} skills={skills} session={session} />;
      case 'tips':
        return <TipsTab tips={tips} />;
      case 'history':
        return <HistoryTab history={history} />;
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
                  <Brain size={22} />
                </div>
                AI Interview Coach
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-13">Practice mock interviews with AI-powered feedback and scoring</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Trophy size={16} className="text-amber-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Level 12</span>
              </div>
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

        {(activeTab === 'practice' || activeTab === 'tips') && (
          <FilterBar search={search} setSearch={setSearch} typeFilter={typeFilter} setTypeFilter={setTypeFilter} />
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

export default InterviewCoachDashboard;
