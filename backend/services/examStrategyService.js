const { v4: uuidv4 } = require('uuid');
const ExamStrategy = require('../models/ExamStrategy');
const Exam = require('../models/Exam');
const StudyPlan = require('../models/StudyPlan');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const WeaknessReport = require('../models/WeaknessReport');
const { Op } = require('sequelize');

/** Gather all context data needed to generate an exam strategy. */
async function gatherContext(userId, examId) {
  const exam = await Exam.findOne({ where: { id: examId, user: userId } });
  if (!exam) throw new Error('Exam not found');

  const daysUntilExam = Math.max(0, Math.ceil((new Date(exam.date) - new Date()) / 86400000));
  const subjects = await Subject.findAll({ where: { exam: examId, user: userId } });
  const subjectIds = subjects.map((s) => s.id);

  const quizIds = (await Quiz.findAll({ where: { subject: { [Op.in]: subjectIds } } })).map((q) => q.id);
  const attempts = await QuizAttempt.findAll({
    where: { user: userId, quiz: { [Op.in]: quizIds.length ? quizIds : ['00000000-0000-0000-0000-000000000000'] } },
    order: [['createdAt', 'DESC']], limit: 100,
  });
  const avgQuizScore = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / attempts.length) : 0;

  const plan = await StudyPlan.findOne({ where: { user: userId, exam: examId, status: 'active' } });
  let completedTaskPct = 0;
  if (plan?.dailyGoals?.length) {
    const allTasks = plan.dailyGoals.flatMap((g) => g.tasks || []);
    completedTaskPct = allTasks.length ? Math.round(allTasks.filter((t) => t.completed).length / allTasks.length * 100) : 0;
  }

  const reports = await WeaknessReport.findAll({ where: { user: userId }, order: [['createdAt', 'DESC']], limit: 1 });
  const rpt = reports[0];

  return {
    examName: exam.name, examDate: exam.date, daysUntilExam,
    overallReadinessScore: avgQuizScore, avgQuizScore, completedTaskPct,
    weakTopicsCount: rpt?.weakCount || 0, strongTopicsCount: rpt?.strongCount || 0,
    subjectNames: subjects.map((s) => s.name),
    weakTopics: (rpt?.topicBreakdown || []).filter((t) => t.status === 'Weak').map((t) => t.topicName),
    strongTopics: (rpt?.topicBreakdown || []).filter((t) => t.status === 'Strong').map((t) => t.topicName),
    recentAttemptCount: attempts.length,
  };
}

/** Build a deterministic fallback strategy when Gemini is unavailable. */
function buildFallback(ctx) {
  const days = Math.min(ctx.daysUntilExam, 14);
  const dailyBreakdown = Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
    label: i === 0 ? 'Day 1 — Foundation Review' : i === days - 1 ? 'Final Day — Light Revision' : `Day ${i + 1}`,
    focusArea: i < days * 0.5 ? 'Weakness Focus' : i < days * 0.8 ? 'Practice & Revision' : 'Light Review',
    tasks: [
      { title: i < days * 0.5 ? 'Review weak topics' : 'Practice questions', durationMinutes: 90, type: i < days * 0.5 ? 'weakness' : 'practice',
        subjectName: ctx.subjectNames[i % ctx.subjectNames.length] || 'General', topicName: ctx.weakTopics[0] || 'Mixed' },
      { title: 'Flashcard revision', durationMinutes: 45, type: 'review',
        subjectName: ctx.subjectNames[i % ctx.subjectNames.length] || 'General', topicName: 'Key Concepts' },
    ],
    dailyGoal: i < days * 0.5 ? 'Cover weak areas' : 'Consolidate knowledge',
    tips: ['Take breaks every 90 minutes', 'Stay hydrated'],
  }));

  return {
    title: `Strategy for ${ctx.examName}`,
    priorityActions: ctx.weakTopics.slice(0, 5).map((t, i) => ({
      id: uuidv4(), priority: i === 0 ? 'critical' : i < 3 ? 'high' : 'medium',
      title: `Master ${t}`, description: `Focus on revising ${t} to close the knowledge gap.`,
      estimatedMinutes: 60, subjectName: ctx.subjectNames[0] || 'General', topicName: t,
      rationale: 'Identified as weak topic through quiz performance.',
    })),
    dailyBreakdown,
    battleCard: {
      title: `Exam Battle Card — ${ctx.examName}`,
      lastMinuteReminders: [`${ctx.daysUntilExam} days left — stay focused!`,
        `Focus on: ${ctx.weakTopics.slice(0, 3).join(', ') || 'Mixed review'}`, 'Sleep 7+ hours the night before.'],
      mustKnowFormulas: ctx.weakTopics.slice(0, 3).map((t) => ({ topic: t, formula: 'Review key formulas' })),
      timeAllocation: { mcq: 50, subjective: 30, review: 20 },
      confidenceBoosters: [`Avg quiz score: ${ctx.avgQuizScore}% across ${ctx.recentAttemptCount} attempts.`,
        `${ctx.strongTopicsCount} topics already strong.`],
      riskAreas: ctx.weakTopics.slice(0, 3).map((t) => ({ topic: t, risk: 'Below average', mitigation: 'Prioritize daily revision.' })),
      motivationalMessage: 'Every minute of focused study brings you closer to success!',
    },
    readinessPrediction: {
      currentScore: ctx.avgQuizScore,
      predictedScore: Math.min(100, ctx.avgQuizScore + Math.round(ctx.completedTaskPct * 0.15)),
      confidenceInterval: { low: Math.max(0, ctx.avgQuizScore - 8), high: Math.min(100, ctx.avgQuizScore + 15) },
      improvementPotential: Math.round(ctx.completedTaskPct * 0.15),
      keyDrivers: [
        { factor: 'Study plan adherence', impact: ctx.completedTaskPct > 50 ? 'positive' : 'negative', weight: 0.3 },
        { factor: 'Quiz performance', impact: ctx.avgQuizScore > 60 ? 'positive' : 'negative', weight: 0.4 },
      ],
    },
    aiInsights: [
      ...(ctx.weakTopics.length ? [{ type: 'weakness', title: 'Weak topics detected', description: `${ctx.weakTopics.length} topics need focused revision.`, actionable: true }] : []),
      ...(ctx.strongTopics.length ? [{ type: 'strength', title: 'Strong foundations', description: `${ctx.strongTopicsCount} topics well mastered.`, actionable: false }] : []),
      { type: 'opportunity', title: 'Time optimization', description: `With ${ctx.daysUntilExam} days left, prioritize high-weightage topics.`, actionable: true },
    ],
    timeAllocation: {
      totalHoursAvailable: ctx.daysUntilExam * 3,
      bySubject: ctx.subjectNames.map((name) => ({ subjectName: name, hours: Math.round(ctx.daysUntilExam * 3 / ctx.subjectNames.length), pct: Math.round(100 / ctx.subjectNames.length) })),
      byActivityType: { revision: 40, practice: 30, weaknessFocus: 25, rest: 5 },
    },
  };
}

