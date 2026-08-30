import {
  SUBJECTS,
  SPACED_REPETITION_LEVELS,
  REVIEW_TYPES,
  REMINDER_TYPES,
  WEEKDAY_LABELS,
} from './revisionTypes';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomSubset = (arr, count) => [...arr].sort(() => 0.5 - Math.random()).slice(0, count);

const TOPIC_TEMPLATES = [
  'Binary Search Trees', 'Graph Dijkstra Algorithm', 'Hash Table Collision Resolution',
  'Stack vs Queue Patterns', 'Dynamic Programming Knapsack', 'Linked List Reversal',
  'Tree Traversal Methods', 'Heap Operations', 'Trie Implementation', 'Union-Find',
  'System Design Load Balancer', 'Database Indexing Strategies', 'TCP/IP Protocols',
  'Operating System Scheduling', 'Memory Management Virtual Memory', 'Deadlock Prevention',
  'CAP Theorem Applications', 'Microservices Architecture', 'Caching Strategies',
  'ML Gradient Descent', 'Neural Network Backpropagation', 'SQL Query Optimization',
  'REST API Design Patterns', 'WebSocket vs SSE', 'Kubernetes Pod Management',
  'Redis Data Structures', 'OAuth 2.0 Flow', 'Rate Limiting Algorithms',
  'Merkle Tree Verification', 'Consistent Hashing', 'Bloom Filter Probabilities',
  'A* Pathfinding Algorithm', 'KMP String Matching', 'Topological Sort',
];

export const generateFlashcards = (count = 60) => {
  const cards = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const subject = randomChoice(SUBJECTS);
    const level = randomChoice(Object.keys(SPACED_REPETITION_LEVELS));
    const config = SPACED_REPETITION_LEVELS[level];
    const lastReviewed = new Date(now);
    lastReviewed.setDate(lastReviewed.getDate() - randomInt(0, 30));
    const nextReview = new Date(lastReviewed);
    nextReview.setDate(nextReview.getDate() + config.interval);

    cards.push({
      id: `card-${i}`,
      front: randomChoice(TOPIC_TEMPLATES),
      back: `Detailed explanation of ${randomChoice(TOPIC_TEMPLATES)} with examples and practice problems.`,
      subject: subject.id,
      subjectName: subject.name,
      subjectIcon: subject.icon,
      subjectColor: subject.color,
      level,
      levelConfig: config,
      easeFactor: randomFloat(1.3, 2.8),
      interval: config.interval,
      repetitions: randomInt(0, 10),
      lastReviewed: lastReviewed.toISOString().split('T')[0],
      nextReview: nextReview.toISOString().split('T')[0],
      nextReviewTime: `${String(randomInt(6, 22)).padStart(2, '0')}:00`,
      isOverdue: nextReview < now,
      daysOverdue: nextReview < now ? Math.ceil((now - nextReview) / 86400000) : 0,
      estimatedMinutes: randomInt(3, 15),
      totalReviews: randomInt(0, 30),
      correctCount: randomInt(0, 20),
      streak: randomInt(0, 10),
      tags: randomSubset(['important', 'hard', 'easy', 'exam', 'interview', 'revision'], randomInt(1, 3)),
    });
  }

  return cards;
};

