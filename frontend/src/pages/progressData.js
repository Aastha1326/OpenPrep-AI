import {
  SUBJECTS,
  WEEKDAY_LABELS,
  MONTH_LABELS,
  MILESTONE_TYPES,
  ACTIVITY_TYPES,
} from './progressTypes';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const generateDailyStudyData = (days = 90) => {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseHours = isWeekend ? randomFloat(1.5, 5) : randomFloat(0.5, 4);
    const subjectBreakdown = {};
    let remaining = baseHours;
    const subjectsUsed = SUBJECTS.slice(0, randomInt(2, 5));
    subjectsUsed.forEach((s, idx) => {
      if (idx === subjectsUsed.length - 1) {
        subjectBreakdown[s.id] = parseFloat(remaining.toFixed(1));
      } else {
        const portion = randomFloat(0.3, remaining * 0.5);
        subjectBreakdown[s.id] = parseFloat(portion.toFixed(1));
        remaining -= portion;
      }
    });
    const quizCount = randomInt(0, 15);
    const correctCount = Math.floor(quizCount * randomFloat(0.45, 0.95));
    const flashcardsReviewed = randomInt(0, 50);
    const problemsSolved = randomInt(0, 8);

    data.push({
      date: date.toISOString().split('T')[0],
      dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
      dayLabel: WEEKDAY_LABELS[(dayOfWeek + 6) % 7],
      totalHours: baseHours,
      subjectBreakdown,
      quizCount,
      correctCount,
      accuracy: quizCount > 0 ? parseFloat((correctCount / quizCount * 100).toFixed(1)) : 0,
      flashcardsReviewed,
      problemsSolved,
      minutesFocused: Math.floor(baseHours * 60),
      breakMinutes: randomInt(10, 45),
      focusSessions: randomInt(1, 6),
      longestSession: randomFloat(20, 120, 0),
    });
  }
  return data;
};

export const generateWeeklySummary = (weeks = 12) => {
  const data = [];
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7 + now.getDay()));
    data.push({
      week: `W${weeks - i}`,
      weekStart: weekStart.toISOString().split('T')[0],
      totalHours: randomFloat(8, 35),
      quizzesCompleted: randomInt(20, 120),
      avgAccuracy: randomFloat(55, 92),
      flashcardsReviewed: randomInt(50, 400),
      problemsSolved: randomInt(10, 60),
      newMilestones: randomInt(0, 5),
      streakMaintained: Math.random() > 0.3,
      studyDays: randomInt(3, 7),
    });
  }
  return data;
};

export const generateSubjectProgress = () => {
  return SUBJECTS.map(subject => {
    const totalHours = randomFloat(10, 120);
    const quizzesTaken = randomInt(20, 200);
    const avgAccuracy = randomFloat(45, 95);
    const flashcardsMastered = randomInt(10, 150);
    const problemsSolved = randomInt(5, 100);
    const lastStudied = new Date(Date.now() - randomInt(0, 14) * 86400000).toISOString();
    const topicsCovered = randomInt(3, 20);
    const totalTopics = randomInt(topicsCovered, topicsCovered + 10);

    return {
      ...subject,
      totalHours,
      quizzesTaken,
      avgAccuracy: parseFloat(avgAccuracy.toFixed(1)),
      flashcardsMastered,
      problemsSolved,
      lastStudied,
      topicsCovered,
      totalTopics,
      completionPercent: parseFloat((topicsCovered / totalTopics * 100).toFixed(1)),
      weeklyTrend: Array.from({ length: 8 }, () => randomFloat(-5, 15)),
      difficultyBreakdown: {
        beginner: randomInt(20, 50),
        intermediate: randomInt(20, 50),
        advanced: randomInt(5, 30),
      },
    };
  });
};

export const generateMilestones = (count = 25) => {
  const milestones = [];
  const types = Object.keys(MILESTONE_TYPES);
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const type = randomChoice(types);
    const daysAgo = randomInt(0, 90);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    milestones.push({
      id: `ms-${i}`,
      type,
      ...MILESTONE_TYPES[type],
      subject: randomChoice(SUBJECTS).id,
      subjectName: randomChoice(SUBJECTS).name,
      date: date.toISOString().split('T')[0],
      dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
      value: randomInt(1, 100),
      description: getDescriptionForMilestone(type),
      isNew: daysAgo <= 3,
    });
  }

  return milestones.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const getDescriptionForMilestone = (type) => {
  const descriptions = {
    quiz_mastery: 'Scored 90%+ on 10 consecutive quizzes',
    streak_achievement: 'Maintained a study streak for 14 days',
    subject_complete: 'Completed all topics in a subject',
    speed_record: 'Solved a problem in under 30 seconds',
    accuracy_milestone: 'Achieved 95% accuracy across all quizzes',
    practice_hours: 'Logged 100 hours of total study time',
    flashcard_streak: 'Reviewed flashcards every day for a week',
    rank_up: 'Promoted to the top 10% on the leaderboard',
  };
  return descriptions[type] || 'Achievement unlocked!';
};

