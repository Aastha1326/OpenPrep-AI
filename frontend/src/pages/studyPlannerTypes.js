export const TASK_STATUS = {
  todo: { label: 'To Do', color: '#9ca3af', bgColor: 'bg-gray-100 text-gray-700', icon: '📋' },
  in_progress: { label: 'In Progress', color: '#3b82f6', bgColor: 'bg-blue-100 text-blue-700', icon: '🔄' },
  review: { label: 'Review', color: '#f59e0b', bgColor: 'bg-amber-100 text-amber-700', icon: '🔍' },
  completed: { label: 'Completed', color: '#22c55e', bgColor: 'bg-green-100 text-green-700', icon: '✅' },
  blocked: { label: 'Blocked', color: '#ef4444', bgColor: 'bg-red-100 text-red-700', icon: '🚫' },
};

export const PRIORITY_LEVELS = {
  low: { label: 'Low', color: '#9ca3af', bgColor: 'bg-gray-100 text-gray-600', score: 1 },
  medium: { label: 'Medium', color: '#f59e0b', bgColor: 'bg-amber-100 text-amber-600', score: 2 },
  high: { label: 'High', color: '#ef4444', bgColor: 'bg-red-100 text-red-600', score: 3 },
  urgent: { label: 'Urgent', color: '#dc2626', bgColor: 'bg-red-200 text-red-800', score: 4 },
};

export const SUBJECTS = [
  { id: 'dsa', name: 'Data Structures & Algorithms', icon: '🧮', color: '#6366f1' },
  { id: 'system_design', name: 'System Design', icon: '🏗️', color: '#8b5cf6' },
  { id: 'os', name: 'Operating Systems', icon: '💻', color: '#ec4899' },
  { id: 'dbms', name: 'Database Management', icon: '🗄️', color: '#f59e0b' },
  { id: 'cn', name: 'Computer Networks', icon: '🌐', color: '#10b981' },
  { id: 'ml', name: 'Machine Learning', icon: '🤖', color: '#3b82f6' },
  { id: 'web_dev', name: 'Web Development', icon: '🌍', color: '#ef4444' },
  { id: 'aptitude', name: 'Aptitude & Reasoning', icon: '🧠', color: '#06b6d4' },
];

export const SESSION_TYPES = {
  solo: { label: 'Solo Study', icon: '👤', color: '#6366f1' },
  group: { label: 'Group Session', icon: '👥', color: '#8b5cf6' },
  peer_teaching: { label: 'Peer Teaching', icon: '🎓', color: '#10b981' },
  quiz: { label: 'Quiz Session', icon: '📝', color: '#f59e0b' },
  revision: { label: 'Revision', icon: '📖', color: '#ec4899' },
  practice: { label: 'Practice Problems', icon: '⌨️', color: '#3b82f6' },
};

export const SCHEDULE_VIEWS = {
  day: { label: 'Day', icon: '📅' },
  week: { label: 'Week', icon: '📆' },
  month: { label: 'Month', icon: '🗓️' },
};

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

export const GOAL_TYPES = {
  daily: { label: 'Daily', target: 3, unit: 'hours' },
  weekly: { label: 'Weekly', target: 20, unit: 'hours' },
  monthly: { label: 'Monthly', target: 80, unit: 'hours' },
  tasks: { label: 'Task Completion', target: 30, unit: 'tasks' },
  streak: { label: 'Study Streak', target: 30, unit: 'days' },
};

export const TEAM_ROLES = {
  owner: { label: 'Owner', color: '#6366f1', permissions: ['edit', 'delete', 'assign', 'manage'] },
  admin: { label: 'Admin', color: '#8b5cf6', permissions: ['edit', 'assign'] },
  member: { label: 'Member', color: '#10b981', permissions: ['edit_own', 'comment'] },
  viewer: { label: 'Viewer', color: '#9ca3af', permissions: ['view', 'comment'] },
};

export const formatTime = (hours, minutes) => {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
};

export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatFullDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

export const getStatusConfig = (status) => TASK_STATUS[status] || TASK_STATUS.todo;
export const getPriorityConfig = (priority) => PRIORITY_LEVELS[priority] || PRIORITY_LEVELS.medium;
export const getSubjectById = (id) => SUBJECTS.find(s => s.id === id) || SUBJECTS[0];
