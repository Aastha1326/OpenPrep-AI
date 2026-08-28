const { Op } = require('sequelize');
const StudyTip = require('../models/StudyTip');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Progress = require('../models/Progress');
const StudyPlan = require('../models/StudyPlan');
const ActivityLog = require('../models/ActivityLog');
const WeaknessReport = require('../models/WeaknessReport');

/** Gather student learning data for AI tip generation. */
async function gatherStudentContext(userId) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const subjects = await Subject.findAll({ where: { user: userId } });
  const subjectIds = subjects.map((s) => s.id);

  // Recent quiz performance
  const quizIds = (await Quiz.findAll({ where: { subject: { [Op.in]: subjectIds.length ? subjectIds : ['0'] } } })).map((q) => q.id);
  const recentAttempts = await QuizAttempt.findAll({
    where: { user: userId, quiz: { [Op.in]: quizIds.length ? quizIds : ['0'] }, createdAt: { [Op.gte]: sevenDaysAgo } },
    order: [['createdAt', 'DESC']], limit: 20,
  });
  const avgScore = recentAttempts.length
    ? Math.round(recentAttempts.reduce((s, a) => s + (a.score || 0), 0) / recentAttempts.length) : 0;

  // Study plan adherence
  const plan = await StudyPlan.findOne({ where: { user: userId, status: 'active' } });
  let taskCompletionRate = 0;
  if (plan?.dailyGoals?.length) {
    const tasks = plan.dailyGoals.flatMap((g) => g.tasks || []);
    const completed = tasks.filter((t) => t.completed).length;
    taskCompletionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  }

  // Activity logs
  const logs = await ActivityLog.findAll({
    where: { user: userId, createdAt: { [Op.gte]: sevenDaysAgo } },
    order: [['createdAt', 'DESC']], limit: 50,
  });

  // Weakness profile
  const reports = await WeaknessReport.findAll({ where: { user: userId }, order: [['createdAt', 'DESC']], limit: 1 });
  const rpt = reports[0];

  // Topic completion rates
  const progressRecords = await Progress.findAll({ where: { user: userId } });
  const avgCompletion = progressRecords.length
    ? Math.round(progressRecords.reduce((s, p) => s + (p.completionPercentage || 0), 0) / progressRecords.length) : 0;

  return {
    subjectCount: subjects.length,
    recentQuizCount: recentAttempts.length,
    avgQuizScore: avgScore,
    taskCompletionRate,
    activityCount: logs.length,
    weakTopicsCount: rpt?.weakCount || 0,
    strongTopicsCount: rpt?.strongCount || 0,
    overallCompletion: avgCompletion,
    streakCount: 0,
    subjectNames: subjects.slice(0, 5).map((s) => s.name),
    weakTopicNames: (rpt?.topicBreakdown || []).filter((t) => t.status === 'Weak').slice(0, 3).map((t) => t.topicName),
    strongTopicNames: (rpt?.topicBreakdown || []).filter((t) => t.status === 'Strong').slice(0, 3).map((t) => t.topicName),
  };
}

/** Build deterministic tips when Gemini is unavailable. */
function buildFallbackTips(ctx) {
  const tips = [];

  if (ctx.avgQuizScore < 60) {
    tips.push({
      tipType: 'technique', priority: 'high',
      title: 'Try Active Recall Instead of Re-reading',
      content: `Your recent average quiz score is ${ctx.avgQuizScore}%. Instead of passively re-reading notes, try closing your book and writing down everything you remember about a topic. Research shows active recall improves retention by 50% compared to re-reading.`,
    });
  }

  if (ctx.taskCompletionRate < 40) {
    tips.push({
      tipType: 'schedule', priority: 'high',
      title: 'Break Tasks into 25-Minute Pomodoro Blocks',
      content: `Your study plan completion rate is ${ctx.taskCompletionRate}%. Large tasks feel overwhelming. Break them into 25-minute focused sessions with 5-minute breaks. This makes starting easier and builds momentum.`,
    });
  }

  if (ctx.weakTopicsCount > 3) {
    tips.push({
      tipType: 'weakness', priority: 'high',
      title: 'Spaced Repetition for Weak Topics',
      content: `You have ${ctx.weakTopicsCount} weak topics. Review each one today, then again in 1 day, 3 days, and 7 days. This spaced repetition schedule is proven to move information from short-term to long-term memory.`,
      subjectContext: ctx.weakTopicNames[0] || null,
    });
  }

  if (ctx.avgQuizScore >= 70) {
    tips.push({
      tipType: 'technique', priority: 'medium',
      title: 'Teach-Back Method for Strong Topics',
      content: `Your average score is ${ctx.avgQuizScore}% — great work! To push even higher, try explaining concepts out loud as if teaching someone else. This exposes gaps in understanding that quizzes might miss.`,
    });
  }

  tips.push({
    tipType: 'motivation', priority: 'low',
    title: 'Consistency Over Intensity',
    content: `Studying 1 hour daily for 7 days is more effective than 7 hours in one day. Your brain consolidates learning during sleep, so regular short sessions beat occasional marathons. Keep showing up!`,
  });

  if (ctx.activityCount < 3) {
    tips.push({
      tipType: 'schedule', priority: 'medium',
      title: 'Set a Daily Study Reminder',
      content: 'You\'ve had limited activity this week. Set a specific time each day for studying — same time, same place. Habit stacking (e.g., "After breakfast, I study for 30 minutes") makes routines stick.',
    });
  }

  if (ctx.strongTopicsCount > 0) {
    tips.push({
      tipType: 'revision', priority: 'low',
      title: 'Quick Review of Strong Topics',
      content: `You have ${ctx.strongTopicsCount} strong topics. Spend 5 minutes reviewing each one today to maintain them. Without periodic review, even mastered topics fade — the forgetting curve starts within 48 hours.`,
      subjectContext: ctx.strongTopicNames[0] || null,
    });
  }

  tips.push({
    tipType: 'general', priority: 'low',
    title: 'Hydration and Focus',
    content: 'Even mild dehydration (1-2%) can reduce cognitive performance by up to 25%. Keep a water bottle at your study desk and aim for 8 glasses throughout the day. Your brain is 75% water.',
  });

  return tips;
}

