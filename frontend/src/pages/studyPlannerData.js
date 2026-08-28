import {
  SUBJECTS,
  TASK_STATUS,
  PRIORITY_LEVELS,
  SESSION_TYPES,
  WEEKDAY_LABELS,
  TEAM_ROLES,
} from './studyPlannerTypes';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomSubset = (arr, count) => [...arr].sort(() => 0.5 - Math.random()).slice(0, count);

const TEAM_MEMBERS = [
  { id: 'u1', name: 'Priya Sharma', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya', role: 'owner', online: true },
  { id: 'u2', name: 'Arjun Patel', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun', role: 'admin', online: true },
  { id: 'u3', name: 'Sneha Reddy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha', role: 'member', online: false },
  { id: 'u4', name: 'Vikram Singh', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram', role: 'member', online: true },
  { id: 'u5', name: 'Ananya Gupta', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya', role: 'member', online: false },
  { id: 'u6', name: 'Rohan Mehta', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan', role: 'viewer', online: false },
];

const TASK_TEMPLATES = [
  'Review Binary Search variations', 'Solve 3 Medium LeetCode problems',
  'Study Graph BFS/DFS patterns', 'Complete System Design Chapter 5',
  'Practice Behavioral Interview questions', 'Review OS deadlock concepts',
  'Database normalization exercises', 'TCP/IP protocol deep dive',
  'Build a REST API project', 'Write notes on ML algorithms',
  'Practice aptitude time & work problems', 'Review flashcards for DSA',
  'Complete mock quiz on Networks', 'Study design patterns (Singleton, Factory)',
  'Implement LRU Cache from scratch', 'Review operating system scheduling',
  'Practice SQL joins and subqueries', 'Study CAP theorem implications',
  'Complete peer teaching session on Arrays', 'Review week 3 study materials',
];

export const generateTasks = (count = 25) => {
  const tasks = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const subject = randomChoice(SUBJECTS);
    const status = randomChoice(Object.keys(TASK_STATUS));
    const priority = randomChoice(Object.keys(PRIORITY_LEVELS));
    const assignee = randomChoice(TEAM_MEMBERS);
    const daysOffset = randomInt(-5, 14);
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + daysOffset);
    const createdDate = new Date(dueDate);
    createdDate.setDate(createdDate.getDate() - randomInt(1, 10));

    tasks.push({
      id: `task-${i}`,
      title: randomChoice(TASK_TEMPLATES),
      description: `Complete this task related to ${subject.name}. Focus on understanding core concepts and practice problems.`,
      subject: subject.id,
      subjectName: subject.name,
      subjectIcon: subject.icon,
      subjectColor: subject.color,
      status,
      priority,
      assignee: { id: assignee.id, name: assignee.name, avatar: assignee.avatar },
      dueDate: dueDate.toISOString().split('T')[0],
      createdDate: createdDate.toISOString().split('T')[0],
      estimatedMinutes: randomInt(30, 180),
      completedMinutes: status === 'completed' ? randomInt(30, 180) : status === 'in_progress' ? randomInt(10, 120) : 0,
      tags: randomSubset(['important', 'deadline', 'practice', 'theory', 'project', 'revision'], randomInt(1, 3)),
      subtasks: randomInt(0, 5),
      completedSubtasks: randomInt(0, 3),
      comments: randomInt(0, 8),
    });
  }

  return tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
};

export const generateSchedule = (weeks = 2) => {
  const schedule = [];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + w * 7 + d);
      const dayLabel = WEEKDAY_LABELS[d];
      const isWeekend = d >= 5;
      const sessionCount = isWeekend ? randomInt(2, 5) : randomInt(3, 6);

      for (let s = 0; s < sessionCount; s++) {
        const startHour = randomInt(8, 20);
        const duration = randomInt(30, 180);
        const sessionType = randomChoice(Object.keys(SESSION_TYPES));
        const subject = randomChoice(SUBJECTS);
        const isGroup = sessionType === 'group' || sessionType === 'peer_teaching';

        schedule.push({
          id: `sched-${w}-${d}-${s}`,
          date: date.toISOString().split('T')[0],
          dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
          dayLabel,
          startHour,
          startTime: `${String(startHour).padStart(2, '0')}:00`,
          endTime: `${String(Math.min(startHour + Math.ceil(duration / 60), 23)).padStart(2, '0')}:00`,
          duration,
          sessionType,
          ...SESSION_TYPES[sessionType],
          subject: subject.id,
          subjectName: subject.name,
          subjectIcon: subject.icon,
          subjectColor: subject.color,
          isGroup,
          participants: isGroup ? randomSubset(TEAM_MEMBERS, randomInt(2, 4)).map(m => ({ id: m.id, name: m.name, avatar: m.avatar })) : [],
          completed: Math.random() > 0.4,
          notes: '',
        });
      }
    }
  }

  return schedule.sort((a, b) => a.startHour - b.startHour);
};

