/**
 * @fileoverview Service layer for the Study Habit Tracker & Streak Calendar.
 * Manages habit definitions, daily completion logs, streak calculation,
 * calendar heatmap data generation, and weekly habit summaries.
 */
const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/db');
const StudyHabit = require('../models/StudyHabit');
const HabitLog = require('../models/HabitLog');
const HabitStreak = require('../models/HabitStreak');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRACE_PERIOD_HOURS = 28; // Allow logging up to 28h after midnight
const MAX_CALENDAR_MONTHS = 12; // Maximum months of heatmap data
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// ---------------------------------------------------------------------------
// Habit CRUD
// ---------------------------------------------------------------------------

/**
 * Create a new trackable habit for a user.
 */
async function createHabit(userId, habitData) {
  const {
    name,
    description,
    iconEmoji,
    color,
    category,
    frequency,
    specificDays,
    targetMinutes,
    targetCount,
    reminderTime,
    sortOrder,
    metadata,
  } = habitData;

  if (!name) {
    throw new Error('Habit name is required');
  }

  const habit = await StudyHabit.create({
    userId,
    name,
    description: description || '',
    iconEmoji: iconEmoji || '✅',
    color: color || '#4F46E5',
    category: category || 'custom',
    frequency: frequency || 'daily',
    specificDays: specificDays || [],
    targetMinutes: targetMinutes || null,
    targetCount: targetCount || 1,
    reminderTime: reminderTime || null,
    sortOrder: sortOrder || 0,
    metadata: metadata || {},
  });

  // Initialize the streak record
  await HabitStreak.create({
    userId,
    habitId: habit.id,
    currentStreak: 0,
    longestStreak: 0,
    totalCompletions: 0,
    totalSkips: 0,
    completionRate: 0,
  });

  return habit;
}

/**
 * Get a habit definition by ID (with ownership check).
 */
async function getHabitById(userId, habitId) {
  return StudyHabit.findOne({ where: { id: habitId, userId } });
}

/**
 * Get all habits for a user, optionally filtered.
 */
async function listHabits(userId, { category, isActive, includeArchived = false } = {}) {
  const where = { userId };
  if (category) where.category = category;
  if (isActive !== undefined) {
    where.isActive = isActive;
  } else if (!includeArchived) {
    where.isArchived = false;
  }

  return StudyHabit.findAll({
    where,
    order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']],
  });
}

/**
 * Update a habit definition.
 */
async function updateHabit(userId, habitId, updates) {
  const habit = await StudyHabit.findOne({ where: { id: habitId, userId } });
  if (!habit) return null;
  if (habit.isArchived) {
    throw new Error('Cannot modify an archived habit');
  }

  const allowed = [
    'name', 'description', 'iconEmoji', 'color', 'category',
    'frequency', 'specificDays', 'targetMinutes', 'targetCount',
    'reminderTime', 'isActive', 'sortOrder', 'metadata',
  ];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      habit[key] = updates[key];
    }
  }
  await habit.save();
  return habit;
}

/**
 * Archive a habit (soft-delete that preserves history).
 */
async function archiveHabit(userId, habitId) {
  const habit = await StudyHabit.findOne({ where: { id: habitId, userId } });
  if (!habit) return null;
  habit.isArchived = true;
  habit.archivedAt = new Date();
  habit.isActive = false;
  await habit.save();
  return habit;
}

/**
 * Permanently delete a habit and all its logs and streaks.
 */
async function deleteHabit(userId, habitId) {
  const habit = await StudyHabit.findOne({ where: { id: habitId, userId } });
  if (!habit) return null;
  await HabitLog.destroy({ where: { habitId: habit.id } });
  await HabitStreak.destroy({ where: { habitId: habit.id } });
  await habit.destroy();
  return true;
}

// ---------------------------------------------------------------------------
// Habit Logging
// ---------------------------------------------------------------------------

