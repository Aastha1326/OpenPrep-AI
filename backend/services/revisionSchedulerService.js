const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const RevisionSchedule = require('../models/RevisionSchedule');
const RevisionSlot = require('../models/RevisionSlot');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const Flashcard = require('../models/Flashcard');
const Progress = require('../models/Progress');
const { calculateSubjectReadiness } = require('./readinessCalculator');

// ── Constants ────────────────────────────────────────────────────────────

/** Spaced repetition intervals in days (SM-2 inspired). */
const SPACED_REPETITION_INTERVALS = [1, 3, 7, 14, 30];

/** Activity durations in minutes for each type. */
const ACTIVITY_DURATIONS = {
  review_flashcards: 20,
  practice_quiz: 30,
  read_notes: 25,
  solve_pyq: 40,
  deep_dive: 60,
  light_review: 15,
  mixed: 30,
};

/** Priority thresholds based on readiness score. */
const PRIORITY_THRESHOLDS = {
  critical: 0.3,   // readiness < 30%
  high: 0.5,       // readiness < 50%
  medium: 0.7,     // readiness < 70%
  low: 1.0,        // readiness >= 70%
};

/** Allowed activity types by priority level. */
const ACTIVITIES_BY_PRIORITY = {
  critical: ['deep_dive', 'practice_quiz', 'solve_pyq'],
  high: ['practice_quiz', 'deep_dive', 'read_notes'],
  medium: ['mixed', 'review_flashcards', 'practice_quiz'],
  low: ['light_review', 'review_flashcards', 'mixed'],
};

// ── Schedule Generation ──────────────────────────────────────────────────

/**
 * Generate an optimized revision schedule for a user.
 *
 * Algorithm:
 * 1. Fetch all subjects and compute current readiness scores.
 * 2. Calculate days remaining until exam.
 * 3. Determine daily available time budget.
 * 4. Distribute revision slots across available days, weighted by
 *    readiness gaps (lower readiness = more slots and higher priority).
 * 5. Apply spaced repetition scheduling for previously revised topics.
 *
 * @param {string} userId
 * @param {object} options - { examDate, dailyStudyHours }
 * @returns {Promise<RevisionSchedule>}
 */
