const { Op, fn, col, literal } = require('sequelize');
const BreakRecommendation = require('../models/BreakRecommendation');
const FocusSessionLog = require('../models/FocusSessionLog');

// ── Constants ────────────────────────────────────────────────────────────

const COGNITIVE_LOAD_DECAY_RATE = 0.15;
const FATIGUE_ACCUMULATION_RATE = 12;
const RECOVERY_DECAY_PER_MINUTE = 2.5;
const MIN_BREAK_FOR_RECOVERY = 3;
const SPRINT_THRESHOLD = 20;
const MARATHON_THRESHOLD = 40;
const PEAK_HOUR_WINDOW = 2;

// ── Core Recommendation Engine ───────────────────────────────────────────

/**
 * Generate a personalized break recommendation based on the user's history.
 * Analyzes past focus sessions to compute optimal pomodoro/break durations.
 */
async function generateRecommendation(userId, { subject, taskType } = {}) {
  const profile = await computePersonalizedProfile(userId);
  const cognitiveState = await computeCognitiveLoad(userId);
  const fatigueIndex = await computeFatigueIndex(userId);

  // Determine learning style from historical patterns
  const learningStyle = classifyLearningStyle(profile);

  // Compute optimal intervals based on cognitive state
  const { pomodoroMinutes, breakMinutes, longBreakMinutes } = computeOptimalIntervals(
    profile, cognitiveState, fatigueIndex
  );

  // Calculate peak performance hour
  const peakHour = await detectPeakPerformanceHour(userId);

  const recommendation = await BreakRecommendation.create({
    user: userId,
    pomodoroLength: pomodoroMinutes,
    shortBreakMinutes: breakMinutes,
    longBreakMinutes: longBreakMinutes,
    longBreakInterval: profile.avgSessionsBeforeBreak || 4,
    cognitiveLoadScore: cognitiveState,
    fatigueIndex,
    recoveryRate: profile.avgRecoveryRate || 1.0,
    subject: subject || null,
    taskType: taskType || 'other',
    suggestedIntervalMinutes: pomodoroMinutes,
    optimalPomodoro: pomodoroMinutes,
    optimalBreak: breakMinutes,
    learningStyle,
    peakPerformanceHour: peakHour,
    status: 'active',
    metadata: {
      profileSnapshot: profile,
      generatedAt: new Date().toISOString(),
      algorithmVersion: '1.0',
    },
  });

  return recommendation;
}

/**
 * Record a break taken and compute its effectiveness.
 */
async function recordBreak(userId, recommendationId, { breakDurationMinutes, postBreakFocusScore }) {
  const rec = await BreakRecommendation.findOne({
    where: { id: recommendationId, user: userId },
  });
  if (!rec) return null;

  const expectedBreak = rec.shortBreakMinutes;
  const compliance = Math.abs(breakDurationMinutes - expectedBreak) <= 3;

  // Focus gain: difference between post-break score and pre-break cognitive load
  const postFocus = postBreakFocusScore || 70;
  const focusGain = Math.max(0, postFocus - (100 - rec.cognitiveLoadScore));

  rec.actualBreakTaken = breakDurationMinutes;
  rec.breakCompliance = compliance;
  rec.postBreakFocusGain = Math.round(focusGain * 10) / 10;
  rec.totalBreakMinutes += breakDurationMinutes;
  rec.completedPomodoros += 1;
  rec.status = 'completed';
  await rec.save();

  // Update the user's personalized profile based on this outcome
  await updatePersonalizedProfile(userId, rec);

  return rec;
}

/**
 * Record an interruption and adjust cognitive load accordingly.
 */
async function recordInterruption(userId, recommendationId, { severity = 'medium' } = {}) {
  const rec = await BreakRecommendation.findOne({
    where: { id: recommendationId, user: userId },
  });
  if (!rec) return null;

  const severityPenalty = { low: 5, medium: 15, high: 25 }[severity] || 15;
  rec.cognitiveLoadScore = Math.min(100, rec.cognitiveLoadScore + severityPenalty);
  rec.fatigueIndex = Math.min(100, rec.fatigueIndex + severityPenalty * 0.5);

  const metadata = { ...(rec.metadata || {}) };
  metadata.interruptions = [...(metadata.interruptions || []), {
    timestamp: new Date().toISOString(),
    severity,
    loadAfter: rec.cognitiveLoadScore,
  }];
  rec.metadata = metadata;
  await rec.save();

  return rec;
}

// ── Analytics & Insights ─────────────────────────────────────────────────

/**
 * Get break effectiveness analytics for a user over a date range.
 */
