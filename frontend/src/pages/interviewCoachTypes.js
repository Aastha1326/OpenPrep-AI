export const INTERVIEW_TYPES = {
  technical: { label: 'Technical', icon: '💻', color: '#6366f1', description: 'Coding & system design questions' },
  behavioral: { label: 'Behavioral', icon: '🗣️', color: '#8b5cf6', description: 'STAR method & soft skills' },
  system_design: { label: 'System Design', icon: '🏗️', color: '#ec4899', description: 'Architecture & scalability' },
  coding: { label: 'Coding', icon: '⌨️', color: '#10b981', description: 'DSA & problem solving' },
  hr: { label: 'HR Round', icon: '🤝', color: '#f59e0b', description: 'Culture fit & salary negotiation' },
  case_study: { label: 'Case Study', icon: '📊', color: '#3b82f6', description: 'Business & analytical thinking' },
};

export const DIFFICULTY_LEVELS = {
  easy: { label: 'Easy', color: '#22c55e', bgColor: 'bg-green-100 text-green-700', score: 1 },
  medium: { label: 'Medium', color: '#f59e0b', bgColor: 'bg-amber-100 text-amber-700', score: 2 },
  hard: { label: 'Hard', color: '#ef4444', bgColor: 'bg-red-100 text-red-700', score: 3 },
  expert: { label: 'Expert', color: '#7c3aed', bgColor: 'bg-purple-100 text-purple-700', score: 4 },
};

export const FEEDBACK_CATEGORIES = {
  communication: { label: 'Communication', icon: '💬', weight: 0.2 },
  technical_depth: { label: 'Technical Depth', icon: '🧠', weight: 0.25 },
  problem_solving: { label: 'Problem Solving', icon: '🔍', weight: 0.25 },
  confidence: { label: 'Confidence', icon: '💪', weight: 0.15 },
  clarity: { label: 'Clarity & Structure', icon: '📋', weight: 0.15 },
};

export const QUESTION_CATEGORIES = [
  { id: 'dsa', name: 'Data Structures & Algorithms', icon: '🧮' },
  { id: 'system_design', name: 'System Design', icon: '🏗️' },
  { id: 'os', name: 'Operating Systems', icon: '💻' },
  { id: 'dbms', name: 'Database Systems', icon: '🗄️' },
  { id: 'cn', name: 'Computer Networks', icon: '🌐' },
  { id: 'ml', name: 'Machine Learning', icon: '🤖' },
  { id: 'web', name: 'Web Development', icon: '🌍' },
  { id: 'behavioral', name: 'Behavioral', icon: '🗣️' },
  { id: 'leadership', name: 'Leadership', icon: '👑' },
  { id: 'conflict', name: 'Conflict Resolution', icon: '🤝' },
];

export const SCORE_RUBRIC = {
  excellent: { min: 85, label: 'Excellent', color: '#22c55e', emoji: '🌟' },
  good: { min: 70, label: 'Good', color: '#6366f1', emoji: '👍' },
  average: { min: 50, label: 'Average', color: '#f59e0b', emoji: '🤔' },
  poor: { min: 0, label: 'Needs Work', color: '#ef4444', emoji: '📝' },
};

export const STRENGTH_AREAS = [
  'Algorithm Design', 'Data Structure Selection', 'Time Complexity Analysis',
  'Space Optimization', 'Edge Case Handling', 'Code Cleanliness',
  'System Architecture', 'Scalability Thinking', 'Database Design',
  'Network Protocols', 'Communication Skills', 'Structured Thinking',
  'STAR Method Usage', 'Leadership Examples', 'Conflict Resolution',
  'Problem Decomposition', 'Trade-off Analysis', 'API Design',
];

export const IMPROVEMENT_AREAS = [
  'Explain approach before coding', 'Consider edge cases explicitly',
  'Mention time/space complexity', 'Use more specific examples',
  'Practice active listening', 'Structure answers with STAR',
  'Ask clarifying questions', 'Think out loud more',
  'Discuss trade-offs proactively', 'Provide concrete metrics',
  'Improve time management', 'Practice whiteboard coding',
  'Strengthen system design fundamentals', 'Review common patterns',
];

export const getScoreRubric = (score) => {
  if (score >= SCORE_RUBRIC.excellent.min) return SCORE_RUBRIC.excellent;
  if (score >= SCORE_RUBRIC.good.min) return SCORE_RUBRIC.good;
  if (score >= SCORE_RUBRIC.average.min) return SCORE_RUBRIC.average;
  return SCORE_RUBRIC.poor;
};

export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};
