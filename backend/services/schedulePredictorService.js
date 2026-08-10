const { toDateOnlyString } = require('../utils/dateUtils');

const DEFAULT_VELOCITY_WINDOW_DAYS = 14;
// Fallback pace (tasks/day) used only when there isn't enough history yet.
const FALLBACK_DAILY_TASK_PACE = 1;

function addDays(value, days) {
  const base = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Computes the user's task-completion velocity (0-1) over the trailing
 * `windowDays` window (default 14) that ends the day before `referenceDateStr`.
 * Only fully-elapsed days are counted so an in-progress "today" doesn't
 * unfairly drag the pace down.
 */
function calculateVelocity({ dailyGoals = [], referenceDateStr, windowDays = DEFAULT_VELOCITY_WINDOW_DAYS }) {
  const today = toDateOnlyString(referenceDateStr);
  if (!today) return { tasksCompleted: 0, tasksScheduled: 0, velocity: null };

  const windowStart = toDateOnlyString(addDays(today, -windowDays));

  let tasksCompleted = 0;
  let tasksScheduled = 0;

  (dailyGoals || []).forEach((goal) => {
    const goalDate = toDateOnlyString(goal?.date);
    if (!goalDate || goalDate < windowStart || goalDate >= today) return;
    (goal.tasks || []).forEach((task) => {
      tasksScheduled += 1;
      if (task.completed) tasksCompleted += 1;
    });
  });

  const velocity = tasksScheduled > 0 ? tasksCompleted / tasksScheduled : null;
  return { tasksCompleted, tasksScheduled, velocity };
}

/**
 * Blends raw task-completion velocity with recent quiz accuracy (both 0-1)
 * so a student who checks off tasks without actually retaining the material
 * isn't shown a falsely optimistic pace. Either signal may be missing.
 */
function combineVelocitySignals({ taskVelocity, quizAccuracy, taskWeight = 0.7 }) {
  const hasTask = typeof taskVelocity === 'number' && !Number.isNaN(taskVelocity);
  const hasQuiz = typeof quizAccuracy === 'number' && !Number.isNaN(quizAccuracy);

  if (!hasTask && !hasQuiz) return null;
  if (!hasQuiz) return taskVelocity;
  if (!hasTask) return quizAccuracy;

  const w = Math.min(Math.max(taskWeight, 0), 1);
  return taskVelocity * w + quizAccuracy * (1 - w);
}

/**
 * Projects the calendar date by which all remaining (incomplete) syllabus
 * tasks will be finished, given the current pace (`velocity`, 0-1).
 */
function predictCompletionDate({ dailyGoals = [], referenceDateStr, velocity }) {
  const today = toDateOnlyString(referenceDateStr);
  if (!today) return null;

  const pendingTaskCount = (dailyGoals || []).reduce(
    (sum, goal) => sum + (goal?.tasks || []).filter((t) => !t.completed).length,
    0
  );

  if (pendingTaskCount === 0) return today;

  const scheduledDays = (dailyGoals || []).filter((g) => (g?.tasks || []).length > 0).length;
  const totalScheduledTasks = (dailyGoals || []).reduce((sum, g) => sum + (g?.tasks || []).length, 0);
  const avgTasksPerDay = scheduledDays > 0 ? totalScheduledTasks / scheduledDays : FALLBACK_DAILY_TASK_PACE;

  const tasksPerDay =
    velocity === null || velocity === undefined
      ? Math.max(avgTasksPerDay, FALLBACK_DAILY_TASK_PACE)
      : Math.max(velocity * avgTasksPerDay, 0.1);

  const daysNeeded = Math.ceil(pendingTaskCount / tasksPerDay);
  return toDateOnlyString(addDays(today, daysNeeded));
}

/** True when the projected completion date falls after the exam date. */
function isAtRisk({ projectedCompletionDate, examDateStr }) {
  const projected = toDateOnlyString(projectedCompletionDate);
  const exam = toDateOnlyString(examDateStr);
  if (!projected || !exam) return false;
  return projected > exam;
}

/**
 * Convenience wrapper that combines velocity + prediction + risk flag into
 * a single forecast object suitable for API responses.
 */
function getCompletionForecast({
  dailyGoals = [],
  referenceDateStr,
  examDateStr,
  quizAccuracy = null,
  windowDays = DEFAULT_VELOCITY_WINDOW_DAYS,
}) {
  const { tasksCompleted, tasksScheduled, velocity: taskVelocity } = calculateVelocity({
    dailyGoals,
    referenceDateStr,
    windowDays,
  });
  const velocity = combineVelocitySignals({ taskVelocity, quizAccuracy });
  const projectedCompletionDate = predictCompletionDate({ dailyGoals, referenceDateStr, velocity });
  const atRisk = isAtRisk({ projectedCompletionDate, examDateStr });

  return {
    tasksCompletedLast14Days: tasksCompleted,
    tasksScheduledLast14Days: tasksScheduled,
    velocity,
    projectedCompletionDate,
    examDate: toDateOnlyString(examDateStr) || null,
    atRisk,
  };
}

/**
 * Pulls every incomplete task out of the plan and redistributes them evenly
 * (round-robin) across the calendar days remaining until the exam. Because
 * each pending task is placed on exactly one day, tasks never overlap.
 * Completed tasks are left untouched on their original date.
 */
function rebalanceScheduleEvenly({ dailyGoals = [], referenceDateStr, examDateStr }) {
  const today = toDateOnlyString(referenceDateStr);
  const examDate = toDateOnlyString(examDateStr);

  // Edge case: exam date missing/invalid or already in the past — no days left to rebalance into.
  if (!today || !examDate || examDate < today) {
    return { dailyGoals, remainingDays: 0, pendingTaskCount: 0, rebalanced: false, reason: 'NO_DAYS_REMAINING' };
  }

  const remainingDates = [];
  let cursor = new Date(`${today}T00:00:00`);
  const end = new Date(`${examDate}T00:00:00`);
  while (cursor <= end) {
    remainingDates.push(toDateOnlyString(cursor));
    cursor = addDays(cursor, 1);
  }

  const goalsByDate = {};
  const pendingTasks = [];

  (dailyGoals || []).forEach((goal) => {
    const goalDate = toDateOnlyString(goal?.date);
    const completedTasks = (goal?.tasks || []).filter((t) => t.completed);
    const incompleteTasks = (goal?.tasks || []).filter((t) => !t.completed);

    incompleteTasks.forEach((t) => pendingTasks.push(t));

    // Keep completed tasks visible on their original date, even if overdue.
    if (completedTasks.length > 0 && goalDate) {
      goalsByDate[goalDate] = { date: goalDate, tasks: [...completedTasks] };
    }
  });

  // Edge case: nothing pending — schedule (or the filtered set) is already clear.
  if (pendingTasks.length === 0) {
    return {
      dailyGoals,
      remainingDays: remainingDates.length,
      pendingTaskCount: 0,
      rebalanced: false,
      reason: 'NO_PENDING_TASKS',
    };
  }

  remainingDates.forEach((date) => {
    if (!goalsByDate[date]) goalsByDate[date] = { date, tasks: [] };
  });

  pendingTasks.forEach((task, idx) => {
    const targetDate = remainingDates[idx % remainingDates.length];
    goalsByDate[targetDate].tasks.push({ ...task });
  });

  const rebalancedGoals = Object.keys(goalsByDate)
    .sort()
    .map((date) => goalsByDate[date]);

  return {
    dailyGoals: rebalancedGoals,
    remainingDays: remainingDates.length,
    pendingTaskCount: pendingTasks.length,
    rebalanced: true,
    reason: null,
  };
}

module.exports = {
  DEFAULT_VELOCITY_WINDOW_DAYS,
  calculateVelocity,
  combineVelocitySignals,
  predictCompletionDate,
  isAtRisk,
  getCompletionForecast,
  rebalanceScheduleEvenly,
};