/**
 * Log a habit completion for a specific date. Creates or updates the
 * log entry and recalculates the streak.
 *
 * @param {string} userId
 * @param {string} habitId
 * @param {Object} logData
 * @param {string} logData.date - YYYY-MM-DD (defaults to today)
 * @param {number} logData.completionCount - Times completed (default 1)
 * @param {number} logData.durationMinutes - Time spent
 * @param {number} logData.qualityRating - 1-5 quality
 * @param {string} logData.note - Optional note
 * @param {string} logData.source - Origin of the entry
 * @param {string} logData.sourceId - Source entity ID
 */
async function logHabit(userId, habitId, logData = {}) {
  const habit = await StudyHabit.findOne({ where: { id: habitId, userId } });
  if (!habit) throw new Error('Habit not found');
  if (habit.isArchived) throw new Error('Cannot log to an archived habit');

  const date = logData.date || new Date().toISOString().split('T')[0];
  const completionCount = logData.completionCount || 1;

  // Upsert the log entry
  const [log, created] = await HabitLog.findOrCreate({
    where: { userId, habitId, date },
    defaults: {
      completed: true,
      completionCount,
      durationMinutes: logData.durationMinutes || null,
      qualityRating: logData.qualityRating || null,
      note: logData.note || null,
      source: logData.source || 'manual',
      sourceId: logData.sourceId || null,
      metadata: logData.metadata || {},
    },
  });

  if (!created) {
    // Update existing entry
    log.completionCount = (log.completionCount || 0) + completionCount;
    log.completed = log.completionCount >= (habit.targetCount || 1);
    if (logData.durationMinutes) {
      log.durationMinutes = (log.durationMinutes || 0) + logData.durationMinutes;
    }
    if (logData.qualityRating) {
      log.qualityRating = logData.qualityRating;
    }
    if (logData.note) {
      log.note = logData.note;
    }
    await log.save();
  }

  // Recalculate streak
  const streak = await recalculateStreak(userId, habitId);

  return { log, streak, created };
}

/**
 * Batch-log habits for multiple dates (useful for catch-up or import).
 */
async function batchLogHabits(userId, entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('entries must be a non-empty array');
  }
  if (entries.length > 100) {
    throw new Error('Maximum 100 entries per batch');
  }

  const results = [];
  const errors = [];

  for (const entry of entries) {
    try {
      const result = await logHabit(userId, entry.habitId, {
        date: entry.date,
        completionCount: entry.completionCount,
        durationMinutes: entry.durationMinutes,
        qualityRating: entry.qualityRating,
        note: entry.note,
        source: entry.source || 'batch',
        sourceId: entry.sourceId,
      });
      results.push({ habitId: entry.habitId, date: entry.date, status: 'success' });
    } catch (err) {
      errors.push({ habitId: entry.habitId, date: entry.date, error: err.message });
    }
  }

  return { results, errors };
}

/**
 * Get all logs for a user within a date range.
 */
async function getLogsForRange(userId, startDate, endDate, { habitId } = {}) {
  const where = {
    userId,
    date: { [Op.between]: [startDate, endDate] },
  };
  if (habitId) where.habitId = habitId;

  return HabitLog.findAll({
    where,
    include: [
      {
        model: StudyHabit,
        as: 'habitRef',
        attributes: ['id', 'name', 'iconEmoji', 'color', 'category'],
      },
    ],
    order: [['date', 'ASC']],
  });
}

// ---------------------------------------------------------------------------
// Streak Calculation
// ---------------------------------------------------------------------------

/**
 * Recalculate the streak for a habit based on its log history.
 * This is the core streak algorithm that walks backward from today
 * (or the last completed date) counting qualifying days.
 */
