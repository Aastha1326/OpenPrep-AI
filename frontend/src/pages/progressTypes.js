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

export const DIFFICULTY_LEVELS = {
  beginner: { label: 'Beginner', color: '#22c55e', bgColor: 'bg-green-100 text-green-700' },
  intermediate: { label: 'Intermediate', color: '#f59e0b', bgColor: 'bg-amber-100 text-amber-700' },
  advanced: { label: 'Advanced', color: '#ef4444', bgColor: 'bg-red-100 text-red-700' },
};

export const STREAK_TIERS = [
  { min: 0, max: 2, label: 'Inactive', color: '#9ca3af', emoji: '😴' },
  { min: 3, max: 6, label: 'Getting Started', color: '#60a5fa', emoji: '🌱' },
  { min: 7, max: 13, label: 'Consistent', color: '#34d399', emoji: '🔥' },
  { min: 14, max: 29, label: 'Dedicated', color: '#f59e0b', emoji: '⚡' },
  { min: 30, max: Infinity, label: 'Unstoppable', color: '#f43f5e', emoji: '🏆' },
];

export const MILESTONE_TYPES = {
  quiz_mastery: { label: 'Quiz Mastery', icon: '🎯', color: '#6366f1' },
  streak_achievement: { label: 'Streak Achievement', icon: '🔥', color: '#f59e0b' },
  subject_complete: { label: 'Subject Complete', icon: '📚', color: '#10b981' },
  speed_record: { label: 'Speed Record', icon: '⚡', color: '#3b82f6' },
  accuracy_milestone: { label: 'Accuracy Milestone', icon: '🎯', color: '#8b5cf6' },
  practice_hours: { label: 'Practice Hours', icon: '⏰', color: '#ec4899' },
  flashcard_streak: { label: 'Flashcard Streak', icon: '🃏', color: '#06b6d4' },
  rank_up: { label: 'Rank Up', icon: '👑', color: '#f43f5e' },
};

export const ACTIVITY_TYPES = {
  quiz: { label: 'Quiz', icon: '📝', color: '#6366f1' },
  flashcard: { label: 'Flashcard', icon: '🃏', color: '#8b5cf6' },
  notes: { label: 'Notes', icon: '📒', color: '#10b981' },
  mock_interview: { label: 'Mock Interview', icon: '🎤', color: '#ef4444' },
  video: { label: 'Video Lecture', icon: '🎬', color: '#f59e0b' },
  practice: { label: 'Coding Practice', icon: '⌨️', color: '#3b82f6' },
  revision: { label: 'Revision', icon: '📖', color: '#ec4899' },
};

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const GOAL_TYPES = {
  daily: { label: 'Daily', target: 2, unit: 'hours' },
  weekly: { label: 'Weekly', target: 14, unit: 'hours' },
  monthly: { label: 'Monthly', target: 60, unit: 'hours' },
  quiz_target: { label: 'Quiz Target', target: 100, unit: 'quizzes' },
  accuracy_target: { label: 'Accuracy Target', target: 85, unit: '%' },
};

export const COMPARISON_METRICS = [
  { key: 'studyHours', label: 'Study Hours', unit: 'hrs', color: '#6366f1' },
  { key: 'quizzesCompleted', label: 'Quizzes Done', unit: '', color: '#8b5cf6' },
  { key: 'accuracy', label: 'Accuracy', unit: '%', color: '#10b981' },
  { key: 'flashcardsReviewed', label: 'Cards Reviewed', unit: '', color: '#f59e0b' },
  { key: 'problemsSolved', label: 'Problems Solved', unit: '', color: '#ef4444' },
  { key: 'streakDays', label: 'Streak Days', unit: 'days', color: '#3b82f6' },
];

export const getStreakTier = (streak) => {
  return STREAK_TIERS.find(t => streak >= t.min && streak <= t.max) || STREAK_TIERS[0];
};

export const getSubjectById = (id) => {
  return SUBJECTS.find(s => s.id === id) || SUBJECTS[0];
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

export const formatPercent = (value) => {
  return `${Math.round(value)}%`;
};