/** Call Gemini or fall back to buildFallback. */
async function generateWithAI(context) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an expert exam strategy coach. Generate a JSON strategy for: ${JSON.stringify(context)}.
Return STRICTLY JSON with keys: title, priorityActions (array with id/priority/title/description/estimatedMinutes/subjectName/topicName/rationale), dailyBreakdown, battleCard (title/lastMinuteReminders/mustKnowFormulas/timeAllocation/confidenceBoosters/riskAreas/motivationalMessage), readinessPrediction (currentScore/predictedScore/confidenceInterval/improvementPotential/keyDrivers), aiInsights (array with type/title/description/actionable), timeAllocation (totalHoursAvailable/bySubject/byActivityType).`;
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('```')) text = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(text);
  } catch (err) {
    console.warn('[ExamStrategy] Gemini unavailable, using fallback:', err.message);
    return buildFallback(context);
  }
}

/** Generate a new exam strategy — gather context, call AI, persist. */
async function generateStrategy(userId, examId) {
  const context = await gatherContext(userId, examId);
  const data = await generateWithAI(context);

  await ExamStrategy.update({ status: 'superseded' }, { where: { user: userId, exam: examId, status: 'active' } });

  return ExamStrategy.create({
    user: userId, exam: examId, title: data.title || `Strategy for ${context.examName}`,
    inputSnapshot: context, priorityActions: data.priorityActions || [],
    dailyBreakdown: data.dailyBreakdown || [], battleCard: data.battleCard || {},
    readinessPrediction: data.readinessPrediction || {}, aiInsights: data.aiInsights || [],
    timeAllocation: data.timeAllocation || {}, actionsTotal: (data.priorityActions || []).length,
    status: 'active',
  });
}

async function getActiveStrategy(userId, examId) {
  const filter = { user: userId, status: 'active' };
  if (examId) filter.exam = examId;
  return ExamStrategy.findOne({ where: filter, order: [['createdAt', 'DESC']] });
}

async function getAllStrategies(userId, page = 1, limit = 20) {
  return ExamStrategy.findAndCountAll({ where: { user: userId }, order: [['createdAt', 'DESC']], limit, offset: (page - 1) * limit });
}

async function markViewed(strategyId, userId) {
  const s = await ExamStrategy.findOne({ where: { id: strategyId, user: userId } });
  if (!s) return null;
  s.viewed = true; s.viewedAt = new Date(); await s.save(); return s;
}

async function recordFeedback(strategyId, userId, rating, comment) {
  const s = await ExamStrategy.findOne({ where: { id: strategyId, user: userId } });
  if (!s) return null;
  s.feedbackRating = rating; s.feedbackComment = comment || null; await s.save(); return s;
}

async function completeAction(strategyId, userId) {
  const s = await ExamStrategy.findOne({ where: { id: strategyId, user: userId } });
  if (!s) return null;
  s.actionsCompleted = Math.min(s.actionsCompleted + 1, s.actionsTotal); await s.save(); return s;
}

module.exports = { generateStrategy, getActiveStrategy, getAllStrategies, markViewed, recordFeedback, completeAction, gatherContext, buildFallback };
