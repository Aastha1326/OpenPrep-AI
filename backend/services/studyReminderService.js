const { Op } = require('sequelize');
const StudyReminder = require('../models/StudyReminder');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const Subject = require('../models/Subject');
const StudyPlan = require('../models/StudyPlan');

/** Compute next trigger date based on reminder type and schedule. */
function computeNextTrigger(reminder) {
  const now = new Date();
  const [h, m] = (reminder.scheduledTime || '09:00').split(':').map(Number);
  const next = new Date(now);
  next.setHours(h, m, 0, 0);

  if (reminder.reminderType === 'daily') {
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  }
  if (reminder.reminderType === 'weekly') {
    const days = reminder.scheduledDays || [];
    if (days.length === 0) { if (next <= now) next.setDate(next.getDate() + 1); return next; }
    for (let i = 0; i < 7; i++) {
      const candidate = new Date(now);
      candidate.setDate(candidate.getDate() + i);
      candidate.setHours(h, m, 0, 0);
      if (days.includes(candidate.getDay()) && candidate > now) return candidate;
    }
    next.setDate(next.getDate() + 7);
    return next;
  }
  if (reminder.reminderType === 'before_exam') {
    const examDate = reminder.meta?.examDate ? new Date(reminder.meta.examDate) : new Date(now.getTime() + 14 * 86400000);
    const daysBefore = reminder.meta?.daysBefore || 3;
    const trigger = new Date(examDate);
    trigger.setDate(trigger.getDate() - daysBefore);
    trigger.setHours(h, m, 0, 0);
    return trigger > now ? trigger : now;
  }
  if (reminder.reminderType === 'spaced_review') {
    const interval = reminder.meta?.intervalDays || 3;
    if (reminder.lastTriggeredAt) {
      const nextDate = new Date(reminder.lastTriggeredAt);
      nextDate.setDate(nextDate.getDate() + interval);
      nextDate.setHours(h, m, 0, 0);
      return nextDate > now ? nextDate : now;
    }
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  }
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

/** Gather user study patterns for AI suggestions. */
async function gatherPatterns(userId) {
  const subjects = await Subject.findAll({ where: { user: userId } });
  const subjectIds = subjects.map((s) => s.id);
  const quizIds = (await Quiz.findAll({ where: { subject: { [Op.in]: subjectIds.length ? subjectIds : ['0'] } } })).map((q) => q.id);
  const recentAttempts = await QuizAttempt.findAll({
    where: { user: userId, quiz: { [Op.in]: quizIds.length ? quizIds : ['0'] } },
    order: [['createdAt', 'DESC']], limit: 20,
  });
  const weakSubjects = subjects.slice(0, 3).map((s) => s.name);
  const avgScore = recentAttempts.length
    ? Math.round(recentAttempts.reduce((s, a) => s + (a.score || 0), 0) / recentAttempts.length) : 0;
  const plan = await StudyPlan.findOne({ where: { user: userId, status: 'active' } });
  let overdueTasks = 0;
  if (plan?.dailyGoals) {
    const today = new Date().toISOString().split('T')[0];
    overdueTasks = plan.dailyGoals.filter((g) => g.date < today && (g.tasks || []).some((t) => !t.completed)).length;
  }
  return { subjectNames: weakSubjects, avgScore, overdueTasks, recentActivity: recentAttempts.length };
}

/** Generate AI-suggested reminders based on study patterns. */
async function generateSuggestions(userId) {
  const patterns = await gatherPatterns(userId);
  const suggestions = [];

  if (patterns.avgScore < 60 && patterns.subjectNames.length > 0) {
    suggestions.push({
      title: `Review ${patterns.subjectNames[0]} — Weak Area`,
      message: `Your average score in ${patterns.subjectNames[0]} is below 60%. Schedule daily review sessions.`,
      reminderType: 'daily', subjectContext: patterns.subjectNames[0],
      scheduledTime: '10:00', scheduledDays: [1, 2, 3, 4, 5],
      priority: 'high', aiSuggested: true, meta: { reason: 'low_score', score: patterns.avgScore },
    });
  }

  if (patterns.overdueTasks > 0) {
    suggestions.push({
      title: `Catch Up: ${patterns.overdueTasks} Overdue Tasks`,
      message: `You have ${patterns.overdueTasks} overdue study plan tasks. Set a reminder to get back on track.`,
      reminderType: 'daily', scheduledTime: '08:00', scheduledDays: [1, 2, 3, 4, 5, 6],
      priority: 'high', aiSuggested: true, meta: { reason: 'overdue_tasks', count: patterns.overdueTasks },
    });
  }

  suggestions.push({
    title: 'Evening Review Session',
    message: 'A 30-minute evening review helps consolidate what you learned today. Spaced repetition works best within 24 hours.',
    reminderType: 'daily', scheduledTime: '20:00', scheduledDays: [1, 2, 3, 4, 5],
    priority: 'medium', aiSuggested: true, meta: { reason: 'evening_review' },
  });

  if (patterns.avgScore >= 70) {
    suggestions.push({
      title: 'Weekly Challenge Quiz',
      message: `Your average score is ${patterns.avgScore}% — great job! Take a challenge quiz weekly to maintain and push further.`,
      reminderType: 'weekly', scheduledTime: '14:00', scheduledDays: [6],
      priority: 'low', aiSuggested: true, meta: { reason: 'maintenance', score: patterns.avgScore },
    });
  }

  for (const name of patterns.subjectNames.slice(0, 2)) {
    suggestions.push({
      title: `Flashcard Review: ${name}`,
      message: `Keep your ${name} flashcards fresh with a quick 10-minute review.`,
      reminderType: 'spaced_review', subjectContext: name,
      scheduledTime: '12:00', scheduledDays: [],
      priority: 'medium', aiSuggested: true, meta: { reason: 'spaced_review', intervalDays: 3 },
    });
  }

  return suggestions;
}

/** Create a new reminder. */
async function createReminder(userId, data) {
  const reminder = await StudyReminder.create({
    user: userId, title: data.title, message: data.message || '',
    reminderType: data.reminderType || 'daily', subjectContext: data.subjectContext || null,
    topicContext: data.topicContext || null, scheduledTime: data.scheduledTime || '09:00',
    scheduledDays: data.scheduledDays || [], priority: data.priority || 'medium',
    channel: data.channel || 'in_app', aiSuggested: data.aiSuggested || false,
    meta: data.meta || {},
  });
  reminder.nextTriggerAt = computeNextTrigger(reminder);
  await reminder.save();
  return reminder;
}

/** Get all reminders for a user. */
async function getAllReminders(userId) {
  return StudyReminder.findAll({ where: { user: userId }, order: [['enabled', 'DESC'], ['priority', 'ASC'], ['createdAt', 'DESC']] });
}

/** Get active reminders due for triggering. */
async function getDueReminders(userId) {
  return StudyReminder.findAll({
    where: { user: userId, enabled: true, nextTriggerAt: { [Op.lte]: new Date() } },
  });
}

/** Toggle reminder enabled/disabled. */
async function toggleReminder(userId, reminderId) {
  const r = await StudyReminder.findOne({ where: { id: reminderId, user: userId } });
  if (!r) return null;
  r.enabled = !r.enabled;
  if (r.enabled) r.nextTriggerAt = computeNextTrigger(r);
  await r.save();
  return r;
}

/** Mark a reminder as triggered. */
async function markTriggered(reminderId) {
  const r = await StudyReminder.findByPk(reminderId);
  if (!r) return null;
  r.lastTriggeredAt = new Date();
  r.triggerCount += 1;
  r.nextTriggerAt = computeNextTrigger(r);
  await r.save();
  return r;
}

/** Delete a reminder. */
async function deleteReminder(userId, reminderId) {
  const r = await StudyReminder.findOne({ where: { id: reminderId, user: userId } });
  if (!r) return false;
  await r.destroy();
  return true;
}

/** Get reminder stats. */
async function getReminderStats(userId) {
  const all = await StudyReminder.findAll({ where: { user: userId } });
  return {
    total: all.length,
    active: all.filter((r) => r.enabled).length,
    inactive: all.filter((r) => !r.enabled).length,
    byType: {
      daily: all.filter((r) => r.reminderType === 'daily').length,
      weekly: all.filter((r) => r.reminderType === 'weekly').length,
      before_exam: all.filter((r) => r.reminderType === 'before_exam').length,
      spaced_review: all.filter((r) => r.reminderType === 'spaced_review').length,
    },
    totalTriggered: all.reduce((s, r) => s + r.triggerCount, 0),
    aiSuggested: all.filter((r) => r.aiSuggested).length,
  };
}

module.exports = { createReminder, getAllReminders, getDueReminders, toggleReminder, markTriggered, deleteReminder, getReminderStats, generateSuggestions, computeNextTrigger };