async function generateSchedule(userId, { examDate, dailyStudyHours = 3 }) {
  // Fetch subjects with readiness data
  const subjects = await Subject.findAll({ where: { user: userId } });
  if (subjects.length === 0) {
    throw new Error('No subjects found. Add subjects before generating a revision schedule.');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(23, 59, 59, 999);

  const daysRemaining = Math.max(1, Math.ceil((exam - today) / (1000 * 60 * 60 * 24)));

  // Compute readiness for each subject
  const subjectData = [];
  let totalReadiness = 0;

  for (const sub of subjects) {
    const metrics = await calculateSubjectReadiness(userId, sub.id);
    const readiness = metrics.readinessScore / 100; // normalize to 0-1
    totalReadiness += readiness;

    // Count weak topics (progress < 50%)
    const topics = await Topic.findAll({ where: { subject: sub.id } });
    const progresses = await Progress.findAll({
      where: { user: userId, topic: topics.map((t) => t.id) },
    });

    const weakTopics = topics.filter((t) => {
      const prog = progresses.find((p) => String(p.topic) === String(t.id));
      return !prog || (prog.completionPercentage || 0) < 50;
    });

    subjectData.push({
      subjectId: sub.id,
      subjectName: sub.name,
      readiness,
      readinessScore: metrics.readinessScore,
      totalTopics: topics.length,
      weakTopicCount: weakTopics.length,
      weakTopics: weakTopics.map((t) => t.id),
      allTopics: topics.map((t) => t.id),
      topicNames: topics.reduce((acc, t) => {
        acc[t.id] = t.name;
        return acc;
      }, {}),
    });
  }

  const avgReadiness = subjects.length > 0 ? totalReadiness / subjects.length : 0;

  // Create the schedule record
  const schedule = await RevisionSchedule.create({
    user: userId,
    title: `Revision Plan — ${daysRemaining} days to exam`,
    examDate: examDate,
    startDate: today.toISOString().split('T')[0],
    dailyStudyHours,
    status: 'active',
    averageReadinessAtStart: Math.round(avgReadiness * 100),
    currentReadiness: Math.round(avgReadiness * 100),
    subjectWeights: computeSubjectWeights(subjectData),
  });

  // Generate slots
  const slots = await generateSlots(schedule, subjectData, daysRemaining, dailyStudyHours, today, userId);

  // Bulk create slots
  const createdSlots = await RevisionSlot.bulkCreate(slots);

  // Update schedule counts
  schedule.totalSlots = createdSlots.length;
  await schedule.save();

  return schedule;
}

/**
 * Generate the individual revision slots for the schedule.
 */
async function generateSlots(schedule, subjectData, daysRemaining, dailyHours, startDate, userId) {
  const slots = [];
  let currentDate = new Date(startDate);

  // Calculate how many 30-min slots per day
  const slotsPerDay = Math.floor((dailyHours * 60) / 30);

  // Build a priority queue of subjects sorted by readiness gap (lowest first)
  const sortedSubjects = [...subjectData].sort((a, b) => a.readiness - b.readiness);

  // Calculate total revision weight
  const totalWeight = sortedSubjects.reduce((sum, s) => {
    const gap = 1 - s.readiness;
    const weaknessBonus = s.weakTopicCount / Math.max(s.totalTopics, 1);
    return sum + gap * 0.7 + weaknessBonus * 0.3;
  }, 0);

  // Track revision counts per subject for spaced repetition scheduling
  const revisionCounts = {};
  for (const sub of sortedSubjects) {
    revisionCounts[sub.subjectId] = 0;
  }

  // Distribute slots across days
  for (let dayOffset = 0; dayOffset < daysRemaining; dayOffset++) {
    const slotDate = new Date(startDate);
    slotDate.setDate(slotDate.getDate() + dayOffset);

    // Don't schedule on the exam day itself
    if (dayOffset === daysRemaining - 1) break;

    let dailyMinutesBudget = dailyHours * 60;

    for (const subject of sortedSubjects) {
      if (dailyMinutesBudget <= 0) break;

      const gap = 1 - subject.readiness;
      const weaknessBonus = subject.weakTopicCount / Math.max(subject.totalTopics, 1);
      const weight = totalWeight > 0 ? (gap * 0.7 + weaknessBonus * 0.3) / totalWeight : 1 / sortedSubjects.length;

      // Calculate how many minutes this subject deserves today
      const subjectMinutes = Math.round(dailyHours * 60 * weight);
      const allocatedMinutes = Math.min(subjectMinutes, dailyMinutesBudget);

      if (allocatedMinutes < 15) continue; // Skip if too little time

      // Determine activity type based on readiness level
      const activityType = selectActivityType(subject.readiness, subject.weakTopicCount > 0);

      // Calculate duration (capped at budget)
      const duration = Math.min(
        ACTIVITY_DURATIONS[activityType] || 30,
        allocatedMinutes
      );

      // Calculate priority
      const priorityScore = computePriorityScore(subject);
      const priority = scoreToPriority(priorityScore);

      // Determine which topic to focus on
      const topicId = selectTopic(subject);

      // Spaced repetition: schedule next review based on interval
      const revNum = (revisionCounts[subject.subjectId] || 0) + 1;
      const srInterval = SPACED_REPETITION_INTERVALS[Math.min(revNum - 1, SPACED_REPETITION_INTERVALS.length - 1)];

      // Skip if this slot falls on a day when spaced repetition says to review
      if (revNum > 1 && dayOffset % srInterval !== 0 && dayOffset !== 0) {
        continue;
      }

      revisionCounts[subject.subjectId] = revNum;

      slots.push({
        scheduleId: schedule.id,
        user: schedule.user,
        subject: subject.subjectId,
        topic: topicId,
        title: buildSlotTitle(subject, activityType),
        description: buildSlotDescription(subject, activityType, revNum),
        scheduledDate: slotDate.toISOString().split('T')[0],
        startTime: selectStartTime(slotsPerDay, slots.length),
        durationMinutes: duration,
        activityType,
        priority,
        priorityScore,
        readinessAtCreation: subject.readinessScore,
        spacedRepetitionInterval: srInterval,
        revisionNumber: revNum,
        metadata: {
          subjectName: subject.subjectName,
          weakTopics: subject.weakTopics,
          readinessGap: Math.round((1 - subject.readiness) * 100),
        },
      });

      dailyMinutesBudget -= duration;
    }
  }

  return slots;
}

// ── Scoring & Selection ──────────────────────────────────────────────────

/**
 * Compute a subject weight map for the schedule metadata.
 */
function computeSubjectWeights(subjectData) {
  const weights = {};
  for (const sub of subjectData) {
    const gap = 1 - sub.readiness;
    const weaknessBonus = sub.weakTopicCount / Math.max(sub.totalTopics, 1);
    weights[sub.subjectId] = {
      name: sub.subjectName,
      readiness: sub.readinessScore,
      weight: Math.round((gap * 0.7 + weaknessBonus * 0.3) * 100),
      weakTopics: sub.weakTopicCount,
      totalTopics: sub.totalTopics,
    };
  }
  return weights;
}

/**
 * Compute a priority score for a subject (0 = low priority, 1 = critical).
 */
function computePriorityScore(subject) {
  const readinessGap = 1 - subject.readiness;
  const weaknessRatio = subject.weakTopicCount / Math.max(subject.totalTopics, 1);
  return Math.min(1, readinessGap * 0.65 + weaknessRatio * 0.35);
}

/**
 * Map a priority score to a priority level label.
 */
function scoreToPriority(score) {
  if (score >= 0.7) return 'critical';
  if (score >= 0.5) return 'high';
  if (score >= 0.3) return 'medium';
  return 'low';
}

/**
 * Select the best activity type based on readiness and weakness status.
 */
function selectActivityType(readiness, hasWeakTopics) {
  const level =
    readiness < PRIORITY_THRESHOLDS.critical
      ? 'critical'
      : readiness < PRIORITY_THRESHOLDS.high
      ? 'high'
      : readiness < PRIORITY_THRESHOLDS.medium
      ? 'medium'
      : 'low';

  const activities = ACTIVITIES_BY_PRIORITY[level];

  if (hasWeakTopics && (level === 'critical' || level === 'high')) {
    return 'deep_dive';
  }

  return activities[Math.floor(Math.random() * activities.length)];
}

/**
 * Select the most impactful topic from a subject.
 */
function selectTopic(subject) {
  // Prioritize weak topics
  if (subject.weakTopics && subject.weakTopics.length > 0) {
    return subject.weakTopics[Math.floor(Math.random() * subject.weakTopics.length)];
  }
  // Fall back to any topic
  if (subject.allTopics && subject.allTopics.length > 0) {
    return subject.allTopics[Math.floor(Math.random() * subject.allTopics.length)];
  }
  return null;
}

/**
 * Build a human-readable title for a revision slot.
 */
function buildSlotTitle(subject, activityType) {
  const activityLabels = {
    review_flashcards: 'Flashcard Review',
    practice_quiz: 'Practice Quiz',
    read_notes: 'Read Notes',
    solve_pyq: 'PYQ Practice',
    deep_dive: 'Deep Dive',
    light_review: 'Light Review',
    mixed: 'Mixed Review',
  };
  return `${activityLabels[activityType] || 'Review'}: ${subject.subjectName}`;
}

/**
 * Build a description with context for the slot.
 */
function buildSlotDescription(subject, activityType, revisionNumber) {
  const gap = Math.round((1 - subject.readiness) * 100);
  const parts = [`Revision #${revisionNumber} for ${subject.subjectName}`];

  if (gap > 50) {
    parts.push(`Readiness gap: ${gap}% — focus on fundamentals`);
  } else if (gap > 30) {
    parts.push(`Moderate gap: ${gap}% — reinforce weak areas`);
  } else {
    parts.push(`Strong foundation (${subject.readinessScore}% ready) — light maintenance`);
  }

  if (subject.weakTopicCount > 0) {
    parts.push(`${subject.weakTopicCount} weak topic(s) flagged for attention`);
  }

  return parts.join('. ');
}

/**
 * Select a start time based on time slot index.
 */
function selectStartTime(slotsPerDay, slotIndex) {
  const hours = [8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20, 21];
  const slotInDay = slotIndex % Math.max(slotsPerDay, 1);
  const hour = hours[slotInDay % hours.length];
  return `${String(hour).padStart(2, '0')}:00`;
}

// ── Slot Management ──────────────────────────────────────────────────────

/**
 * Mark a revision slot as completed.
 */
async function completeSlot(userId, slotId, { readinessAfter, notes } = {}) {
  const slot = await RevisionSlot.findOne({
    where: { id: slotId, user: userId },
  });

  if (!slot) throw new NotFoundError('Revision slot not found');
  if (slot.status === 'completed') throw new Error('Slot already completed');

  slot.status = 'completed';
  slot.completedAt = new Date();
  if (readinessAfter !== undefined) slot.readinessAfter = readinessAfter;
  if (notes) slot.notes = notes;

  await slot.save();

  // Update schedule progress
  const schedule = await RevisionSchedule.findByPk(slot.scheduleId);
  if (schedule) {
    schedule.completedSlots = await RevisionSlot.count({
      where: { scheduleId: schedule.id, status: 'completed' },
    });
    schedule.overallProgress = schedule.totalSlots > 0
      ? Math.round((schedule.completedSlots / schedule.totalSlots) * 100)
      : 0;
    await schedule.save();
  }

  return slot;
}

/**
 * Skip a revision slot.
 */
async function skipSlot(userId, slotId) {
  const slot = await RevisionSlot.findOne({
    where: { id: slotId, user: userId },
  });

  if (!slot) throw new NotFoundError('Revision slot not found');

  slot.status = 'skipped';
  await slot.save();
  return slot;
}

/**
 * Reschedule a slot to a new date.
 */
async function rescheduleSlot(userId, slotId, newDate) {
  const slot = await RevisionSlot.findOne({
    where: { id: slotId, user: userId },
  });

  if (!slot) throw new NotFoundError('Revision slot not found');

  slot.scheduledDate = newDate;
  slot.status = 'rescheduled';
  await slot.save();
  return slot;
}

// ── Queries ──────────────────────────────────────────────────────────────

/**
 * Get all schedules for a user.
 */
async function getUserSchedules(userId, { status, page = 1, limit = 10 } = {}) {
  const where = { user: userId };
  if (status) where.status = status;

  const offset = (Math.max(1, page) - 1) * limit;

  const { count, rows: schedules } = await RevisionSchedule.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    offset,
    limit,
  });

  return {
    schedules,
    pagination: {
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      limit,
    },
  };
}

