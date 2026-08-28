import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Target,
  Brain,
  Calendar,
  Users,
  Clock,
  Award,
  TrendingUp,
  BookOpen,
  ChevronDown,
  Search,
  Filter,
  Zap,
  Trophy,
  Plus,
  LayoutGrid,
  List,
  CalendarDays,
  Kanban,
} from 'lucide-react';

import {
  StatCard,
  TaskCard,
  ScheduleSlotCard,
  GoalProgressCard,
  TeamMemberCard,
  ActivityFeedItem,
  DeadlineCard,
  KanbanColumn,
} from './StudyPlannerCards';

import {
  WeeklyProgressChart,
  SubjectPieChart,
  BurndownChart,
  ProductivityChart,
  SessionTypeBarChart,
  TaskCompletionChart,
  DailyHeatmapChart,
} from './StudyPlannerCharts';


import {
  generateTasks,
  generateSchedule,
  generateWeeklyProgress,
  generateSubjectDistribution,
  generateTeamActivity,
  generateGoalProgress,
  generateTeamStats,
  generateBurndownData,
  generateUpcomingDeadlines,
  TEAM_MEMBERS,
} from './studyPlannerData';

import {
  TASK_STATUS,
  SESSION_TYPES,
  WEEKDAY_LABELS,
  formatDuration,
  formatDate,
} from './studyPlannerTypes';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
];

const CheckCircle2Icon = CheckCircle2;