export const generateActivityLog = (count = 60) => {
  const log = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const type = randomChoice(Object.keys(ACTIVITY_TYPES));
    const hoursAgo = randomInt(0, 168);
    const date = new Date(now);
    date.setHours(date.getHours() - hoursAgo);
    const subject = randomChoice(SUBJECTS);

    log.push({
      id: `act-${i}`,
      type,
      ...ACTIVITY_TYPES[type],
      subject: subject.id,
      subjectName: subject.name,
      timestamp: date.toISOString(),
      timeLabel: `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`,
      duration: randomInt(5, 90),
      score: type === 'quiz' ? randomInt(30, 100) : null,
      itemsCompleted: randomInt(1, 20),
    });
  }

  return log.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

export const generateLeaderboard = (count = 20) => {
  const names = [
    'Priya Sharma', 'Arjun Patel', 'Sneha Reddy', 'Vikram Singh',
    'Ananya Gupta', 'Rohan Mehta', 'Kavya Iyer', 'Aditya Nair',
    'Deepika Joshi', 'Karthik Kumar', 'Meera Das', 'Saurabh Verma',
    'Nisha Agarwal', 'Amit Chauhan', 'Pooja Mishra', 'Rahul Bose',
    'Shreya Kulkarni', 'Varun Tiwari', 'Ritu Malhotra', 'Nikhil Jain',
  ];

  return names.slice(0, count).map((name, idx) => ({
    rank: idx + 1,
    name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s/g, '')}`,
    totalHours: randomFloat(20, 200),
    quizzesCompleted: randomInt(50, 500),
    avgAccuracy: randomFloat(60, 98),
    currentStreak: randomInt(0, 60),
    totalPoints: randomInt(1000, 15000),
    rankChange: randomInt(-3, 5),
  })).sort((a, b) => b.totalPoints - a.totalPoints).map((entry, idx) => ({ ...entry, rank: idx + 1 }));
};

export const generateHeatmapData = (weeks = 20) => {
  const data = [];
  const now = new Date();

  for (let w = weeks - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (w * 7 + (6 - d)));
      if (date > now) continue;
      data.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek: d,
        week: weeks - w,
        hours: randomFloat(0, 6),
        activities: randomInt(0, 10),
      });
    }
  }
  return data;
};

export const generateGoalProgress = () => [
  { id: 'g1', label: 'Daily Study', target: 3, current: randomFloat(1.5, 3.5), unit: 'hrs/day', type: 'daily' },
  { id: 'g2', label: 'Weekly Quizzes', target: 50, current: randomInt(20, 60), unit: 'quizzes', type: 'weekly' },
  { id: 'g3', label: 'Monthly Accuracy', target: 85, current: randomFloat(60, 95), unit: '%', type: 'monthly' },
  { id: 'g4', label: 'Flashcard Mastery', target: 200, current: randomInt(50, 250), unit: 'cards', type: 'mastery' },
  { id: 'g5', label: 'Problems Solved', target: 100, current: randomInt(30, 120), unit: 'problems', type: 'practice' },
  { id: 'g6', label: 'Study Streak', target: 30, current: randomInt(5, 35), unit: 'days', type: 'streak' },
];

export const generatePerformancePrediction = () => {
  const subjects = SUBJECTS.slice(0, 5);
  return subjects.map(s => ({
    subjectId: s.id,
    subjectName: s.name,
    icon: s.icon,
    currentScore: randomFloat(40, 85),
    predictedScore: randomFloat(50, 95),
    confidence: randomFloat(0.6, 0.95),
    neededHours: randomInt(5, 40),
    weakTopics: randomChoice([
      ['Dynamic Programming', 'Graph Algorithms'],
      ['Deadlocks', 'Memory Management'],
      ['Normalization', 'Indexing'],
      ['TCP/IP', 'DNS Resolution'],
      ['Neural Networks', 'Backpropagation'],
    ]),
  }));
};

export const generatePeerComparison = () => {
  return SUBJECTS.slice(0, 5).map(s => ({
    subject: s.name,
    subjectId: s.id,
    icon: s.icon,
    yourScore: randomFloat(40, 90),
    avgScore: randomFloat(50, 75),
    topScore: randomFloat(85, 98),
    percentile: randomInt(20, 95),
  }));
};

export const generateOverallStats = () => ({
  totalStudyHours: randomFloat(120, 500),
  totalQuizzes: randomInt(500, 2000),
  overallAccuracy: randomFloat(62, 88),
  currentStreak: randomInt(3, 45),
  longestStreak: randomInt(10, 60),
  totalFlashcards: randomInt(200, 1500),
  totalProblems: randomInt(100, 800),
  currentRank: randomInt(1, 50),
  totalPoints: randomInt(5000, 20000),
  studyDays: randomInt(30, 90),
  avgDailyHours: randomFloat(1.5, 5),
  improvementRate: randomFloat(2, 15),
  weeklyChange: {
    hours: randomFloat(-5, 10),
    accuracy: randomFloat(-5, 8),
    quizzes: randomInt(-20, 30),
  },
});