async function getBreakAnalytics(userId, { startDate, endDate } = {}) {
  const where = { user: userId, status: 'completed' };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = new Date(startDate);
    if (endDate) where.createdAt[Op.lte] = new Date(endDate);
  }

  const sessions = await BreakRecommendation.findAll({ where, order: [['createdAt', 'ASC']] });
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      avgCompliance: 0,
      avgFocusGain: 0,
      optimalPomodoro: 25,
      optimalBreak: 5,
      subjectInsights: [],
      hourlyPerformance: [],
      recommendations: [],
    };
  }

  // Aggregate metrics
  const totalSessions = sessions.length;
  const compliantCount = sessions.filter((s) => s.breakCompliance).length;
  const avgCompliance = Math.round((compliantCount / totalSessions) * 100);
  const avgFocusGain = Math.round(
    sessions.reduce((sum, s) => sum + (s.postBreakFocusGain || 0), 0) / totalSessions * 10
  ) / 10;

  // Find optimal pomodoro/break from highest-gain sessions
  const topSessions = [...sessions].sort((a, b) => (b.postBreakFocusGain || 0) - (a.postBreakFocusGain || 0));
  const topQuartile = topSessions.slice(0, Math.ceil(totalSessions / 4));
  const optimalPomodoro = Math.round(
    topQuartile.reduce((sum, s) => sum + s.pomodoroLength, 0) / topQuartile.length
  );
  const optimalBreak = Math.round(
    topQuartile.reduce((sum, s) => sum + s.shortBreakMinutes, 0) / topQuartile.length
  );

  // Subject-level insights
  const subjectMap = {};
  for (const s of sessions) {
    const key = s.subject || 'General';
    if (!subjectMap[key]) subjectMap[key] = { name: key, sessions: 0, totalGain: 0, avgLoad: 0 };
    subjectMap[key].sessions += 1;
    subjectMap[key].totalGain += s.postBreakFocusGain || 0;
    subjectMap[key].avgLoad += s.cognitiveLoadScore || 0;
  }
  const subjectInsights = Object.values(subjectMap).map((s) => ({
    name: s.name,
    sessionCount: s.sessions,
    avgFocusGain: Math.round((s.totalGain / s.sessions) * 10) / 10,
    avgCognitiveLoad: Math.round(s.avgLoad / s.sessions),
    recommendedBreak: s.avgLoad / s.sessions > 70 ? 10 : s.avgLoad / s.sessions > 40 ? 5 : 3,
  })).sort((a, b) => b.avgFocusGain - a.avgFocusGain);

  // Hourly performance distribution
  const hourlyMap = {};
  for (const s of sessions) {
    const hour = new Date(s.createdAt).getHours();
    if (!hourlyMap[hour]) hourlyMap[hour] = { hour, sessions: 0, totalGain: 0 };
    hourlyMap[hour].sessions += 1;
    hourlyMap[hour].totalGain += s.postBreakFocusGain || 0;
  }
  const hourlyPerformance = Object.values(hourlyMap).map((h) => ({
    hour: h.hour,
    sessionCount: h.sessions,
    avgFocusGain: Math.round((h.totalGain / h.sessions) * 10) / 10,
  })).sort((a, b) => b.avgFocusGain - a.avgFocusGain);

  // Generate actionable recommendations
  const recommendations = generateActionableInsights(sessions, subjectInsights, hourlyPerformance);

  return {
    totalSessions,
    compliantCount,
    avgCompliance,
    avgFocusGain,
    optimalPomodoro,
    optimalBreak,
    learningStyleDistribution: computeLearningStyleDistribution(sessions),
    subjectInsights,
    hourlyPerformance,
    recommendations,
    trendData: computeTrendData(sessions),
  };
}

/**
 * Get the active recommendation for a user (or the latest completed one).
 */
async function getActiveRecommendation(userId) {
  const active = await BreakRecommendation.findOne({
    where: { user: userId, status: 'active' },
    order: [['createdAt', 'DESC']],
  });
  if (active) return active;

  return BreakRecommendation.findOne({
    where: { user: userId, status: 'completed' },
    order: [['createdAt', 'DESC']],
  });
}

/**
 * Get recommendation history for a user.
 */
async function getRecommendationHistory(userId, { page = 1, limit = 20 } = {}) {
  const offset = (Math.max(1, page) - 1) * limit;
  const { count, rows } = await BreakRecommendation.findAndCountAll({
    where: { user: userId },
    order: [['createdAt', 'DESC']],
    offset,
    limit,
  });
  return {
    recommendations: rows,
    pagination: { total: count, page, totalPages: Math.ceil(count / limit), limit },
  };
}