const FilterBar = ({ search, setSearch, statusFilter, setStatusFilter, priorityFilter, setPriorityFilter }) => (
  <div className="flex flex-wrap items-center gap-3 mb-6">
    <div className="relative flex-1 min-w-[200px] max-w-sm">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Search tasks, topics..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
      />
    </div>
    <div className="relative">
      <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
      >
        <option value="all">All Status</option>
        {Object.entries(TASK_STATUS).map(([key, val]) => (
          <option key={key} value={key}>{val.icon} {val.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

const DashboardTab = ({ tasks, schedule, weeklyProgress, subjects, goals, deadlines, teamStats }) => {
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle2Icon} label="Tasks Done" value={completedTasks} subValue={`${tasks.length} total`} trend="up" trendValue={12} color="#10b981" delay={0} />
        <StatCard icon={Clock} label="Study Hours" value={`${teamStats.weeklyHours}h`} trend={teamStats.weeklyChange >= 0 ? 'up' : 'down'} trendValue={teamStats.weeklyChange} color="#6366f1" delay={0.05} />
        <StatCard icon={Users} label="Team Online" value={`${teamStats.onlineMembers}/${teamStats.totalMembers}`} color="#8b5cf6" delay={0.1} />
        <StatCard icon={Target} label="Avg Productivity" value={`${teamStats.avgProductivity}%`} trend="up" trendValue={5} color="#f59e0b" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyProgressChart data={weeklyProgress} />
        <SubjectPieChart subjects={subjects} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BurndownChart data={useMemo(() => generateBurndownData(14), [])} />
        </div>
        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-indigo-500" /> Today's Schedule
          </h3>
          <div className="space-y-2">
            {schedule.slice(0, 5).map((slot, i) => (
              <ScheduleSlotCard key={slot.id} slot={slot} delay={i * 0.05} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Target size={16} className="text-amber-500" /> Upcoming Deadlines
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {deadlines.map((task, i) => (
              <DeadlineCard key={task.id} task={task} delay={i * 0.05} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {goals.slice(0, 4).map((g, i) => (
              <GoalProgressCard key={g.id} goal={g} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};



const TasksTab = ({ tasks, search, statusFilter }) => {
  const [viewMode, setViewMode] = useState('kanban');

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.subjectName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, statusFilter, search]);

  const handleStatusChange = (taskId) => {
    // Placeholder for status change logic
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{filteredTasks.length} Tasks</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
          >
            <Kanban size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.keys(TASK_STATUS).map((status, i) => (
            <KanbanColumn
              key={status}
              title={TASK_STATUS[status].label}
              status={status}
              tasks={filteredTasks.filter(t => t.status === status)}
              delay={i * 0.1}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task, i) => (
            <TaskCard key={task.id} task={task} delay={i * 0.03} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
};

const ScheduleTab = ({ schedule }) => {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);

  const daySlots = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1 + selectedDay);
    const dateStr = startOfWeek.toISOString().split('T')[0];
    return schedule.filter(s => s.date === dateStr).sort((a, b) => a.startHour - b.startHour);
  }, [schedule, selectedDay]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {WEEKDAY_LABELS.map((day, i) => (
          <button
            key={day}
            onClick={() => setSelectedDay(i)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              selectedDay === i
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{WEEKDAY_LABELS[selectedDay]}'s Schedule</h3>
          <div className="space-y-3">
            {daySlots.length > 0 ? daySlots.map((slot, i) => (
              <ScheduleSlotCard key={slot.id} slot={slot} delay={i * 0.05} />
            )) : (
              <p className="text-sm text-gray-400 text-center py-8">No sessions scheduled for this day</p>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <SessionTypeBarChart data={schedule} />
          <DailyHeatmapChart schedule={schedule} />
        </div>
      </div>
    </div>
  );
};

const TeamTab = ({ teamStats }) => {
  const [activity] = useState(() => generateTeamActivity(25));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Members" value={teamStats.totalMembers} color="#6366f1" delay={0} />
        <StatCard icon={Zap} label="Online Now" value={teamStats.onlineMembers} color="#10b981" delay={0.05} />
        <StatCard icon={Target} label="Team Tasks" value={teamStats.totalTasks} subValue={`${teamStats.completedTasks} completed`} color="#8b5cf6" delay={0.1} />
        <StatCard icon={TrendingUp} label="Team Productivity" value={`${teamStats.avgProductivity}%`} color="#f59e0b" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={16} className="text-indigo-500" /> Team Members
          </h3>
          <div className="space-y-1">
            {TEAM_MEMBERS.map((member, i) => (
              <TeamMemberCard key={member.id} member={member} delay={i * 0.05} />
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap size={16} className="text-amber-500" /> Recent Activity
          </h3>
          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
            {activity.map((a, i) => (
              <ActivityFeedItem key={a.id} activity={a} delay={i * 0.03} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticsTab = ({ weeklyProgress, subjects, tasks, schedule }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <WeeklyProgressChart data={weeklyProgress} />
      <ProductivityChart data={weeklyProgress} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SubjectPieChart subjects={subjects} />
      <TaskCompletionChart tasks={tasks} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SessionTypeBarChart data={schedule} />
      <DailyHeatmapChart schedule={schedule} />
    </div>
  </div>
);

const StudyPlannerDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const tasks = useMemo(() => generateTasks(30), []);
  const schedule = useMemo(() => generateSchedule(2), []);
  const weeklyProgress = useMemo(() => generateWeeklyProgress(12), []);
  const subjects = useMemo(() => generateSubjectDistribution(), []);
  const goals = useMemo(() => generateGoalProgress(), []);
  const teamStats = useMemo(() => generateTeamStats(), []);
  const deadlines = useMemo(() => generateUpcomingDeadlines(tasks), [tasks]);

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab tasks={tasks} schedule={schedule} weeklyProgress={weeklyProgress} subjects={subjects} goals={goals} deadlines={deadlines} teamStats={teamStats} />;
      case 'tasks':
        return <TasksTab tasks={tasks} search={search} statusFilter={statusFilter} />;
      case 'schedule':
        return <ScheduleTab schedule={schedule} />;
      case 'team':
        return <TeamTab teamStats={teamStats} />;
      case 'analytics':
        return <AnalyticsTab weeklyProgress={weeklyProgress} subjects={subjects} tasks={tasks} schedule={schedule} />;
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
                  <CalendarDays size={22} />
                </div>
                Study Planner
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-13">Plan, track, and collaborate on your study journey</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all">
              <Plus size={16} />
              New Task
            </button>
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

        {activeTab === 'tasks' && (
          <FilterBar
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
          />
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

export default StudyPlannerDashboard;
