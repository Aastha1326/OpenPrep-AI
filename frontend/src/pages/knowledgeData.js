import {
  SUBJECTS,
  NODE_TYPES,
  MASTERY_LEVELS,
  DEPENDENCY_TYPES,
} from './knowledgeTypes';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomSubset = (arr, count) => [...arr].sort(() => 0.5 - Math.random()).slice(0, count);

const CONCEPT_NODES = [
  { label: 'Arrays', subject: 'dsa', type: 'data_structure', importance: 9 },
  { label: 'Linked Lists', subject: 'dsa', type: 'data_structure', importance: 7 },
  { label: 'Stacks', subject: 'dsa', type: 'data_structure', importance: 7 },
  { label: 'Queues', subject: 'dsa', type: 'data_structure', importance: 6 },
  { label: 'Hash Tables', subject: 'dsa', type: 'data_structure', importance: 9 },
  { label: 'Binary Trees', subject: 'dsa', type: 'data_structure', importance: 8 },
  { label: 'BST', subject: 'dsa', type: 'data_structure', importance: 8 },
  { label: 'Heaps', subject: 'dsa', type: 'data_structure', importance: 7 },
  { label: 'Graphs', subject: 'dsa', type: 'data_structure', importance: 9 },
  { label: 'Tries', subject: 'dsa', type: 'data_structure', importance: 6 },
  { label: 'Sorting', subject: 'dsa', type: 'algorithm', importance: 8 },
  { label: 'Binary Search', subject: 'dsa', type: 'algorithm', importance: 8 },
  { label: 'DFS', subject: 'dsa', type: 'algorithm', importance: 8 },
  { label: 'BFS', subject: 'dsa', type: 'algorithm', importance: 8 },
  { label: 'Dijkstra', subject: 'dsa', type: 'algorithm', importance: 7 },
  { label: 'Dynamic Programming', subject: 'dsa', type: 'pattern', importance: 9 },
  { label: 'Two Pointers', subject: 'dsa', type: 'pattern', importance: 7 },
  { label: 'Sliding Window', subject: 'dsa', type: 'pattern', importance: 7 },
  { label: 'Backtracking', subject: 'dsa', type: 'pattern', importance: 7 },
  { label: 'Divide & Conquer', subject: 'dsa', type: 'pattern', importance: 7 },
  { label: 'Load Balancing', subject: 'system_design', type: 'concept', importance: 8 },
  { label: 'Caching', subject: 'system_design', type: 'concept', importance: 9 },
  { label: 'Database Sharding', subject: 'system_design', type: 'concept', importance: 7 },
  { label: 'Microservices', subject: 'system_design', type: 'concept', importance: 8 },
  { label: 'Message Queues', subject: 'system_design', type: 'concept', importance: 7 },
  { label: 'CDN', subject: 'system_design', type: 'concept', importance: 6 },
  { label: 'Process Scheduling', subject: 'os', type: 'concept', importance: 8 },
  { label: 'Memory Management', subject: 'os', type: 'concept', importance: 8 },
  { label: 'Deadlocks', subject: 'os', type: 'concept', importance: 7 },
  { label: 'Virtual Memory', subject: 'os', type: 'concept', importance: 7 },
  { label: 'SQL Joins', subject: 'dbms', type: 'concept', importance: 9 },
  { label: 'Normalization', subject: 'dbms', type: 'concept', importance: 8 },
  { label: 'Indexing', subject: 'dbms', type: 'concept', importance: 8 },
  { label: 'Transactions', subject: 'dbms', type: 'concept', importance: 7 },
  { label: 'TCP/IP', subject: 'cn', type: 'concept', importance: 9 },
  { label: 'HTTP/HTTPS', subject: 'cn', type: 'concept', importance: 8 },
  { label: 'DNS', subject: 'cn', type: 'concept', importance: 7 },
  { label: 'Neural Networks', subject: 'ml', type: 'concept', importance: 8 },
  { label: 'Gradient Descent', subject: 'ml', type: 'algorithm', importance: 8 },
  { label: 'React', subject: 'web_dev', type: 'framework', importance: 9 },
  { label: 'Node.js', subject: 'web_dev', type: 'language', importance: 8 },
  { label: 'REST APIs', subject: 'web_dev', type: 'concept', importance: 9 },
  { label: 'Python', subject: 'ml', type: 'language', importance: 9 },
  { label: 'JavaScript', subject: 'web_dev', type: 'language', importance: 9 },
];