// ── Internal Computation Helpers ─────────────────────────────────────────

async function computePersonalizedProfile(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sessions = await BreakRecommendation.findAll({
    where: {
      user: userId,
      status: 'completed',
      createdAt: { [Op.gte]: thirtyDaysAgo },
    },
    attributes: [
      'pomodoroLength', 'shortBreakMinutes', 'longBreakMinutes',
      'postBreakFocusGain', 'cognitiveLoadScore', 'fatigueIndex',
      'breakCompliance', 'completedPomodoros',
    ],
    raw: true,
  });

  if (sessions.length === 0) {
    return {
      avgPomodoro: 25,
      avgBreak: 5,
      avgFocusGain: 0,
      avgRecoveryRate: 1.0,
      avgSessionsBeforeBreak: 4,
      complianceRate: 0,
      totalSessions: 0,
      consistencyScore: 0,
    };
  }

  const avgPomodoro = Math.round(sessions.reduce((s, r) => s + r.pomodoroLength, 0) / sessions.length);
  const avgBreak = Math.round(sessions.reduce((s, r) => s + r.shortBreakMinutes, 0) / sessions.length);
  const avgFocusGain = sessions.reduce((s, r) => s + (r.postBreakFocusGain || 0), 0) / sessions.length;
  const avgRecoveryRate = sessions.reduce((s, r) => s + (r.fatigueIndex || 0), 0) / sessions.length;
  const complianceRate = sessions.filter((s) => s.breakCompliance).length / sessions.length;
  const avgSessions = sessions.reduce((s, r) => s + (r.completedPomodoros || 0), 0) / sessions.length;

  // Consistency: how close sessions are to the mean (lower std = more consistent)
  const pomodoroVariance = sessions.reduce((s, r) => s + Math.pow(r.pomodoroLength - avgPomodoro, 2), 0) / sessions.length;
  const consistencyScore = Math.max(0, 100 - Math.sqrt(pomodoroVariance));

  return {
    avgPomodoro, avgBreak, avgFocusGain, avgRecoveryRate,
    avgSessionsBeforeBreak: Math.round(avgSessions),
    complianceRate: Math.round(complianceRate * 100),
    totalSessions: sessions.length,
    consistencyScore: Math.round(consistencyScore),
  };
}

async function computeCognitiveLoad(userId) {
  const recentSessions = await FocusSessionLog.findAll({
    where: {
      user: userId,
      status: { [Op.in]: ['completed', 'active'] },
      startedAt: { [Op.gte]: new Date(Date.now() - 4 * 60 * 60 * 1000) },
    },
    attributes: ['startedAt', 'endedAt', 'actualMinutes', 'efficiencyScore', 'interruptions'],
    order: [['startedAt', 'DESC']],
    limit: 10,
    raw: true,
  });

  if (recentSessions.length === 0) return 30;

  // Base load from cumulative focus time
  const totalFocusMinutes = recentSessions.reduce((s, r) => s + (r.actualMinutes || 0), 0);
  const baseLoad = Math.min(60, totalFocusMinutes * COGNITIVE_LOAD_DECAY_RATE);

  // Interruption penalty
  const interruptionLoad = recentSessions.reduce((s, r) => s + (r.interruptions || 0), 0) * 5;

  // Efficiency decay (lower efficiency = higher load)
  const avgEfficiency = recentSessions.reduce((s, r) => s + (r.efficiencyScore || 50), 0) / recentSessions.length;
  const efficiencyLoad = Math.max(0, 50 - avgEfficiency);

  // Time-of-day factor (cognitive load is higher during off-peak hours)
  const hour = new Date().getHours();
  const timeOfDayFactor = (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16) ? -10 : 5;

  return Math.min(100, Math.max(0, Math.round(baseLoad + interruptionLoad + efficiencyLoad + timeOfDayFactor)));
}

async function computeFatigueIndex(userId) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaySessions = await FocusSessionLog.findAll({
    where: {
      user: userId,
      status: { [Op.in]: ['completed', 'active'] },
      startedAt: { [Op.gte]: todayStart },
    },
    attributes: ['actualMinutes', 'interruptions', 'efficiencyScore'],
    raw: true,
  });

  if (todaySessions.length === 0) return 10;

  const totalMinutes = todaySessions.reduce((s, r) => s + (r.actualMinutes || 0), 0);
  const totalInterruptions = todaySessions.reduce((s, r) => s + (r.interruptions || 0), 0);
  const avgEfficiency = todaySessions.reduce((s, r) => s + (r.efficiencyScore || 50), 0) / todaySessions.length;

  // Fatigue accumulates with focus time and drops with efficiency
  const timeFatigue = totalMinutes * FATIGUE_ACCUMULATION_RATE / 60;
  const interruptionFatigue = totalInterruptions * 3;
  const efficiencyBonus = (100 - avgEfficiency) * 0.3;

  return Math.min(100, Math.max(0, Math.round(timeFatigue + interruptionFatigue + efficiencyBonus)));
}

