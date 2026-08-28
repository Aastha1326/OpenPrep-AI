const { Op, fn, col } = require('sequelize');
const { sequelize } = require('../config/db');
const StudyStreak = require('../models/StudyStreak');
const User = require('../models/User');

/** Get today's date as YYYY-MM-DD string. */
const todayStr = () => new Date().toISOString().split('T')[0];

/** Date N days ago as YYYY-MM-DD. */
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; };

/** Record or update today's study activity. */
async function recordActivity(userId, data) {
  const date = data.date || todayStr();
  const [record, created] = await StudyStreak.findOrCreate({
    where: { user: userId, date },
    defaults: {
      active: true,
      studyMinutes: data.studyMinutes || 0,
      quizzesTaken: data.quizzesTaken || 0,
      topicsReviewed: data.topicsReviewed || 0,
      flashcardsReviewed: data.flashcardsReviewed || 0,
      xpEarned: data.xpEarned || 0,
      sessionCount: data.sessionCount || 1,
    },
  });
  if (!created) {
    record.active = true;
    record.studyMinutes += data.studyMinutes || 0;
    record.quizzesTaken += data.quizzesTaken || 0;
    record.topicsReviewed += data.topicsReviewed || 0;
    record.flashcardsReviewed += data.flashcardsReviewed || 0;
    record.xpEarned += data.xpEarned || 0;
    record.sessionCount += data.sessionCount || 0;
    await record.save();
  }
  // Update streak day counter
  await recomputeStreakDays(userId);
  return record;
}

/** Recompute streakDay for all recent records. */
async function recomputeStreakDays(userId) {
  const records = await StudyStreak.findAll({
    where: { user: userId },
    order: [['date', 'DESC']],
    limit: 365,
  });
  let streak = 0;
  const today = todayStr();
  // Walk backwards from today
  for (let i = 0; i < 365; i++) {
    const d = daysAgo(i);
    const rec = records.find((r) => r.date === d);
    if (rec && rec.active) {
      streak++;
      if (rec.streakDay !== streak) { rec.streakDay = streak; await rec.save(); }
    } else if (i === 0) {
      // Today not yet active — don't break streak yet
      continue;
    } else {
      break;
    }
  }
}

/** Get the current active streak length. */
async function getCurrentStreak(userId) {
  const records = await StudyStreak.findAll({
    where: { user: userId, active: true },
    order: [['date', 'DESC']],
    limit: 400,
  });
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = daysAgo(i);
    const rec = records.find((r) => r.date === d);
    if (rec) { streak++; }
    else if (i === 0) { continue; } // today might not be recorded yet
    else { break; }
  }
  return streak;
}

/** Get the longest streak ever. */
async function getLongestStreak(userId) {
  const result = await StudyStreak.max('streakDay', { where: { user: userId } });
  return result || 0;
}

/** Get calendar heatmap data for last N days. */
async function getHeatmapData(userId, days = 90) {
  const start = daysAgo(days);
  const records = await StudyStreak.findAll({
    where: { user: userId, date: { [Op.gte]: start } },
    order: [['date', 'ASC']],
  });
  const map = {};
  records.forEach((r) => { map[r.date] = r; });
  const data = [];
  for (let i = days; i >= 0; i--) {
    const d = daysAgo(i);
    const rec = map[d];
    data.push({
      date: d,
      active: rec?.active || false,
      studyMinutes: rec?.studyMinutes || 0,
      intensity: rec ? Math.min(1, (rec.studyMinutes || 0) / 180) : 0, // 0-1 scale, 180min = full
    });
  }
  return data;
}