export const generateWeeklyProgress = (weeks = 12) => {
  const data = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i * 7);
    data.push({
      week: `W${weeks - i}`,
      date: date.toISOString().split('T')[0],
      studyHours: randomFloat(8, 35),
      tasksCompleted: randomInt(5, 25),
      tasksPlanned: randomInt(15, 30),
      sessionsAttended: randomInt(3, 10),
      groupSessions: randomInt(0, 5),
      avgSessionDuration: randomInt(45, 120),
      productivity: randomFloat(55, 95),
    });
  }
  return data;
};

export const generateSubjectDistribution = () => {
  return SUBJECTS.map(s => ({
    ...s,
    hours: randomFloat(5, 60),
    tasks: randomInt(3, 20),
    completed: randomInt(1, 15),
  }));
};

export const generateTeamActivity = (count = 20) => {
  const activities = [];
  const now = new Date();
  const actions = [
    'completed a task', 'started a study session', 'posted a comment',
    'updated task status', 'shared study notes', 'scheduled a group session',
    'submitted quiz results', 'created a new task', 'joined the team',
    'completed a flashcard deck',
  ];

  for (let i = 0; i < count; i++) {
    const member = randomChoice(TEAM_MEMBERS);
    const hoursAgo = randomInt(0, 72);
    const date = new Date(now);
    date.setHours(date.getHours() - hoursAgo);

    activities.push({
      id: `act-${i}`,
      user: { id: member.id, name: member.name, avatar: member.avatar },
      action: randomChoice(actions),
      timestamp: date.toISOString(),
      timeLabel: hoursAgo < 1 ? 'Just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`,
      subject: randomChoice(SUBJECTS).name,
    });
  }

  return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

export const generateGoalProgress = () => [
  { id: 'g1', label: 'Daily Study', target: 3, current: randomFloat(1, 4), unit: 'hrs/day', type: 'daily' },
  { id: 'g2', label: 'Weekly Tasks', target: 20, current: randomInt(5, 25), unit: 'tasks', type: 'weekly' },
  { id: 'g3', label: 'Group Sessions', target: 5, current: randomInt(1, 6), unit: 'sessions', type: 'weekly' },
  { id: 'g4', label: 'Study Streak', target: 30, current: randomInt(3, 35), unit: 'days', type: 'streak' },
  { id: 'g5', label: 'Monthly Hours', target: 80, current: randomInt(20, 90), unit: 'hours', type: 'monthly' },
  { id: 'g6', label: 'Quiz Accuracy', target: 85, current: randomFloat(55, 92), unit: '%', type: 'accuracy' },
];

export const generateTeamStats = () => ({
  totalMembers: TEAM_MEMBERS.length,
  onlineMembers: TEAM_MEMBERS.filter(m => m.online).length,
  totalTasks: randomInt(80, 150),
  completedTasks: randomInt(30, 70),
  upcomingSessions: randomInt(3, 10),
  avgProductivity: randomFloat(65, 90),
  weeklyHours: randomFloat(40, 120),
  weeklyChange: randomFloat(-5, 15),
});

export const generateBurndownData = (days = 14) => {
  const data = [];
  let remaining = randomInt(30, 50);
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const ideal = remaining * (1 - i / (days - 1));
    remaining = Math.max(0, remaining - randomInt(1, 4));
    data.push({
      day: i + 1,
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      actual: remaining,
      ideal: Math.max(0, Math.round(ideal)),
    });
  }
  return data;
};

export const generateUpcomingDeadlines = (tasks) => {
  const now = new Date();
  return tasks
    .filter(t => t.status !== 'completed' && new Date(t.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 8)
    .map(t => ({
      ...t,
      daysLeft: Math.ceil((new Date(t.dueDate) - now) / 86400000),
      isOverdue: false,
    }));
};

export { TEAM_MEMBERS };