export const generateReviewSchedule = (days = 14) => {
  const schedule = [];
  const now = new Date();

  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const reviewCount = isWeekend ? randomInt(5, 15) : randomInt(8, 25);

    for (let r = 0; r < reviewCount; r++) {
      const subject = randomChoice(SUBJECTS);
      const hour = randomInt(6, 22);
      const minute = randomChoice([0, 15, 30, 45]);
      const reviewType = randomChoice(Object.keys(REVIEW_TYPES));
      const typeConfig = REVIEW_TYPES[reviewType];
      const priority = d === 0 ? randomChoice(['high', 'urgent']) : d <= 2 ? randomChoice(['medium', 'high']) : randomChoice(['low', 'medium']);

      schedule.push({
        id: `rev-${d}-${r}`,
        date: date.toISOString().split('T')[0],
        dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
        dayLabel: WEEKDAY_LABELS[(date.getDay() + 6) % 7],
        hour,
        minute,
        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        endTime: `${String(Math.min(hour + Math.ceil(typeConfig.estimatedMinutes / 60), 23)).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        subject: subject.id,
        subjectName: subject.name,
        subjectIcon: subject.icon,
        subjectColor: subject.color,
        reviewType,
        ...typeConfig,
        priority,
        completed: d === 0 ? Math.random() > 0.6 : false,
        completedAt: null,
        score: null,
      });
    }
  }

  return schedule.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.hour - b.hour;
  });
};

export const generateRetentionData = (weeks = 8) => {
  const data = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const date = new Date();
    date.setDate(date.getDate() - w * 7);
    data.push({
      week: `W${weeks - w}`,
      date: date.toISOString().split('T')[0],
      retention: randomFloat(60, 95),
      cardsReviewed: randomInt(30, 100),
      accuracy: randomFloat(60, 95),
      newCards: randomInt(5, 20),
      youngCards: randomInt(10, 30),
      matureCards: randomInt(15, 50),
      masteredCards: randomInt(5, 20),
      avgInterval: randomFloat(3, 15),
    });
  }
  return data;
};

export const generateSubjectRetention = () => {
  return SUBJECTS.map(s => ({
    ...s,
    totalCards: randomInt(10, 50),
    retentionRate: randomFloat(55, 95),
    avgEaseFactor: randomFloat(1.5, 2.5),
    reviewsDue: randomInt(0, 20),
    masteredPercent: randomFloat(10, 70),
    lastReview: new Date(Date.now() - randomInt(0, 7) * 86400000).toISOString().split('T')[0],
    weakTopics: randomSubset(TOPIC_TEMPLATES, randomInt(1, 3)),
    strongTopics: randomSubset(TOPIC_TEMPLATES, randomInt(1, 3)),
  }));
};

export const generateWeeklyStats = () => ({
  cardsReviewed: randomInt(100, 300),
  reviewsCompleted: randomInt(50, 150),
  avgAccuracy: randomFloat(70, 92),
  totalMinutes: randomInt(120, 400),
  streakDays: randomInt(2, 14),
  longestStreak: randomInt(7, 30),
  newCardsLearned: randomInt(20, 60),
  cardsGraduated: randomInt(10, 40),
  cardsForgotten: randomInt(0, 10),
  retentionRate: randomFloat(70, 92),
  cardsPerDay: randomInt(15, 40),
  avgSessionLength: randomFloat(8, 25),
});

export const generateReminders = (count = 8) => {
  const reminders = [];
  const times = ['06:00', '08:00', '10:00', '12:00', '14:00', '17:00', '19:00', '21:00'];

  for (let i = 0; i < count; i++) {
    const type = randomChoice(Object.keys(REMINDER_TYPES));
    reminders.push({
      id: `rem-${i}`,
      type,
      ...REMINDER_TYPES[type],
      time: times[i % times.length],
      enabled: Math.random() > 0.3,
      label: `Review ${randomChoice(SUBJECTS).name}`,
      days: randomSubset(WEEKDAY_LABELS, randomInt(3, 7)),
      minCards: randomInt(5, 20),
    });
  }

  return reminders;
};

export const generateForgettingCurve = () => [
  { hour: 0, retention: 100, label: 'Just learned' },
  { hour: 1, retention: 58, label: '1 hour' },
  { hour: 4, retention: 42, label: '4 hours' },
  { hour: 9, retention: 36, label: '9 hours' },
  { hour: 24, retention: 33, label: '1 day' },
  { hour: 48, retention: 28, label: '2 days' },
  { hour: 168, retention: 25, label: '1 week' },
  { hour: 720, retention: 21, label: '1 month' },
];

export const generateOptimalSchedule = () => {
  const now = new Date();
  const schedule = [];
  const timeSlots = [
    { hour: 7, label: 'Morning Warm-up', type: 'flashcard', intensity: 'low' },
    { hour: 10, label: 'Focused Review', type: 'quiz', intensity: 'high' },
    { hour: 13, label: 'Light Review', type: 'notes_review', intensity: 'low' },
    { hour: 16, label: 'Practice Session', type: 'practice', intensity: 'medium' },
    { hour: 19, label: 'Evening Revision', type: 'flashcard', intensity: 'medium' },
    { hour: 21, label: 'Quick Recap', type: 'mindmap', intensity: 'low' },
  ];

  timeSlots.forEach((slot, i) => {
    const date = new Date(now);
    schedule.push({
      id: `opt-${i}`,
      ...slot,
      time: `${String(slot.hour).padStart(2, '0')}:00`,
      endTime: `${String(slot.hour + 1).padStart(2, '0')}:00`,
      cardsTarget: slot.intensity === 'high' ? randomInt(15, 25) : slot.intensity === 'medium' ? randomInt(8, 15) : randomInt(3, 8),
      estimatedMinutes: REVIEW_TYPES[slot.type]?.estimatedMinutes || 10,
      subject: randomChoice(SUBJECTS).id,
    });
  });

  return schedule;
};

export { TOPIC_TEMPLATES };