/** Get weekly summary stats for last N weeks. */
async function getWeeklySummary(userId, weeks = 12) {
  const start = daysAgo(weeks * 7);
  const records = await StudyStreak.findAll({
    where: { user: userId, date: { [Op.gte]: start } },
    order: [['date', 'ASC']],
  });
  const weeklyData = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
    const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekRecords = records.filter((r) => {
      const d = new Date(r.date);
      return d >= weekStart && d < weekEnd;
    });
    const activeDays = weekRecords.filter((r) => r.active).length;
    const totalMinutes = weekRecords.reduce((s, r) => s + r.studyMinutes, 0);
    const totalQuizzes = weekRecords.reduce((s, r) => s + r.quizzesTaken, 0);
    weeklyData.push({
      weekLabel: weekEnd.toISOString().split('T')[0],
      activeDays,
      consistencyPct: Math.round((activeDays / 7) * 100),
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      totalQuizzes,
    });
  }
  return weeklyData;
}

/** Get full streak stats for a user. */
async function getStreakStats(userId) {
  const current = await getCurrentStreak(userId);
  const longest = await getLongestStreak(userId);
  const totalDays = await StudyStreak.count({ where: { user: userId, active: true } });
  const totalMinutes = (await StudyStreak.sum('studyMinutes', { where: { user: userId } })) || 0;
  const totalQuizzes = (await StudyStreak.sum('quizzesTaken', { where: { user: userId } })) || 0;
  // Average study minutes per active day
  const avgMinutes = totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0;
  // Best day
  const bestDay = await StudyStreak.findOne({ where: { user: userId }, order: [['studyMinutes', 'DESC']] });
  // This week stats
  const weekStart = daysAgo(7);
  const thisWeek = await StudyStreak.findAll({ where: { user: userId, date: { [Op.gte]: weekStart } } });
  const thisWeekActive = thisWeek.filter((r) => r.active).length;
  const thisWeekMinutes = thisWeek.reduce((s, r) => s + r.studyMinutes, 0);

  return {
    currentStreak: current,
    longestStreak: longest,
    totalActiveDays: totalDays,
    totalStudyHours: Math.round(totalMinutes / 60 * 10) / 10,
    totalQuizzes,
    avgMinutesPerDay: avgMinutes,
    bestDay: bestDay ? { date: bestDay.date, minutes: bestDay.studyMinutes } : null,
    thisWeek: { activeDays: thisWeekActive, totalMinutes: thisWeekMinutes, totalHours: Math.round(thisWeekMinutes / 60 * 10) / 10 },
  };
}

/** Predict streak continuation probability based on recent consistency. */
async function getStreakPrediction(userId) {
  const stats = await getStreakStats(userId);
  const recent = await StudyStreak.findAll({
    where: { user: userId },
    order: [['date', 'DESC']],
    limit: 30,
  });
  const activeCount = recent.filter((r) => r.active).length;
  const recentConsistency = recent.length > 0 ? activeCount / Math.min(recent.length, 30) : 0;
  // Simple prediction: probability of maintaining streak next 7 days
  const prob7Days = Math.min(100, Math.round(recentConsistency * 100 * (stats.currentStreak > 0 ? 0.9 : 0.5)));
  const prob30Days = Math.min(100, Math.round(prob7Days * 0.6));

  let recommendation = '';
  if (recentConsistency >= 0.85) recommendation = 'Excellent consistency! You\'re in the top tier. Keep it up!';
  else if (recentConsistency >= 0.6) recommendation = 'Good rhythm. Try to study a bit more on your off days to push higher.';
  else if (recentConsistency >= 0.3) recommendation = 'Your streak is at risk. Set a daily reminder and commit to at least 15 minutes.';
  else recommendation = 'Start small — even 10 minutes a day builds a streak. Consistency beats intensity.';

  return {
    currentStreak: stats.currentStreak,
    recentConsistency: Math.round(recentConsistency * 100),
    predictedMaintain7Days: prob7Days,
    predictedMaintain30Days: prob30Days,
    recommendation,
  };
}

module.exports = { recordActivity, getCurrentStreak, getLongestStreak, getHeatmapData, getWeeklySummary, getStreakStats, getStreakPrediction, todayStr, daysAgo };
