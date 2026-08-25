export const NODE_TYPES = {
  concept: { label: 'Concept', icon: '💡', color: '#6366f1', shape: 'circle' },
  algorithm: { label: 'Algorithm', icon: '⚡', color: '#8b5cf6', shape: 'diamond' },
  data_structure: { label: 'Data Structure', icon: '📦', color: '#10b981', shape: 'square' },
  pattern: { label: 'Pattern', icon: '🔄', color: '#f59e0b', shape: 'triangle' },
  topic: { label: 'Topic', icon: '📚', color: '#ec4899', shape: 'hexagon' },
  tool: { label: 'Tool', icon: '🔧', color: '#3b82f6', shape: 'square' },
  language: { label: 'Language', icon: '💻', color: '#06b6d4', shape: 'circle' },
  framework: { label: 'Framework', icon: '🏗️', color: '#ef4444', shape: 'square' },
};

export const MASTERY_LEVELS = {
  not_started: { label: 'Not Started', color: '#d1d5db', score: 0 },
  beginner: { label: 'Beginner', color: '#f87171', score: 25 },
  learning: { label: 'Learning', color: '#fbbf24', score: 50 },
  proficient: { label: 'Proficient', color: '#34d399', score: 75 },
  mastered: { label: 'Mastered', color: '#22c55e', score: 100 },
};

export const DEPENDENCY_TYPES = {
  prerequisite: { label: 'Prerequisite', color: '#ef4444', style: 'solid', description: 'Must learn before' },
  related: { label: 'Related', color: '#6366f1', style: 'dashed', description: 'Helps to know' },
  builds_on: { label: 'Builds On', color: '#10b981', style: 'solid', description: 'Directly extends' },
  used_in: { label: 'Used In', color: '#f59e0b', style: 'dotted', description: 'Applied in' },
  alternative: { label: 'Alternative', color: '#8b5cf6', style: 'dashed', description: 'Can substitute' },
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

export const GRAPH_LAYOUTS = {
  force: { label: 'Force-Directed', description: 'Physics-based layout' },
  tree: { label: 'Tree', description: 'Hierarchical tree layout' },
  radial: { label: 'Radial', description: 'Radial tree layout' },
  grid: { label: 'Grid', description: 'Grid-based layout' },
};

export const FILTER_MODES = {
  all: { label: 'All Nodes', icon: '🌐' },
  mastery: { label: 'By Mastery', icon: '📊' },
  dependency: { label: 'By Dependencies', icon: '🔗' },
  subject: { label: 'By Subject', icon: '📚' },
  gaps: { label: 'Knowledge Gaps', icon: '⚠️' },
};

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const getMasteryColor = (score) => {
  if (score >= 90) return MASTERY_LEVELS.mastered.color;
  if (score >= 70) return MASTERY_LEVELS.proficient.color;
  if (score >= 50) return MASTERY_LEVELS.learning.color;
  if (score >= 25) return MASTERY_LEVELS.beginner.color;
  return MASTERY_LEVELS.not_started.color;
};

export const getMasteryLabel = (score) => {
  if (score >= 90) return MASTERY_LEVELS.mastered.label;
  if (score >= 70) return MASTERY_LEVELS.proficient.label;
  if (score >= 50) return MASTERY_LEVELS.learning.label;
  if (score >= 25) return MASTERY_LEVELS.beginner.label;
  return MASTERY_LEVELS.not_started.label;
};

export const getSubjectById = (id) => SUBJECTS.find(s => s.id === id) || SUBJECTS[0];
