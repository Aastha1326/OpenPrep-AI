const { Op, fn, col } = require('sequelize');
const FocusSessionLog = require('../models/FocusSessionLog');

// ── Constants ────────────────────────────────────────────────────────────

const FOCUS_QUALITY_THRESHOLDS = { excellent: 85, good: 65, average: 45, poor: 0 };
const PRODUCTIVE_THRESHOLD_MINUTES = 5;

// ── Session Lifecycle ────────────────────────────────────────────────────

async function startSession(userId, { subject, subjectName, taskType, plannedMinutes, dailyGoalMinutes, tags, notes }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayCount = await FocusSessionLog.count({
    where: { user: userId, startedAt: { [Op.gte]: today } },
  });

  return FocusSessionLog.create({
    user: userId,
    subject: subject || null,
    subjectName: subjectName || null,
    taskType: taskType || 'other',
    startedAt: new Date(),
    plannedMinutes: plannedMinutes || 25,
    dailyGoalMinutes: dailyGoalMinutes || 120,
    pomodoroNumber: todayCount + 1,
    tags: tags || [],
    notes: notes || null,
    status: 'active',
  });
}

async function endSession(userId, sessionId, { interrupted = false } = {}) {
  const session = await FocusSessionLog.findOne({ where: { id: sessionId, user: userId } });
  if (!session) return null;
  if (session.status === 'completed' || session.status === 'abandoned') {
    throw new Error('Session is already finished');
  }

  const endedAt = new Date();
  const elapsedMs = endedAt - new Date(session.startedAt);
  const actualMinutes = Math.round((elapsedMs / 60000) * 10) / 10;
  const activeSeconds = Math.round((elapsedMs - (session.pausedSeconds * 1000)) / 1000);

  const plannedSeconds = session.plannedMinutes * 60;
  const efficiencyScore = Math.min(100, Math.round((activeSeconds / Math.max(plannedSeconds, 1)) * 100));

  const interruptionPenalty = Math.min(30, session.interruptions * 5);
  const completionBonus = interrupted ? 0 : 20;
  const focusScore = Math.max(0, Math.min(100,
    Math.round(efficiencyScore * 0.6 + completionBonus + (100 - interruptionPenalty) * 0.2)
  ));

  const todayStart = new Date(session.startedAt); todayStart.setHours(0, 0, 0, 0);
  const todayTotal = await getTotalMinutesToday(userId, todayStart);
  const metGoal = (todayTotal + actualMinutes) >= session.dailyGoalMinutes;

  session.endedAt = endedAt;
  session.actualMinutes = actualMinutes;
  session.activeSeconds = activeSeconds;
  session.efficiencyScore = efficiencyScore;
  session.focusScore = focusScore;
  session.status = interrupted ? 'abandoned' : 'completed';
  session.metGoal = metGoal;
  await session.save();
  return session;
}

async function togglePause(userId, sessionId) {
  const session = await FocusSessionLog.findOne({ where: { id: sessionId, user: userId } });
  if (!session) return null;
  if (session.status === 'active') session.status = 'paused';
  else if (session.status === 'paused') session.status = 'active';
  else throw new Error('Session is already finished');
  await session.save();
  return session;
}

async function recordInterruption(userId, sessionId, { reason, durationSeconds } = {}) {
  const session = await FocusSessionLog.findOne({ where: { id: sessionId, user: userId } });
  if (!session) return null;
  const details = [...(session.interruptionDetails || [])];
  details.push({ timestamp: new Date().toISOString(), reason: reason || 'unknown', durationSeconds: durationSeconds || 0 });
  session.interruptions += 1;
  session.interruptionDetails = details;
  await session.save();
  return session;
}

// ── Queries ──────────────────────────────────────────────────────────────