const DEPENDENCY_EDGES = [
  ['Linked Lists', 'Arrays', 'builds_on'],
  ['Stacks', 'Arrays', 'builds_on'],
  ['Queues', 'Arrays', 'builds_on'],
  ['Hash Tables', 'Arrays', 'builds_on'],
  ['Binary Trees', 'Linked Lists', 'builds_on'],
  ['BST', 'Binary Trees', 'builds_on'],
  ['Heaps', 'Binary Trees', 'builds_on'],
  ['Tries', 'Trees', 'builds_on'],
  ['Sorting', 'Arrays', 'prerequisite'],
  ['Binary Search', 'Sorting', 'prerequisite'],
  ['Binary Search', 'BST', 'used_in'],
  ['DFS', 'Graphs', 'prerequisite'],
  ['DFS', 'Binary Trees', 'used_in'],
  ['BFS', 'Graphs', 'prerequisite'],
  ['BFS', 'Stacks', 'used_in'],
  ['Dijkstra', 'Graphs', 'prerequisite'],
  ['Dijkstra', 'Heaps', 'used_in'],
  ['Dynamic Programming', 'Recursion', 'builds_on'],
  ['Dynamic Programming', 'Arrays', 'used_in'],
  ['Two Pointers', 'Arrays', 'prerequisite'],
  ['Sliding Window', 'Arrays', 'prerequisite'],
  ['Backtracking', 'Recursion', 'builds_on'],
  ['Divide & Conquer', 'Recursion', 'builds_on'],
  ['Load Balancing', 'Microservices', 'used_in'],
  ['Caching', 'Hash Tables', 'builds_on'],
  ['Caching', 'Redis', 'used_in'],
  ['Database Sharding', 'SQL Joins', 'builds_on'],
  ['Message Queues', 'Microservices', 'used_in'],
  ['CDN', 'HTTP/HTTPS', 'used_in'],
  ['Process Scheduling', 'Operating Systems', 'prerequisite'],
  ['Memory Management', 'Virtual Memory', 'builds_on'],
  ['Deadlocks', 'Process Scheduling', 'related'],
  ['SQL Joins', 'Normalization', 'related'],
  ['Indexing', 'SQL Joins', 'related'],
  ['Transactions', 'Normalization', 'related'],
  ['TCP/IP', 'HTTP/HTTPS', 'prerequisite'],
  ['HTTP/HTTPS', 'REST APIs', 'prerequisite'],
  ['DNS', 'TCP/IP', 'related'],
  ['Neural Networks', 'Gradient Descent', 'builds_on'],
  ['Gradient Descent', 'Python', 'used_in'],
  ['React', 'JavaScript', 'prerequisite'],
  ['REST APIs', 'Node.js', 'used_in'],
  ['Node.js', 'JavaScript', 'prerequisite'],
  ['Python', 'Machine Learning', 'used_in'],
];

export const generateGraphNodes = () => {
  return CONCEPT_NODES.map((node, idx) => {
    const mastery = randomInt(0, 100);
    const timesStudied = randomInt(0, 30);
    const lastStudied = mastery > 0
      ? new Date(Date.now() - randomInt(0, 30) * 86400000).toISOString().split('T')[0]
      : null;

    return {
      id: `node-${idx}`,
      label: node.label,
      subject: node.subject,
      subjectName: SUBJECTS.find(s => s.id === node.subject)?.name || node.subject,
      type: node.type,
      typeConfig: NODE_TYPES[node.type] || NODE_TYPES.concept,
      importance: node.importance,
      mastery,
      masteryLabel: mastery >= 90 ? 'mastered' : mastery >= 70 ? 'proficient' : mastery >= 50 ? 'learning' : mastery >= 25 ? 'beginner' : 'not_started',
      timesStudied,
      lastStudied,
      x: randomFloat(50, 800, 0),
      y: randomFloat(50, 500, 0),
      dependencies: [],
      dependents: [],
      quizScores: Array.from({ length: randomInt(3, 8) }, () => randomInt(40, 100)),
      notes: randomInt(0, 10),
      flashcards: randomInt(0, 20),
    };
  });
};

export const generateGraphEdges = (nodes) => {
  const edges = [];
  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.label] = n; });

  DEPENDENCY_EDGES.forEach(([from, to, type], idx) => {
    const fromNode = nodeMap[from];
    const toNode = nodeMap[to];
    if (fromNode && toNode) {
      edges.push({
        id: `edge-${idx}`,
        source: fromNode.id,
        target: toNode.id,
        sourceLabel: fromNode.label,
        targetLabel: toNode.label,
        type,
        typeConfig: DEPENDENCY_TYPES[type] || DEPENDENCY_TYPES.related,
      });
      fromNode.dependencies.push(toNode.id);
      toNode.dependents.push(fromNode.id);
    }
  });

  return edges;
};

