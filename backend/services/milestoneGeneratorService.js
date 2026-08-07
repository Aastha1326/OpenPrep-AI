const { v4: uuidv4 } = require('uuid');
const { toDateOnlyString } = require('../utils/dateUtils');

const DAY_MS = 24 * 60 * 60 * 1000;

const MILESTONE_TYPES = {
  WEEKLY_CHECKPOINT: 'weekly_checkpoint',
  MID_COURSE_REVIEW: 'mid_course_review',
  FINAL_REVIEW: 'final_review',
  EXAM_DAY: 'exam_day',
};

const MILESTONE_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
};

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Returns the distinct list of topic names covered by the study plan up to
 * (and including) the given date, derived from daily goal tasks.
 */
function topicsCoveredUpTo(dailyGoals, dateStr) {
  const topics = new Set();
  (dailyGoals || []).forEach((goal) => {
    const goalDate = toDateOnlyString(goal?.date);
    if (!goalDate || goalDate > dateStr) return;
    (goal.tasks || []).forEach((task) => {
      const name = task?.topicName || task?.title || task?.topic?.name;
      if (typeof name === 'string' && name.trim()) topics.add(name.trim());
    });
  });
  return [...topics];
}

function makeMilestone({ date, type, title, description, topicCount = 0 }) {
  return {
    id: uuidv4(),
    title,
    date,
    type,
    description,
    status: MILESTONE_STATUS.PENDING,
    topicCount,
  };
}

function buildWeeklyDescription(dateStr, topics) {
  const suffix = topics.length > 0 ? ` Covered so far: ${topics.join(', ')}.` : '';
  return `Weekly checkpoint for ${dateStr}. Review the material studied this week, clear doubts, and take a quick self-test.${suffix}`;
}

function buildMidCourseDescription(dateStr, topics) {
  const suffix = topics.length > 0 ? ` Topics covered so far: ${topics.join(', ')}.` : '';
  return `Mid-course review on ${dateStr}. Assess your overall progress, revisit weak areas, and plan the second half of your preparation.${suffix}`;
}

/**
 * Deterministically generates an exam milestone schedule from a study plan's
 * date range and (optional) daily goals. Produces weekly checkpoints, a
 * mid-course review, a final full revision, and an exam-day milestone.
 *
 * @param {Object} params
 * @param {string|Date} params.startDate Plan start date
 * @param {string|Date} params.endDate   Plan end date (usually the exam date)
 * @param {Array}  [params.dailyGoals]   Plan daily goals used to enrich
 *                                       checkpoint descriptions with coverage
 * @param {string} [params.examName]     Exam name for milestone titles
 * @returns {Array} Sorted milestone objects (earliest first)
 */
function generateMilestones({ startDate, endDate, dailyGoals = [], examName = '' }) {
  const start = toDateOnlyString(startDate);
  const end = toDateOnlyString(endDate);

  if (!start || !end || end < start) return [];

  const startDt = new Date(`${start}T00:00:00`);
  const endDt = new Date(`${end}T00:00:00`);
  const totalDays = Math.round((endDt - startDt) / DAY_MS) + 1;

  const reservedDates = new Set([end]);
  if (totalDays >= 3) {
    reservedDates.add(toDateOnlyString(addDays(endDt, -1)));
  }

  const byDate = {};

  // Weekly checkpoints on day 7, 14, 21, ... of the plan
  const weeklyCount = totalDays >= 7 ? Math.ceil(totalDays / 7) - 1 : 0;
  for (let i = 1; i <= weeklyCount; i += 1) {
    const date = toDateOnlyString(addDays(startDt, i * 7 - 1));
    if (reservedDates.has(date) || date > end || byDate[date]) continue;
    const topics = topicsCoveredUpTo(dailyGoals, date);
    byDate[date] = makeMilestone({
      date,
      type: MILESTONE_TYPES.WEEKLY_CHECKPOINT,
      title: `Week ${i} Checkpoint`,
      description: buildWeeklyDescription(date, topics),
      topicCount: topics.length,
    });
  }

  // Mid-course review at roughly the halfway point
  if (totalDays >= 10) {
    const midDate = toDateOnlyString(addDays(startDt, Math.floor((totalDays - 1) / 2)));
    if (!reservedDates.has(midDate) && !byDate[midDate]) {
      const topics = topicsCoveredUpTo(dailyGoals, midDate);
      byDate[midDate] = makeMilestone({
        date: midDate,
        type: MILESTONE_TYPES.MID_COURSE_REVIEW,
        title: 'Mid-Course Review',
        description: buildMidCourseDescription(midDate, topics),
        topicCount: topics.length,
      });
    }
  }

  // Final full revision the day before the exam
  if (totalDays >= 3) {
    const finalDate = toDateOnlyString(addDays(endDt, -1));
    byDate[finalDate] = makeMilestone({
      date: finalDate,
      type: MILESTONE_TYPES.FINAL_REVIEW,
      title: 'Final Full Revision',
      description: `Final full revision on ${finalDate}${examName ? ` for ${examName}` : ''}. Revise quick notes, solve a practice paper, and rest well before the exam.`,
    });
  }

  // Exam day
  byDate[end] = makeMilestone({
    date: end,
    type: MILESTONE_TYPES.EXAM_DAY,
    title: examName ? `${examName} — Exam Day` : 'Exam Day',
    description: `Exam day on ${end}. Stay calm, review key formulas and notes, and give it your best.`,
  });

  return Object.keys(byDate)
    .sort()
    .map((date) => byDate[date]);
}

module.exports = {
  generateMilestones,
  MILESTONE_TYPES,
  MILESTONE_STATUS,
};