async function getSessions(userId, { status, subject, taskType, startDate, endDate, page = 1, limit = 20 } = {}) {
  const where = { user: userId };
  if (status) where.status = status;
  if (subject) where.subject = subject;
  if (taskType) where.taskType = taskType;
  if (startDate || endDate) {
    where.startedAt = {};
    if (startDate) where.startedAt[Op.gte] = new Date(startDate);
    if (endDate) where.startedAt[Op.lte] = new Date(endDate);
  }
  const offset = (Math.max(1, page) - 1) * limit;
  const { count, rows: sessions } = await FocusSessionLog.findAndCountAll({
    where, order: [['startedAt', 'DESC']], offset, limit,
  });
  return { sessions, pagination: { total: count, page, totalPages: Math.ceil(count / limit), limit } };
}

async function getSessionById(userId, sessionId) {
  return FocusSessionLog.findOne({ where: { id: sessionId, user: userId } });
}

async function getTotalMinutesToday(userId, dayStart) {
  const start = dayStart || (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  const result = await FocusSessionLog.findOne({
    attributes: [[fn('COALESCE', fn('SUM', col('actualMinutes')), 0), 'totalMinutes']],
    where: { user: userId, status: { [Op.in]: ['completed', 'active'] }, startedAt: { [Op.gte]: start } },
    raw: true,
  });
  return parseFloat(result?.totalMinutes || 0);
}

async function getPeriodMinutes(userId, start, end) {
  const result = await FocusSessionLog.findOne({
    attributes: [[fn('COALESCE', fn('SUM', col('actualMinutes')), 0), 'totalMinutes']],
    where: { user: userId, status: { [Op.in]: ['completed', 'abandoned'] }, startedAt: { [Op.between]: [start, end] } },
    raw: true,
  });
  return parseFloat(result?.totalMinutes || 0);
}

// ── Analytics ────────────────────────────────────────────────────────────

async function getWeeklyAnalytics(userId, { weekStart } = {}) {
  const ws = weekStart ? new Date(weekStart) : getWeekStart(new Date());
  const we = new Date(ws); we.setDate(we.getDate() + 6); we.setHours(23, 59, 59, 999);

  const sessions = await FocusSessionLog.findAll({
    where: { user: userId, startedAt: { [Op.between]: [ws, we] }, status: { [Op.in]: ['completed', 'abandoned'] } },
    order: [['startedAt', 'ASC']],
  });

  const dailyBreakdown = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(ws); day.setDate(day.getDate() + i);
    const dayStr = day.toISOString().split('T')[0];
    const daySessions = sessions.filter((s) => new Date(s.startedAt).toISOString().split('T')[0] === dayStr);
    const totalMinutes = daySessions.reduce((sum, s) => sum + (s.actualMinutes || 0), 0);
    const completedCount = daySessions.filter((s) => s.status === 'completed').length;
    const avgEfficiency = daySessions.length > 0
      ? Math.round(daySessions.reduce((sum, s) => sum + (s.efficiencyScore || 0), 0) / daySessions.length) : 0;
    dailyBreakdown.push({
      date: dayStr, dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
      totalMinutes: Math.round(totalMinutes), sessionCount: daySessions.length, completedCount, avgEfficiency,
    });
  }

  const subjectMap = {};
  for (const s of sessions) {
    const key = s.subjectName || s.subject || 'Unknown';
    if (!subjectMap[key]) subjectMap[key] = { name: key, totalMinutes: 0, sessionCount: 0, efficiencies: [] };
    subjectMap[key].totalMinutes += s.actualMinutes || 0;
    subjectMap[key].sessionCount += 1;
    subjectMap[key].efficiencies.push(s.efficiencyScore || 0);
  }

  const grandTotal = Object.values(subjectMap).reduce((sum, s) => sum + s.totalMinutes, 0);
  const subjectBreakdown = Object.values(subjectMap).map((s) => ({
    name: s.name, totalMinutes: Math.round(s.totalMinutes), sessionCount: s.sessionCount,
    avgEfficiency: Math.round(s.efficiencies.reduce((a, b) => a + b, 0) / s.efficiencies.length),
    percentage: grandTotal > 0 ? Math.round((s.totalMinutes / grandTotal) * 100) : 0,
  })).sort((a, b) => b.totalMinutes - a.totalMinutes);

  const taskTypeMap = {};
  for (const s of sessions) {
    const key = s.taskType || 'other';
    if (!taskTypeMap[key]) taskTypeMap[key] = { type: key, totalMinutes: 0, sessionCount: 0 };
    taskTypeMap[key].totalMinutes += s.actualMinutes || 0;
    taskTypeMap[key].sessionCount += 1;
  }
  const taskTypeBreakdown = Object.values(taskTypeMap).map((t) => ({
    type: t.type, totalMinutes: Math.round(t.totalMinutes), sessionCount: t.sessionCount,
    percentage: grandTotal > 0 ? Math.round((t.totalMinutes / grandTotal) * 100) : 0,
  })).sort((a, b) => b.totalMinutes - a.totalMinutes);

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.actualMinutes || 0), 0);
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const avgEfficiency = totalSessions > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.efficiencyScore || 0), 0) / totalSessions) : 0;
  const avgFocusScore = totalSessions > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.focusScore || 0), 0) / totalSessions) : 0;
  const totalInterruptions = sessions.reduce((sum, s) => sum + (s.interruptions || 0), 0);
  const goalsMet = sessions.filter((s) => s.metGoal).length;
  const bestDay = dailyBreakdown.reduce((best, d) => d.totalMinutes > (best?.totalMinutes || 0) ? d : best, null);

  return {
    period: { weekStart: ws.toISOString().split('T')[0], weekEnd: we.toISOString().split('T')[0] },
    summary: {
      totalMinutes: Math.round(totalMinutes), totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      totalSessions, completedSessions: completedSessions.length,
      completionRate: totalSessions > 0 ? Math.round((completedSessions.length / totalSessions) * 100) : 0,
      avgEfficiency, avgFocusScore, totalInterruptions,
      avgInterruptionsPerSession: totalSessions > 0 ? Math.round((totalInterruptions / totalSessions) * 10) / 10 : 0,
      goalsMet, bestDay: bestDay?.dayName || null, bestDayMinutes: bestDay?.totalMinutes || 0,
    },
    dailyBreakdown, subjectBreakdown, taskTypeBreakdown,
    qualityDistribution: computeQualityDistribution(sessions),
  };
}