async function recalculateStreak(userId, habitId) {
  const habit = await StudyHabit.findByPk(habitId);
  if (!habit) return null;

  const streak = await HabitStreak.findOne({ where: { userId, habitId } });
  if (!streak) return null;

  // Get all completed dates for this habit, ordered most recent first
  const logs = await HabitLog.findAll({
    where: { userId, habitId, completed: true },
    attributes: ['date'],
    order: [['date', 'DESC']],
  });

  if (logs.length === 0) {
    streak.currentStreak = 0;
    streak.totalCompletions = 0;
    streak.lastCompletedDate = null;
    streak.lastStreakStartDate = null;
    streak.lastEvaluatedAt = new Date();
    await streak.save();
    return streak;
  }

  const completedDates = logs.map((l) => l.date).sort().reverse();
  const totalCompletions = completedDates.length;
  streak.totalCompletions = totalCompletions;
  streak.lastCompletedDate = completedDates[0];

  // Calculate current streak by walking backward from the most recent date
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split('T')[0];

  let currentStreak = 0;
  let streakStartDate = completedDates[0];

  // The streak must include today or yesterday to be "active"
  if (completedDates[0] !== today && completedDates[0] !== yesterday) {
    currentStreak = 0;
  } else {
    const dateSet = new Set(completedDates);
    let checkDate = new Date(completedDates[0]);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dateSet.has(dateStr)) {
        currentStreak++;
        streakStartDate = dateStr;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  streak.currentStreak = currentStreak;
  streak.lastStreakStartDate = streakStartDate;

  if (currentStreak > streak.longestStreak) {
    streak.longestStreak = currentStreak;
  }

  // Calculate total skips (days between first log and today that aren't completed)
  const firstLogDate = completedDates[completedDates.length - 1];
  const daysSinceFirst = Math.floor(
    (new Date(today) - new Date(firstLogDate)) / 86400000
  ) + 1;
  streak.totalSkips = Math.max(0, daysSinceFirst - totalCompletions);
  streak.completionRate =
    daysSinceFirst > 0
      ? Math.round((totalCompletions / daysSinceFirst) * 100 * 10) / 10
      : 0;

  streak.lastEvaluatedAt = new Date();
  await streak.save();
  return streak;
}

/**
 * Recalculate streaks for ALL active habits of a user.
 */
async function recalculateAllStreaks(userId) {
  const habits = await StudyHabit.findAll({
    where: { userId, isActive: true, isArchived: false },
  });

  const streaks = [];
  for (const habit of habits) {
    const streak = await recalculateStreak(userId, habit.id);
    if (streak) streaks.push(streak);
  }
  return streaks;
}

// ---------------------------------------------------------------------------
// Calendar Heatmap Data
// ---------------------------------------------------------------------------

/**
 * Generate calendar heatmap data for a user over a specified number of
 * months. Returns a dense map of date → completion data suitable for
 * rendering a GitHub-style contribution heatmap.
 *
 * @param {string} userId
 * @param {number} months - Number of months to include (default 6)
 * @returns {{ heatmap: Object, summary, habitBreakdown }}
 */
async function getCalendarHeatmap(userId, months = 6) {
  const clamped = Math.min(Math.max(1, months), MAX_CALENDAR_MONTHS);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - clamped);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  // Fetch all logs in range
  const logs = await HabitLog.findAll({
    where: {
      userId,
      date: { [Op.between]: [startStr, endStr] },
    },
    include: [
      {
        model: StudyHabit,
        as: 'habitRef',
        attributes: ['id', 'name', 'iconEmoji', 'color'],
      },
    ],
  });

  // Build heatmap
  const heatmap = {};
  const dayTotals = {};
  const habitCounts = {};

  for (const log of logs) {
    const date = log.date;
    if (!heatmap[date]) {
      heatmap[date] = {
        date,
        count: 0,
        durationMinutes: 0,
        habits: [],
        completedHabits: [],
      };
    }
    heatmap[date].count += log.completionCount || 1;
    heatmap[date].durationMinutes += log.durationMinutes || 0;
    heatmap[date].habits.push({
      habitId: log.habitId,
      name: log.habitRef?.name,
      icon: log.habitRef?.iconEmoji,
      count: log.completionCount,
    });
    if (log.completed) {
      heatmap[date].completedHabits.push(log.habitId);
    }

    // Day-of-week stats
    const dayOfWeek = new Date(date).getDay();
    const dayName = WEEKDAY_NAMES[dayOfWeek];
    dayTotals[dayName] = (dayTotals[dayName] || 0) + (log.completionCount || 1);

    // Per-habit counts
    const hName = log.habitRef?.name || 'Unknown';
    habitCounts[hName] = (habitCounts[hName] || 0) + (log.completionCount || 1);
  }

  // Calculate summary
  const totalDays = Object.keys(heatmap).length;
  const totalEntries = logs.length;
  const totalDuration = Object.values(heatmap).reduce(
    (sum, d) => sum + d.durationMinutes, 0
  );
  const totalCompletions = Object.values(heatmap).reduce(
    (sum, d) => sum + d.count, 0
  );

  // Find best day of week
  let bestDay = null;
  let bestDayCount = 0;
  for (const [day, count] of Object.entries(dayTotals)) {
    if (count > bestDayCount) {
      bestDay = day;
      bestDayCount = count;
    }
  }

  // Find most active habit
  let topHabit = null;
  let topHabitCount = 0;
  for (const [habit, count] of Object.entries(habitCounts)) {
    if (count > topHabitCount) {
      topHabit = habit;
      topHabitCount = count;
    }
  }

  return {
    heatmap,
    summary: {
      dateRange: { start: startStr, end: endStr },
      months: clamped,
      activeDays: totalDays,
      totalEntries,
      totalCompletions,
      totalDurationMinutes: totalDuration,
      averageDailyCompletions: totalDays > 0
        ? Math.round((totalCompletions / totalDays) * 10) / 10
        : 0,
      bestDayOfWeek: bestDay ? { name: bestDay, totalCompletions: bestDayCount } : null,
      topHabit: topHabit ? { name: topHabit, totalCompletions: topHabitCount } : null,
      dayOfWeekBreakdown: dayTotals,
    },
    habitBreakdown: Object.entries(habitCounts)
      .map(([name, count]) => ({ name, totalCompletions: count }))
      .sort((a, b) => b.totalCompletions - a.totalCompletions),
  };
}