function classifyLearningStyle(profile) {
  if (profile.avgPomodoro <= SPRINT_THRESHOLD) return 'sprint';
  if (profile.avgPomodoro >= MARATHON_THRESHOLD) return 'marathon';
  return 'mixed';
}

function computeOptimalIntervals(profile, cognitiveLoad, fatigueIndex) {
  // Base interval from historical optimal
  let pomodoroMinutes = profile.avgPomodoro || 25;
  let breakMinutes = profile.avgBreak || 5;

  // Adjust for cognitive load
  if (cognitiveLoad > 75) {
    pomodoroMinutes = Math.max(10, pomodoroMinutes - 10);
    breakMinutes = Math.min(20, breakMinutes + 5);
  } else if (cognitiveLoad > 50) {
    pomodoroMinutes = Math.max(15, pomodoroMinutes - 5);
    breakMinutes = Math.min(15, breakMinutes + 2);
  } else if (cognitiveLoad < 25) {
    pomodoroMinutes = Math.min(60, pomodoroMinutes + 5);
    breakMinutes = Math.max(3, breakMinutes - 1);
  }

  // Adjust for fatigue
  if (fatigueIndex > 60) {
    pomodoroMinutes = Math.max(10, pomodoroMinutes - 8);
    breakMinutes = Math.min(20, breakMinutes + 5);
  } else if (fatigueIndex > 35) {
    pomodoroMinutes = Math.max(15, pomodoroMinutes - 3);
    breakMinutes = Math.min(12, breakMinutes + 2);
  }

  const longBreakMinutes = Math.round(breakMinutes * 3);

  return { pomodoroMinutes, breakMinutes, longBreakMinutes };
}

async function detectPeakPerformanceHour(userId) {
  const sessions = await BreakRecommendation.findAll({
    where: { user: userId, status: 'completed' },
    attributes: ['createdAt', 'postBreakFocusGain', 'cognitiveLoadScore'],
    raw: true,
  });

  if (sessions.length < 3) return 10;

  const hourMap = {};
  for (const s of sessions) {
    const hour = new Date(s.createdAt).getHours();
    if (!hourMap[hour]) hourMap[hour] = { totalGain: 0, count: 0 };
    hourMap[hour].totalGain += s.postBreakFocusGain || 0;
    hourMap[hour].count += 1;
  }

  let bestHour = 10;
  let bestScore = -1;
  for (const [hour, data] of Object.entries(hourMap)) {
    const avg = data.totalGain / data.count;
    if (avg > bestScore) { bestScore = avg; bestHour = parseInt(hour); }
  }

  return bestHour;
}

async function updatePersonalizedProfile(userId, completedRec) {
  const recent = await BreakRecommendation.findAll({
    where: { user: userId, status: 'completed' },
    order: [['createdAt', 'DESC']],
    limit: 5,
    raw: true,
  });

  if (recent.length < 2) return;

  // Check if the completed rec was among the best-performing
  const avgGain = recent.reduce((s, r) => s + (r.postBreakFocusGain || 0), 0) / recent.length;
  const isAboveAverage = (completedRec.postBreakFocusGain || 0) > avgGain;

  const metadata = { ...(completedRec.metadata || {}) };
  metadata.profileUpdate = {
    aboveAverage: isAboveAverage,
    avgGain,
    timestamp: new Date().toISOString(),
  };
  completedRec.metadata = metadata;
  await completedRec.save();
}