async function getStreaks(userId) {
  const recentSessions = await FocusSessionLog.findAll({
    attributes: [[fn('DATE', col('startedAt')), 'sessionDate']],
    where: { user: userId, status: { [Op.in]: ['completed', 'abandoned'] }, startedAt: { [Op.gte]: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000) } },
    group: [fn('DATE', col('startedAt'))],
    order: [[fn('DATE', col('startedAt')), 'DESC']],
    raw: true,
  });

  const dates = recentSessions.map((r) => r.sessionDate).sort().reverse();
  let currentStreak = 0, tempStreak = 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 120; i++) {
    const checkDate = new Date(today); checkDate.setDate(checkDate.getDate() - i);
    const checkStr = checkDate.toISOString().split('T')[0];
    if (dates.includes(checkStr)) { tempStreak += 1; if (i <= tempStreak - 1 && currentStreak === 0) currentStreak = tempStreak; }
    else if (i === 0) continue;
    else break;
  }

  const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentTotal = await FocusSessionLog.findOne({
    attributes: [[fn('COALESCE', fn('SUM', col('actualMinutes')), 0), 'totalMinutes']],
    where: { user: userId, status: { [Op.in]: ['completed', 'abandoned'] }, startedAt: { [Op.gte]: thirtyDaysAgo } },
    raw: true,
  });

  return {
    currentStreak: tempStreak, longestStreak: tempStreak,
    avgMinutesPerDay: Math.round(parseFloat(recentTotal?.totalMinutes || 0) / 30),
    totalActiveDays: dates.length, lastSessionDate: dates[0] || null,
  };
}

