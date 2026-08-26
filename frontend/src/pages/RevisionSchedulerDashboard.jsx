import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Target,
  Brain,
  Calendar,
  Bell,
  Clock,
  Award,
  TrendingUp,
  BookOpen,
  ChevronDown,
  Search,
  Filter,
  Zap,
  Trophy,
  Sparkles,
  RefreshCw,
  Timer,
  Grid3X3,
  List,
} from 'lucide-react';

import {
  StatCard,
  FlashcardItem,
  ReviewScheduleCard,
  SubjectRetentionCard,
  ReminderCard,
  OptimalSlotCard,
  ForgettingCurveInfo,
  StreakCard,
} from './RevisionCards';

import {
  RetentionTrendChart,
  ForgettingCurveChart,
  SubjectRetentionBar,
  CardDistributionPie,
  ReviewsCompletedChart,
  SubjectRadarChart,
  DailyReviewHeatmap,
} from './RevisionCharts';

import {
  generateFlashcards,
  generateReviewSchedule,
  generateRetentionData,
  generateSubjectRetention,
  generateWeeklyStats,
  generateReminders,
  generateForgettingCurve,
  generateOptimalSchedule,
} from './revisionData';

import {
  SUBJECTS,
  REVIEW_TYPES,
  SPACED_REPETITION_LEVELS,
  formatDuration,
  formatDate,
} from './revisionTypes';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'flashcards', label: 'Flashcards', icon: Sparkles },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Bell },
];

