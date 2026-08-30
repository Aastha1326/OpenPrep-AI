import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Award,
  Brain,
  Zap,
  Star,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Calendar,
  Users,
  BookOpen,
  BarChart3,
  Timer,
  Flag,
  User,
  Circle,
  CheckCircle,
} from 'lucide-react';
import {
  TASK_STATUS,
  PRIORITY_LEVELS,
  getStatusConfig,
  getPriorityConfig,
  formatDuration,
  formatDate,
} from './studyPlannerTypes';

const StatCard = ({ icon: Icon, label, value, subValue, trend, trendValue, color = '#6366f1', delay = 0 }) => {
  const isPositive = trend === 'up';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
            <Icon size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
          </div>
        </div>
        {trendValue !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trendValue)}%
          </div>
        )}
      </div>
      {subValue && <p className="text-xs text-gray-400 mt-2">{subValue}</p>}
    </motion.div>
  );
};

const TaskCard = ({ task, delay = 0, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const status = getStatusConfig(task.status);
  const priority = getPriorityConfig(task.priority);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="glass-card rounded-2xl border border-white/20 dark:border-white/5 overflow-hidden hover:shadow-lg transition-all"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => onStatusChange && onStatusChange(task.id)}
            className="mt-0.5 flex-shrink-0"
          >
            {task.status === 'completed' ? (
              <CheckCircle size={20} className="text-green-500" />
            ) : (
              <Circle size={20} className="text-gray-300 dark:text-gray-600 hover:text-indigo-500 transition-colors" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className={`text-sm font-semibold ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                {task.title}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.bgColor}`}>
                {status.icon} {status.label}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priority.bgColor}`}>
                {priority.label}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                {task.subjectIcon} {task.subjectName}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(task.dueDate)}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 justify-end">
              <Timer size={10} /> {formatDuration(task.estimatedMinutes)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <img src={task.assignee.avatar} alt={task.assignee.name} className="w-5 h-5 rounded-full" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{task.assignee.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {task.comments > 0 && <span className="flex items-center gap-1"><MessageSquare size={10} /> {task.comments}</span>}
            {task.subtasks > 0 && <span className="flex items-center gap-1"><CheckCircle2 size={10} /> {task.completedSubtasks}/{task.subtasks}</span>}
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {task.completedMinutes > 0 && task.status === 'in_progress' && (
          <div className="mt-2">
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((task.completedMinutes / task.estimatedMinutes) * 100, 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">{task.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.map((tag, i) => (
              <span key={i} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const ScheduleSlotCard = ({ slot, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.3 }}
    className={`rounded-xl p-3 border-l-4 transition-all hover:shadow-md ${
      slot.completed ? 'bg-green-50 dark:bg-green-900/10 border-green-400' : 'bg-white dark:bg-gray-800/50 border-indigo-400'
    }`}
  >
    <div className="flex items-start gap-2">
      <span className="text-lg">{slot.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${slot.completed ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
          {slot.subjectIcon} {slot.subjectName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{slot.label} • {slot.startTime} - {slot.endTime}</p>
        {slot.isGroup && slot.participants.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Users size={10} className="text-gray-400" />
            <div className="flex -space-x-1">
              {slot.participants.slice(0, 3).map(p => (
                <img key={p.id} src={p.avatar} alt={p.name} className="w-4 h-4 rounded-full border border-white dark:border-gray-800" />
              ))}
              {slot.participants.length > 3 && (
                <span className="text-[9px] bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-full px-1">+{slot.participants.length - 3}</span>
              )}
            </div>
          </div>
        )}
      </div>
      {slot.completed && <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />}
    </div>
  </motion.div>
);

const GoalProgressCard = ({ goal, delay = 0 }) => {
  const percent = Math.min((goal.current / goal.target) * 100, 100);
  const isComplete = goal.current >= goal.target;
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="glass-card rounded-2xl p-4 border border-white/20 dark:border-white/5"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{goal.label}</span>
        {isComplete && <CheckCircle2 size={16} className="text-green-500" />}
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-xl font-bold text-gray-900 dark:text-white">{goal.current}</span>
        <span className="text-sm text-gray-400 mb-0.5">/ {goal.target} {goal.unit}</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ delay: delay + 0.3, duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-indigo-500'}`}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">{percent.toFixed(0)}% complete</p>
    </motion.div>
  );
};

const TeamMemberCard = ({ member, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.2 }}
    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all"
  >
    <div className="relative">
      <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
        member.online ? 'bg-green-500' : 'bg-gray-400'
      }`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{member.name}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{member.role}</p>
    </div>
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
      member.online ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
    }`}>
      {member.online ? 'Online' : 'Offline'}
    </span>
  </motion.div>
);

const ActivityFeedItem = ({ activity, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.2 }}
    className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-all"
  >
    <img src={activity.user.avatar} alt={activity.user.name} className="w-8 h-8 rounded-full flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-900 dark:text-white">
        <span className="font-semibold">{activity.user.name}</span>{' '}
        <span className="text-gray-500 dark:text-gray-400">{activity.action}</span>
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{activity.subject} • {activity.timeLabel}</p>
    </div>
  </motion.div>
);

const DeadlineCard = ({ task, delay = 0 }) => {
  const status = getStatusConfig(task.status);
  const priority = getPriorityConfig(task.priority);
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2 }}
      className={`flex items-center gap-3 p-3 rounded-xl border-l-3 transition-all ${
        task.daysLeft <= 1 ? 'bg-red-50 dark:bg-red-900/10 border-l-red-500'
        : task.daysLeft <= 3 ? 'bg-amber-50 dark:bg-amber-900/10 border-l-amber-500'
        : 'bg-white dark:bg-gray-800/50 border-l-gray-300'
      }`}
    >
      <span className="text-lg">{task.subjectIcon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{task.subjectName} • {task.assignee.name}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <span className={`text-xs font-bold ${
          task.daysLeft <= 1 ? 'text-red-600 dark:text-red-400' : task.daysLeft <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'
        }`}>
          {task.daysLeft}d left
        </span>
        <span className={`block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priority.bgColor}`}>
          {priority.label}
        </span>
      </div>
    </motion.div>
  );
};

const KanbanColumn = ({ title, status, tasks, delay = 0 }) => {
  const config = getStatusConfig(status);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex-1 min-w-[260px]"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">{config.icon}</span>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{config.label}</h3>
        <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <div className="space-y-2 min-h-[200px]">
        {tasks.map((task, i) => (
          <TaskCard key={task.id} task={task} delay={i * 0.03} />
        ))}
        {tasks.length === 0 && (
          <div className="p-4 text-center text-xs text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            No tasks
          </div>
        )}
      </div>
    </motion.div>
  );
};

export {
  StatCard,
  TaskCard,
  ScheduleSlotCard,
  GoalProgressCard,
  TeamMemberCard,
  ActivityFeedItem,
  DeadlineCard,
  KanbanColumn,
};