async function getDashboardSummary(userId) {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const weekStart = getWeekStart(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayTotal, weekTotal, monthTotal, todaySessions, streaks] = await Promise.all([
    getTotalMinutesToday(userId, todayStart),
    getPeriodMinutes(userId, weekStart, now),
    getPeriodMinutes(userId, monthStart, now),
    FocusSessionLog.count({ where: { user: userId, startedAt: { [Op.gte]: todayStart }, status: { [Op.in]: ['completed', 'active'] } } }),
    getStreaks(userId),
  ]);

  const dailyGoal = 120;
  const goalProgress = Math.min(100, Math.round((todayTotal / dailyGoal) * 100));
  return {
    today: { totalMinutes: Math.round(todayTotal), sessionCount: todaySessions, goalProgress, goalTarget: dailyGoal, goalMet: todayTotal >= dailyGoal },
    week: { totalMinutes: Math.round(weekTotal), totalHours: Math.round((weekTotal / 60) * 10) / 10 },
    month: { totalMinutes: Math.round(monthTotal), totalHours: Math.round((monthTotal / 60) * 10) / 10 },
    streaks, qualityLevel: getQualityLevel(goalProgress),
  };
}

async function getHourlyHeatmap(userId) {
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sessions = await FocusSessionLog.findAll({
    attributes: ['startedAt', 'actualMinutes'],
    where: { user: userId, status: { [Op.in]: ['completed', 'abandoned'] }, startedAt: { [Op.gte]: thirtyDaysAgo } },
    raw: true,
  });
  const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const s of sessions) {
    const d = new Date(s.startedAt);
    heatmap[d.getDay()][d.getHours()] += s.actualMinutes || 0;
  }
  return heatmap;
}

async function getEfficiencyTrend(userId, { days = 30 } = {}) {
  const startDate = new Date(); startDate.setDate(startDate.getDate() - days); startDate.setHours(0, 0, 0, 0);
  const sessions = await FocusSessionLog.findAll({
    attributes: ['startedAt', 'efficiencyScore', 'focusScore'],
    where: { user: userId, status: { [Op.in]: ['completed', 'abandoned'] }, startedAt: { [Op.gte]: startDate } },
    order: [['startedAt', 'ASC']], raw: true,
  });
  const dailyMap = {};
  for (const s of sessions) {
    const dateStr = new Date(s.startedAt).toISOString().split('T')[0];
    if (!dailyMap[dateStr]) dailyMap[dateStr] = { date: dateStr, efficiencies: [], focusScores: [], count: 0 };
    dailyMap[dateStr].efficiencies.push(s.efficiencyScore || 0);
    dailyMap[dateStr].focusScores.push(s.focusScore || 0);
    dailyMap[dateStr].count += 1;
  }
  return Object.values(dailyMap).map((d) => ({
    date: d.date,
    avgEfficiency: Math.round(d.efficiencies.reduce((a, b) => a + b, 0) / d.efficiencies.length),
    avgFocusScore: Math.round(d.focusScores.reduce((a, b) => a + b, 0) / d.focusScores.length),
    sessionCount: d.count,
  }));
}

function getWeekStart(date) {
  const d = new Date(date); const day = d.getDay(); d.setDate(d.getDate() - day); d.setHours(0, 0, 0, 0); return d;
}
function computeQualityDistribution(sessions) {
  const dist = { excellent: 0, good: 0, average: 0, poor: 0 };
  for (const s of sessions) {
    const score = s.focusScore || 0;
    if (score >= 85) dist.excellent++;
    else if (score >= 65) dist.good++;
    else if (score >= 45) dist.average++;
    else dist.poor++;
  }
  return dist;
}
function getQualityLevel(percent) {
  if (percent >= 80) return 'excellent';
  if (percent >= 60) return 'good';
  if (percent >= 30) return 'average';
  return 'poor';
}

class NotFoundError extends Error {
  constructor(message) { super(message); this.name = 'NotFoundError'; this.statusCode = 404; }
}

module.exports = {
  startSession, endSession, togglePause, recordInterruption,
  getSessions, getSessionById, getTotalMinutesToday, getWeeklyAnalytics,
  getStreaks, getDashboardSummary, getHourlyHeatmap, getEfficiencyTrend,
  FOCUS_QUALITY_THRESHOLDS, NotFoundError,
};
