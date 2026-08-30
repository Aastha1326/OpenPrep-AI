export const SPACED_REPETITION_LEVELS = {
  new: { label: 'New', color: '#6366f1', interval: 0, emoji: '🆕', description: 'Never reviewed' },
  learning: { label: 'Learning', color: '#3b82f6', interval: 1, emoji: '📖', description: '1 day interval' },
  young: { label: 'Young', color: '#10b981', interval: 3, emoji: '🌱', description: '3 day interval' },
  mature: { label: 'Mature', color: '#f59e0b', interval: 7, emoji: '🌳', description: '7 day interval' },
  established: { label: 'Established', color: '#8b5cf6', interval: 14, emoji: '🏔️', description: '14 day interval' },
  mastered: { label: 'Mastered', color: '#22c55e', interval: 30, emoji: '🏆', description: '30 day interval' },
};

export const REVIEW_TYPES = {
  flashcard: { label: 'Flashcard', icon: '🃏', color: '#6366f1', estimatedMinutes: 5 },
  quiz: { label: 'Quiz', icon: '📝', color: '#8b5cf6', estimatedMinutes: 10 },
  practice: { label: 'Practice Problem', icon: '⌨️', color: '#10b981', estimatedMinutes: 20 },
  notes_review: { label: 'Notes Review', icon: '📒', color: '#f59e0b', estimatedMinutes: 8 },
  video: { label: 'Video Recap', icon: '🎬', color: '#ec4899', estimatedMinutes: 15 },
  mindmap: { label: 'Mind Map', icon: '🗺️', color: '#3b82f6', estimatedMinutes: 12 },
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

export const REMINDER_TYPES = {
  push: { label: 'Push Notification', icon: '🔔', color: '#6366f1' },
  email: { label: 'Email', icon: '📧', color: '#10b981' },
  in_app: { label: 'In-App', icon: '📱', color: '#f59e0b' },
  sms: { label: 'SMS', icon: '💬', color: '#ec4899' },
};

export const FORGETTING_CURVE_DATA = [
  { time: '0h', retention: 100 },
  { time: '1h', retention: 58 },
  { time: '9h', retention: 36 },
  { time: '24h', retention: 33 },
  { time: '48h', retention: 28 },
  { time: '7d', retention: 25 },
  { time: '30d', retention: 21 },
];

export const SRS_ALGORITHMS = {
  anki: { label: 'Anki-Style', description: 'Modified SM-2 with ease factor' },
  leitner: { label: 'Leitner Box', description: '5-box progressive system' },
  simple: { label: 'Simple Interval', description: 'Fixed doubling intervals' },
};

export const PRIORITY_THEMES = {
  high_priority: { label: 'High Priority', color: '#ef4444', bgColor: 'bg-red-100 text-red-700' },
  due_today: { label: 'Due Today', color: '#f59e0b', bgColor: 'bg-amber-100 text-amber-700' },
  overdue: { label: 'Overdue', color: '#dc2626', bgColor: 'bg-red-200 text-red-800' },
  review_scheduled: { label: 'Scheduled', color: '#6366f1', bgColor: 'bg-indigo-100 text-indigo-700' },
};

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const HOURS_24 = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

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
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export const getIntervalLabel = (days) => {
  if (days === 0) return 'Now';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days === 7) return '1 week';
  if (days < 30) return `${Math.round(days / 7)} weeks`;
  if (days === 30) return '1 month';
  return `${Math.round(days / 30)} months`;
};

export const calculateEaseFactor = (prevEF, quality) => {
  const newEF = prevEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return Math.max(1.3, newEF);
};

export const getSubjectById = (id) => SUBJECTS.find(s => s.id === id) || SUBJECTS[0];