/**
 * Get a single schedule with its slots.
 */
async function getScheduleById(userId, scheduleId) {
  const schedule = await RevisionSchedule.findOne({
    where: { id: scheduleId, user: userId },
  });

  if (!schedule) return null;

  const slots = await RevisionSlot.findAll({
    where: { scheduleId: schedule.id },
    order: [['scheduledDate', 'ASC'], ['startTime', 'ASC']],
  });

  return { schedule, slots };
}

/**
 * Get today's revision slots for a user.
 */
async function getTodaysSlots(userId, scheduleId) {
  const today = new Date().toISOString().split('T')[0];

  const where = {
    user: userId,
    scheduledDate: today,
    status: { [Op.in]: ['pending', 'in_progress'] },
  };

  if (scheduleId) where.scheduleId = scheduleId;

  const slots = await RevisionSlot.findAll({
    where,
    order: [['priorityScore', 'DESC'], ['startTime', 'ASC']],
  });

  return slots;
}

/**
 * Get slots for a date range (for calendar view).
 */
async function getSlotsForDateRange(userId, startDate, endDate, scheduleId) {
  const where = {
    user: userId,
    scheduledDate: { [Op.between]: [startDate, endDate] },
  };

  if (scheduleId) where.scheduleId = scheduleId;

  const slots = await RevisionSlot.findAll({
    where,
    order: [['scheduledDate', 'ASC'], ['startTime', 'ASC']],
  });

  return slots;
}