export const generateSubjectSummary = (nodes) => {
  return SUBJECTS.map(s => {
    const subjectNodes = nodes.filter(n => n.subject === s.id);
    const avgMastery = subjectNodes.length > 0
      ? Math.round(subjectNodes.reduce((sum, n) => sum + n.mastery, 0) / subjectNodes.length)
      : 0;
    return {
      ...s,
      totalNodes: subjectNodes.length,
      avgMastery,
      mastered: subjectNodes.filter(n => n.mastery >= 90).length,
      proficient: subjectNodes.filter(n => n.mastery >= 70 && n.mastery < 90).length,
      learning: subjectNodes.filter(n => n.mastery >= 50 && n.mastery < 70).length,
      beginner: subjectNodes.filter(n => n.mastery >= 25 && n.mastery < 50).length,
      notStarted: subjectNodes.filter(n => n.mastery < 25).length,
      weakNodes: subjectNodes.filter(n => n.mastery < 40).map(n => n.label).slice(0, 3),
      strongNodes: subjectNodes.filter(n => n.mastery >= 80).map(n => n.label).slice(0, 3),
    };
  }).filter(s => s.totalNodes > 0);
};

export const generateLearningPath = (nodes, edges) => {
  const paths = [];
  const criticalPath = ['Arrays', 'Linked Lists', 'Binary Trees', 'BST', 'Graphs', 'DFS', 'BFS', 'Dynamic Programming'];

  paths.push({
    id: 'path-1',
    name: 'DSA Mastery Path',
    description: 'Complete data structures and algorithms learning path',
    icon: '🧮',
    color: '#6366f1',
    steps: criticalPath.map(label => {
      const node = nodes.find(n => n.label === label);
      return node ? { id: node.id, label: node.label, mastery: node.mastery } : null;
    }).filter(Boolean),
    progress: randomInt(30, 80),
  });

  paths.push({
    id: 'path-2',
    name: 'System Design Essentials',
    description: 'Core system design concepts for interviews',
    icon: '🏗️',
    color: '#8b5cf6',
    steps: ['Load Balancing', 'Caching', 'Database Sharding', 'Microservices', 'Message Queues', 'CDN'].map(label => {
      const node = nodes.find(n => n.label === label);
      return node ? { id: node.id, label: node.label, mastery: node.mastery } : null;
    }).filter(Boolean),
    progress: randomInt(20, 70),
  });

  paths.push({
    id: 'path-3',
    name: 'Web Dev Stack',
    description: 'Full-stack web development path',
    icon: '🌍',
    color: '#ef4444',
    steps: ['JavaScript', 'React', 'Node.js', 'REST APIs', 'HTTP/HTTPS', 'TCP/IP'].map(label => {
      const node = nodes.find(n => n.label === label);
      return node ? { id: node.id, label: node.label, mastery: node.mastery } : null;
    }).filter(Boolean),
    progress: randomInt(25, 75),
  });

  return paths;
};

export const generateKnowledgeGaps = (nodes, edges) => {
  const gaps = nodes
    .filter(n => n.mastery < 40 && n.importance >= 7)
    .sort((a, b) => b.importance - a.importance || a.mastery - b.mastery)
    .slice(0, 10)
    .map(n => ({
      nodeId: n.id,
      label: n.label,
      subject: n.subjectName,
      subjectIcon: n.typeConfig?.icon,
      mastery: n.mastery,
      importance: n.importance,
      blocking: edges.filter(e => e.target === n.id).length,
      blockedBy: edges.filter(e => e.source === n.id).length,
      priority: n.importance * (100 - n.mastery) / 100,
    }));

  return gaps.sort((a, b) => b.priority - a.priority);
};

export const generateMasteryDistribution = (nodes) => {
  const buckets = [
    { range: '0-20%', count: nodes.filter(n => n.mastery < 20).length, color: '#ef4444' },
    { range: '20-40%', count: nodes.filter(n => n.mastery >= 20 && n.mastery < 40).length, color: '#f59e0b' },
    { range: '40-60%', count: nodes.filter(n => n.mastery >= 40 && n.mastery < 60).length, color: '#fbbf24' },
    { range: '60-80%', count: nodes.filter(n => n.mastery >= 60 && n.mastery < 80).length, color: '#34d399' },
    { range: '80-100%', count: nodes.filter(n => n.mastery >= 80).length, color: '#22c55e' },
  ];
  return buckets;
};

export const generateWeeklyStudyData = (weeks = 8) => {
  const data = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i * 7);
    data.push({
      week: `W${weeks - i}`,
      nodesStudied: randomInt(5, 20),
      avgMasteryChange: randomFloat(-2, 8),
      newConnections: randomInt(0, 5),
      practiceHours: randomFloat(3, 15),
    });
  }
  return data;
};