function generateActionableInsights(sessions, subjectInsights, hourlyPerformance) {
  const insights = [];

  // Compliance insight
  const complianceRate = sessions.filter((s) => s.breakCompliance).length / sessions.length;
  if (complianceRate < 0.6) {
    insights.push({
      type: 'compliance',
      priority: 'high',
      message: `Your break compliance is ${Math.round(complianceRate * 100)}%. Taking regular breaks improves retention by up to 30%.`,
      action: 'Set break reminders and stick to the suggested intervals.',
    });
  }

  // Cognitive load insight
  const avgLoad = sessions.reduce((s, r) => s + (r.cognitiveLoadScore || 0), 0) / sessions.length;
  if (avgLoad > 70) {
    insights.push({
      type: 'cognitive_load',
      priority: 'high',
      message: 'Your average cognitive load is very high. Consider shorter focus sessions.',
      action: 'Try 15-minute pomodoros with 7-minute breaks for the next study session.',
    });
  }

  // Focus gain insight
  const avgGain = sessions.reduce((s, r) => s + (r.postBreakFocusGain || 0), 0) / sessions.length;
  if (avgGain > 15) {
    insights.push({
      type: 'focus_gain',
      priority: 'positive',
      message: `Breaks are giving you an average ${avgGain.toFixed(1)} point focus boost. Keep it up!`,
      action: 'Your break strategy is working well. Maintain consistency.',
    });
  } else if (avgGain < 5) {
    insights.push({
      type: 'focus_gain',
      priority: 'medium',
      message: 'Your breaks aren\'t providing enough cognitive recovery.',
      action: 'Try longer breaks (10-15 min) or change your break activities (walk, stretch, eyes rest).',
    });
  }

  // Subject-specific insights
  if (subjectInsights.length > 0) {
    const hardest = subjectInsights.reduce((max, s) => s.avgCognitiveLoad > max.avgCognitiveLoad ? s : max, subjectInsights[0]);
    if (hardest.avgCognitiveLoad > 70) {
      insights.push({
        type: 'subject_difficulty',
        priority: 'medium',
        message: `"${hardest.name}" sessions show high cognitive load (${hardest.avgCognitiveLoad}).`,
        action: `Consider shorter study blocks (15-20 min) for ${hardest.name} with more frequent breaks.`,
      });
    }
  }

  // Peak performance insight
  if (hourlyPerformance.length >= 3) {
    const peak = hourlyPerformance[0];
    insights.push({
      type: 'peak_performance',
      priority: 'info',
      message: `Your peak focus hour is ${peak.hour}:00 with +${peak.avgFocusGain} avg focus gain.`,
      action: `Schedule your most demanding study sessions around ${peak.hour}:00-${peak.hour + 2}:00.`,
    });
  }

  // Fatigue trend
  const recentFatigue = sessions.slice(-5).map((s) => s.fatigueIndex || 0);
  const olderFatigue = sessions.slice(0, 5).map((s) => s.fatigueIndex || 0);
  if (recentFatigue.length > 0 && olderFatigue.length > 0) {
    const recentAvg = recentFatigue.reduce((a, b) => a + b, 0) / recentFatigue.length;
    const olderAvg = olderFatigue.reduce((a, b) => a + b, 0) / olderFatigue.length;
    if (recentAvg > olderAvg + 10) {
      insights.push({
        type: 'fatigue_trend',
        priority: 'medium',
        message: 'Your fatigue levels are increasing over time.',
        action: 'Consider adding an extra long break after every 3 pomodoros and review your sleep schedule.',
      });
    }
  }

  return insights;
}

function computeLearningStyleDistribution(sessions) {
  const dist = { sprint: 0, marathon: 0, mixed: 0 };
  for (const s of sessions) {
    const style = s.learningStyle || 'mixed';
    if (dist[style] !== undefined) dist[style] += 1;
  }
  return dist;
}

function computeTrendData(sessions) {
  // Group by week and compute weekly averages
  const weeklyMap = {};
  for (const s of sessions) {
    const d = new Date(s.createdAt);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!weeklyMap[key]) weeklyMap[key] = { week: key, gains: [], loads: [], compliance: 0, count: 0 };
    weeklyMap[key].gains.push(s.postBreakFocusGain || 0);
    weeklyMap[key].loads.push(s.cognitiveLoadScore || 0);
    weeklyMap[key].compliance += s.breakCompliance ? 1 : 0;
    weeklyMap[key].count += 1;
  }

  return Object.values(weeklyMap).map((w) => ({
    week: w.week,
    avgFocusGain: Math.round(w.gains.reduce((a, b) => a + b, 0) / w.gains.length * 10) / 10,
    avgCognitiveLoad: Math.round(w.loads.reduce((a, b) => a + b, 0) / w.loads.length),
    complianceRate: Math.round((w.compliance / w.count) * 100),
    sessionCount: w.count,
  })).sort((a, b) => a.week.localeCompare(b.week));
}

// ── Exports ──────────────────────────────────────────────────────────────

module.exports = {
  generateRecommendation,
  recordBreak,
  recordInterruption,
  getBreakAnalytics,
  getActiveRecommendation,
  getRecommendationHistory,
};