/**
 * Auto-expire overdue slots and schedules.
 */
async function expireOverdue() {
  const today = new Date().toISOString().split('T')[0];

  // Expire slots whose date has passed and are still pending
  const [expiredSlots] = await RevisionSlot.update(
    { status: 'skipped' },
    {
      where: {
        status: 'pending',
        scheduledDate: { [Op.lt]: today },
      },
    }
  );

  // Expire schedules past their exam date
  const [expiredSchedules] = await RevisionSchedule.update(
    { status: 'expired' },
    {
      where: {
        status: 'active',
        examDate: { [Op.lt]: today },
      },
    }
  );

  return { expiredSlots, expiredSchedules };
}

// ── Helpers ──────────────────────────────────────────────────────────────

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

module.exports = {
  generateSchedule,
  completeSlot,
  skipSlot,
  rescheduleSlot,
  getUserSchedules,
  getScheduleById,
  getTodaysSlots,
  getSlotsForDateRange,
  expireOverdue,
  computePriorityScore,
  scoreToPriority,
  selectActivityType,
  buildSlotTitle,
  SPACED_REPETITION_INTERVALS,
  ACTIVITY_DURATIONS,
  PRIORITY_THRESHOLDS,
  ACTIVITIES_BY_PRIORITY,
  NotFoundError,
};