const FilterBar = ({ search, setSearch, levelFilter, setLevelFilter }) => (
  <div className="flex flex-wrap items-center gap-3 mb-6">
    <div className="relative flex-1 min-w-[200px] max-w-sm">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Search flashcards, topics..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
      />
    </div>
    <div className="flex items-center gap-2">
      {Object.entries(SPACED_REPETITION_LEVELS).map(([key, val]) => (
        <button
          key={key}
          onClick={() => setLevelFilter(levelFilter === key ? 'all' : key)}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
            levelFilter === key
              ? 'text-white shadow-lg'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
          }`}
          style={levelFilter === key ? { backgroundColor: val.color } : {}}
        >
          {val.emoji} {val.label}
        </button>
      ))}
    </div>
  </div>
);

const OverviewTab = ({ flashcards, stats, retention, subjects, forgettingCurve, optimalSchedule }) => {
  const overdueCards = flashcards.filter(c => c.isOverdue).length;
  const dueToday = flashcards.filter(c => {
    const today = new Date().toISOString().split('T')[0];
    return c.nextReview <= today;
  }).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Brain} label="Cards Due" value={dueToday} subValue={`${overdueCards} overdue`} color="#6366f1" delay={0} />
        <StatCard icon={Target} label="Retention" value={`${stats.retentionRate}%`} trend="up" trendValue={5} color="#10b981" delay={0.05} />
        <StatCard icon={Clock} label="Study Time" value={`${stats.totalMinutes}m`} subValue={`${stats.avgSessionLength}m avg`} color="#f59e0b" delay={0.1} />
        <StatCard icon={Zap} label="Reviews" value={stats.reviewsCompleted} subValue={`${stats.avgAccuracy}% accuracy`} color="#8b5cf6" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RetentionTrendChart data={retention} />
        </div>
        <StreakCard streak={stats.streakDays} longest={stats.longestStreak} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ForgettingCurveChart data={forgettingCurve} />
        <CardDistributionPie data={retention} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ForgettingCurveInfo delay={0} />
        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-indigo-500" /> Today's Optimal Schedule
          </h3>
          <div className="space-y-2">
            {optimalSchedule.map((slot, i) => (
              <OptimalSlotCard key={slot.id} slot={slot} delay={i * 0.05} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const FlashcardsTab = ({ flashcards, search, levelFilter }) => {
  const [viewMode, setViewMode] = useState('grid');

  const filtered = useMemo(() => {
    return flashcards.filter(c => {
      if (levelFilter !== 'all' && c.level !== levelFilter) return false;
      if (search && !c.front.toLowerCase().includes(search.toLowerCase()) && !c.subjectName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [flashcards, search, levelFilter]);

  const dueCards = filtered.filter(c => c.isOverdue || c.nextReview <= new Date().toISOString().split('T')[0]);
  const newCards = filtered.filter(c => c.level === 'new');
  const learningCards = filtered.filter(c => c.level === 'learning' || c.level === 'young');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{filtered.length} Flashcards</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{dueCards.length} due today • {newCards.length} new • {learningCards.length} learning</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {dueCards.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-amber-200 dark:border-amber-800/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Due for Review ({dueCards.length})</h3>
          </div>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-2'}>
            {dueCards.slice(0, viewMode === 'grid' ? 6 : 8).map((card, i) => (
              <FlashcardItem key={card.id} card={card} delay={i * 0.05} />
            ))}
          </div>
        </div>
      )}

      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-2'}>
        {filtered.filter(c => !c.isOverdue && c.nextReview > new Date().toISOString().split('T')[0]).map((card, i) => (
          <FlashcardItem key={card.id} card={card} delay={i * 0.03} />
        ))}
      </div>
    </div>
  );
};

const ScheduleTab = ({ schedule }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [typeFilter, setTypeFilter] = useState('all');

  const uniqueDates = useMemo(() => {
    const dates = [...new Set(schedule.map(s => s.date))];
    return dates.slice(0, 14);
  }, [schedule]);

  const daySchedule = useMemo(() => {
    return schedule
      .filter(s => s.date === selectedDate)
      .filter(s => typeFilter === 'all' || s.reviewType === typeFilter)
      .sort((a, b) => a.hour - b.hour);
  }, [schedule, selectedDate, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {uniqueDates.map(date => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedDate === date
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {formatDate(date)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setTypeFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
            typeFilter === 'all' ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
          }`}
        >
          All
        </button>
        {Object.entries(REVIEW_TYPES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setTypeFilter(typeFilter === key ? 'all' : key)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
              typeFilter === key ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {val.icon} {val.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{formatDate(selectedDate)} — {daySchedule.length} reviews</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {daySchedule.length > 0 ? daySchedule.map((slot, i) => (
              <ReviewScheduleCard key={slot.id} slot={slot} delay={i * 0.03} />
            )) : (
              <p className="text-sm text-gray-400 text-center py-8">No reviews scheduled for this day</p>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <DailyReviewHeatmap schedule={schedule} />
          <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Daily Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{daySchedule.length}</p>
                <p className="text-xs text-gray-500">Total Reviews</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-2xl font-black text-green-600 dark:text-green-400">{daySchedule.filter(s => s.completed).length}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{formatDuration(daySchedule.reduce((s, r) => s + r.estimatedMinutes, 0))}</p>
                <p className="text-xs text-gray-500">Est. Time</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{daySchedule.filter(s => s.priority === 'urgent' || s.priority === 'high').length}</p>
                <p className="text-xs text-gray-500">High Priority</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SubjectsTab = ({ subjects }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SubjectRetentionBar subjects={subjects} />
      <SubjectRadarChart subjects={subjects} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {subjects.map((subject, i) => (
        <SubjectRetentionCard key={subject.id} subject={subject} delay={i * 0.05} />
      ))}
    </div>
  </div>
);

const SettingsTab = ({ reminders }) => {
  const [reminderList, setReminderList] = useState(reminders);

  const toggleReminder = (id) => {
    setReminderList(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} className="text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Reminders</h3>
        </div>
        <div className="space-y-2">
          {reminderList.map((reminder, i) => (
            <ReminderCard key={reminder.id} reminder={reminder} delay={i * 0.05} onToggle={toggleReminder} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <RefreshCw size={16} className="text-indigo-500" /> Review Algorithm
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-200 dark:border-indigo-800/30">
              <div className="flex items-center gap-2">
                <input type="radio" name="algo" defaultChecked className="text-indigo-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Anki-Style (SM-2)</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Modified SM-2 with ease factor — most effective for long-term retention</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <input type="radio" name="algo" className="text-indigo-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Leitner Box System</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">5-box progressive system — simple and visual</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <input type="radio" name="algo" className="text-indigo-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Simple Interval</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fixed doubling intervals — good for beginners</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target size={16} className="text-amber-500" /> Daily Targets
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">New cards per day</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">20</span>
              </div>
              <input type="range" min="5" max="50" defaultValue="20" className="w-full accent-indigo-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Reviews per day</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">100</span>
              </div>
              <input type="range" min="20" max="300" defaultValue="100" className="w-full accent-indigo-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Max daily study (minutes)</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">60</span>
              </div>
              <input type="range" min="15" max="180" defaultValue="60" className="w-full accent-indigo-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Learning steps (minutes)</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">1, 10</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Intervals for new cards before graduation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RevisionSchedulerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const flashcards = useMemo(() => generateFlashcards(60), []);
  const schedule = useMemo(() => generateReviewSchedule(14), []);
  const retention = useMemo(() => generateRetentionData(8), []);
  const subjects = useMemo(() => generateSubjectRetention(), []);
  const stats = useMemo(() => generateWeeklyStats(), []);
  const reminders = useMemo(() => generateReminders(8), []);
  const forgettingCurve = useMemo(() => generateForgettingCurve(), []);
  const optimalSchedule = useMemo(() => generateOptimalSchedule(), []);

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab flashcards={flashcards} stats={stats} retention={retention} subjects={subjects} forgettingCurve={forgettingCurve} optimalSchedule={optimalSchedule} />;
      case 'flashcards':
        return <FlashcardsTab flashcards={flashcards} search={search} levelFilter={levelFilter} />;
      case 'schedule':
        return <ScheduleTab schedule={schedule} />;
      case 'subjects':
        return <SubjectsTab subjects={subjects} />;
      case 'settings':
        return <SettingsTab reminders={reminders} />;
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
                  <RefreshCw size={22} />
                </div>
                Smart Revision Scheduler
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-13">Spaced repetition powered review system for optimal retention</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Sparkles size={16} className="text-amber-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">SM-2 Active</span>
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

        {activeTab === 'flashcards' && (
          <FilterBar search={search} setSearch={setSearch} levelFilter={levelFilter} setLevelFilter={setLevelFilter} />
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

export default RevisionSchedulerDashboard;