// ---------------------------------------------------------------------------
// Weekly Summary
// ---------------------------------------------------------------------------

/**
 * Generate a weekly habit summary for the current week (or a specified week).
 *
 * @param {string} userId
 * @param {string} weekStart - YYYY-MM-DD (optional, defaults to this Monday)
 * @returns {{ week, habits, overallScore, streaks }}
 */
async function getWeeklySummary(userId, weekStart) {
  // Calculate week boundaries
  let start;
  if (weekStart) {
    start = new Date(weekStart);
  } else {
    start = new Date();
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
    start.setDate(diff);
  }
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  // Get all active habits
  const habits = await StudyHabit.findAll({
    where: { userId, isActive: true, isArchived: false },
    order: [['sortOrder', 'ASC']],
  });

  // Get all logs for the week
  const logs = await HabitLog.findAll({
    where: {
      userId,
      date: { [Op.between]: [startStr, endStr] },
    },
    order: [['date', 'ASC']],
  });

  // Build per-habit summaries
  const habitSummaries = [];
  let totalScore = 0;

  for (const habit of habits) {
    const habitLogs = logs.filter((l) => l.habitId === habit.id);
    const daysCompleted = new Set(
      habitLogs.filter((l) => l.completed).map((l) => l.date)
    ).size;
    const totalCount = habitLogs.reduce((sum, l) => sum + (l.completionCount || 1), 0);
    const totalDuration = habitLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

    // Calculate expected days
    let expectedDays = 7;
    if (habit.frequency === 'weekdays') expectedDays = 5;
    else if (habit.frequency === 'specific_days') {
      expectedDays = (habit.specificDays || []).length || 7;
    }

    const completionRate = expectedDays > 0
      ? Math.round((daysCompleted / expectedDays) * 100)
      : 0;

    totalScore += completionRate;

    // Daily breakdown for this habit
    const dailyBreakdown = [];
    const iterDate = new Date(start);
    for (let i = 0; i < 7; i++) {
      const dateStr = iterDate.toISOString().split('T')[0];
      const dayLog = habitLogs.find((l) => l.date === dateStr);
      dailyBreakdown.push({
        date: dateStr,
        day: WEEKDAY_NAMES[iterDate.getDay()],
        completed: dayLog ? dayLog.completed : false,
        count: dayLog ? dayLog.completionCount : 0,
        duration: dayLog ? dayLog.durationMinutes : 0,
      });
      iterDate.setDate(iterDate.getDate() + 1);
    }

    habitSummaries.push({
      habit,
      daysCompleted,
      expectedDays,
      completionRate,
      totalCount,
      totalDuration,
      dailyBreakdown,
    });
  }

  const overallScore =
    habitSummaries.length > 0
      ? Math.round(totalScore / habitSummaries.length)
      : 0;

  // Get current streaks
  const streaks = await HabitStreak.findAll({
    where: { userId },
    include: [
      {
        model: StudyHabit,
        as: 'habitRef',
        attributes: ['id', 'name', 'iconEmoji'],
      },
    ],
  });

  return {
    week: {
      start: startStr,
      end: endStr,
    },
    habits: habitSummaries,
    overallScore,
    totalHabitsTracked: habits.length,
    streaks: streaks.map((s) => ({
      habitId: s.habitId,
      habitName: s.habitRef?.name,
      icon: s.habitRef?.iconEmoji,
      currentStreak: s.currentStreak,
      longestStreak: s.longestStreak,
      totalCompletions: s.totalCompletions,
      completionRate: s.completionRate,
    })),
  };
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

/**
 * Get a combined dashboard view with today's habits, active streaks,
 * and a mini calendar heatmap.
 */
async function getDashboard(userId) {
  const today = new Date().toISOString().split('T')[0];

  const habits = await StudyHabit.findAll({
    where: { userId, isActive: true, isArchived: false },
    order: [['sortOrder', 'ASC']],
  });

  // Today's logs
  const todayLogs = await HabitLog.findAll({
    where: { userId, date: today },
  });
  const todayLogMap = {};
  for (const log of todayLogs) {
    todayLogMap[log.habitId] = log;
  }

  // All streaks
  const streaks = await HabitStreak.findAll({
    where: { userId },
    include: [
      {
        model: StudyHabit,
        as: 'habitRef',
        attributes: ['id', 'name', 'iconEmoji', 'color'],
      },
    ],
  });
  const streakMap = {};
  for (const s of streaks) {
    streakMap[s.habitId] = s;
  }

  // Today's summary
  const habitsWithToday = habits.map((h) => {
    const todayLog = todayLogMap[h.id];
    const streak = streakMap[h.id];
    return {
      habit: h,
      todayCompleted: todayLog ? todayLog.completed : false,
      todayCount: todayLog ? todayLog.completionCount : 0,
      todayDuration: todayLog ? todayLog.durationMinutes : 0,
      currentStreak: streak ? streak.currentStreak : 0,
      longestStreak: streak ? streak.longestStreak : 0,
    };
  });

  const completedToday = habitsWithToday.filter((h) => h.todayCompleted).length;
  const totalHabits = habits.length;
  const overallRate = totalHabits > 0
    ? Math.round((completedToday / totalHabits) * 100)
    : 0;

  // Mini heatmap (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const miniHeatmapStart = thirtyDaysAgo.toISOString().split('T')[0];

  const recentLogs = await HabitLog.findAll({
    where: {
      userId,
      date: { [Op.between]: [miniHeatmapStart, today] },
    },
  });

  const miniHeatmap = {};
  for (const log of recentLogs) {
    if (!miniHeatmap[log.date]) miniHeatmap[log.date] = 0;
    miniHeatmap[log.date] += log.completionCount || 1;
  }

  return {
    date: today,
    habits: habitsWithToday,
    todaySummary: {
      completed: completedToday,
      total: totalHabits,
      overallRate,
    },
    topStreaks: streaks
      .filter((s) => s.currentStreak > 0)
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, 5)
      .map((s) => ({
        habitId: s.habitId,
        name: s.habitRef?.name,
        icon: s.habitRef?.iconEmoji,
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
      })),
    miniHeatmap,
  };
}

module.exports = {
  // Habit CRUD
  createHabit,
  getHabitById,
  listHabits,
  updateHabit,
  archiveHabit,
  deleteHabit,

  // Logging
  logHabit,
  batchLogHabits,
  getLogsForRange,

  // Streaks
  recalculateStreak,
  recalculateAllStreaks,

  // Calendar
  getCalendarHeatmap,

  // Summary & Dashboard
  getWeeklySummary,
  getDashboard,

  // Expose constants for testing
  WEEKDAY_NAMES,
  MONTH_NAMES,
  GRACE_PERIOD_HOURS,
};