/** Call Gemini to generate personalized tips, fall back to deterministic. */
async function generateWithAI(ctx) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an expert learning coach. Based on this student's data, generate 5-7 personalized study tips.
Student data: ${JSON.stringify(ctx)}
Return STRICTLY as JSON array of objects with keys: tipType (technique|motivation|weakness|schedule|revision|general), priority (high|medium|low), title (short), content (2-3 sentences with actionable advice).`;
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('```')) text = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(text);
  } catch (err) {
    console.warn('[StudyTip] Gemini unavailable, using fallback:', err.message);
    return buildFallbackTips(ctx);
  }
}

/** Generate personalized tips for a user and persist them. */
async function generateTips(userId) {
  const ctx = await gatherStudentContext(userId);
  const rawTips = await generateWithAI(ctx);

  // Expire old unviewed tips
  await StudyTip.update(
    { dismissed: true },
    { where: { user: userId, viewed: false, dismissed: false, createdAt: { [Op.lt]: new Date(Date.now() - 48 * 3600000) } } }
  );

  const tips = [];
  for (const t of rawTips) {
    const tip = await StudyTip.create({
      user: userId,
      tipType: t.tipType || 'general',
      title: t.title,
      content: t.content,
      priority: t.priority || 'medium',
      subjectContext: t.subjectContext || null,
      topicContext: t.topicContext || null,
      sourceData: ctx,
      expiresAt: new Date(Date.now() + 72 * 3600000), // 72h expiry
    });
    tips.push(tip);
  }
  return tips;
}

/** Get active (non-dismissed, non-expired) tips for a user. */
async function getActiveTips(userId, limit = 10) {
  return StudyTip.findAll({
    where: {
      user: userId, dismissed: false,
      [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
    },
    order: [['priority', 'ASC'], ['createdAt', 'DESC']],
    limit,
  });
}

/** Get all tips for a user (paginated). */
async function getAllTips(userId, page = 1, limit = 20) {
  return StudyTip.findAndCountAll({
    where: { user: userId },
    order: [['createdAt', 'DESC']],
    limit, offset: (page - 1) * limit,
  });
}

/** Mark a tip as viewed. */
async function markViewed(tipId, userId) {
  const tip = await StudyTip.findOne({ where: { id: tipId, user: userId } });
  if (!tip) return null;
  tip.viewed = true; tip.viewedAt = new Date(); await tip.save(); return tip;
}

/** Rate a tip as helpful or not. */
async function rateTip(tipId, userId, helpful) {
  const tip = await StudyTip.findOne({ where: { id: tipId, user: userId } });
  if (!tip) return null;
  tip.helpful = helpful; await tip.save(); return tip;
}

/** Dismiss a tip. */
async function dismissTip(tipId, userId) {
  const tip = await StudyTip.findOne({ where: { id: tipId, user: userId } });
  if (!tip) return null;
  tip.dismissed = true; await tip.save(); return tip;
}

/** Get engagement stats for a user. */
async function getEngagementStats(userId) {
  const total = await StudyTip.count({ where: { user: userId } });
  const viewed = await StudyTip.count({ where: { user: userId, viewed: true } });
  const helpful = await StudyTip.count({ where: { user: userId, helpful: true } });
  const byType = await StudyTip.findAll({
    where: { user: userId },
    attributes: ['tipType', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
    group: ['tipType'],
    raw: true,
  });
  return { total, viewed, helpful, viewRate: total ? Math.round((viewed / total) * 100) : 0, byType };
}

module.exports = { generateTips, getActiveTips, getAllTips, markViewed, rateTip, dismissTip, getEngagementStats, gatherStudentContext };
