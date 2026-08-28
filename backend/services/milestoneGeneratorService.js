const { v4: uuidv4 } = require('uuid');
const { toDateOnlyString } = require('../utils/dateUtils');

const DAY_MS = 24 * 60 * 60 * 1000;

const MILESTONE_TYPES = {
  FIRST_DAY_START: 'first_day_start',
  WEEKLY_CHECKPOINT: 'weekly_checkpoint',
  MONTHLY_CHECKPOINT: 'monthly_checkpoint',
  QUARTER_COURSE_REVIEW: 'quarter_course_review',
  MID_COURSE_REVIEW: 'mid_course_review',
  THREE_QUARTER_REVIEW: 'three_quarter_review',
  FINAL_REVIEW: 'final_review',
  EXAM_DAY: 'exam_day',
  FIRST_PRACTICE_TEST: 'first_practice_test',
  SUBJECT_MASTERY_1: 'subject_mastery_1',
  SUBJECT_MASTERY_2: 'subject_mastery_2',
  LAST_WEEK_SPRINT: 'last_week_sprint',
  DAY_BEFORE_EXAM: 'day_before_exam',
  POST_EXAM_REFLECTION: 'post_exam_reflection',
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
 * date range and (optional) daily goals. Produces up to 14 milestone types.
 */
function generateMilestones({ startDate, endDate, dailyGoals = [], examName = '' }) {
  const start = toDateOnlyString(startDate);
  const end = toDateOnlyString(endDate);

  if (!start || !end || end < start) return [];

  const startDt = new Date(`${start}T00:00:00`);
  const endDt = new Date(`${end}T00:00:00`);
  const totalDays = Math.round((endDt - startDt) / DAY_MS) + 1;

  const reservedDates = new Set([end]);
  const byDate = {};
  
  // Helper to add milestone safely
  const safelyAddMilestone = (targetDate, type, title, descGenerator) => {
    if (reservedDates.has(targetDate) || byDate[targetDate] || targetDate > end) return false;
    const topics = topicsCoveredUpTo(dailyGoals, targetDate);
    byDate[targetDate] = makeMilestone({
      date: targetDate,
      type,
      title,
      description: descGenerator(topics),
      topicCount: topics.length,
    });
    return true;
  };

  // 1. First Day Start
  if (totalDays > 1) {
    safelyAddMilestone(start, MILESTONE_TYPES.FIRST_DAY_START, 'First Day of Prep', () => `Your preparation for ${examName || 'the exam'} begins today! Stay focused and consistent.`);
  }

  // 2. Weekly Checkpoints & 3. Monthly Checkpoints
  const weeklyCount = totalDays >= 7 ? Math.ceil(totalDays / 7) - 1 : 0;
  for (let i = 1; i <= weeklyCount; i += 1) {
    const date = toDateOnlyString(addDays(startDt, i * 7 - 1));
    if (i % 4 === 0) {
      safelyAddMilestone(date, MILESTONE_TYPES.MONTHLY_CHECKPOINT, `Month ${i/4} Checkpoint`, (t) => `Monthly review for ${date}. Consolidate your learning from the past 4 weeks.`);
    } else {
      safelyAddMilestone(date, MILESTONE_TYPES.WEEKLY_CHECKPOINT, `Week ${i} Checkpoint`, (t) => buildWeeklyDescription(date, t));
    }
  }

  // 4. Quarter Course Review
  if (totalDays >= 14) {
    const q1Date = toDateOnlyString(addDays(startDt, Math.floor(totalDays * 0.25)));
    safelyAddMilestone(q1Date, MILESTONE_TYPES.QUARTER_COURSE_REVIEW, '25% Course Review', () => `You are 25% through your study plan! Great time to check if you are on pace.`);
  }

  // 5. Mid Course Review
  if (totalDays >= 10) {
    const midDate = toDateOnlyString(addDays(startDt, Math.floor(totalDays * 0.5)));
    safelyAddMilestone(midDate, MILESTONE_TYPES.MID_COURSE_REVIEW, 'Mid-Course Review', (t) => buildMidCourseDescription(midDate, t));
  }

  // 6. Three Quarter Review
  if (totalDays >= 14) {
    const q3Date = toDateOnlyString(addDays(startDt, Math.floor(totalDays * 0.75)));
    safelyAddMilestone(q3Date, MILESTONE_TYPES.THREE_QUARTER_REVIEW, '75% Course Review', () => `You are 75% through! The finish line is in sight, push hard.`);
  }

  // 7. First Practice Test (Approx Day 10 or 1/3)
  if (totalDays >= 10) {
    const ptDate = toDateOnlyString(addDays(startDt, Math.floor(totalDays * 0.33)));
    safelyAddMilestone(ptDate, MILESTONE_TYPES.FIRST_PRACTICE_TEST, 'First Practice Test', () => `Take your first full-length practice test to establish a baseline score.`);
  }

  // 8 & 9. Subject Mastery Checkpoints (Arbitrarily placed in the middle)
  if (totalDays >= 20) {
    safelyAddMilestone(toDateOnlyString(addDays(startDt, Math.floor(totalDays * 0.4))), MILESTONE_TYPES.SUBJECT_MASTERY_1, 'Subject Mastery I', () => `Ensure you have fully mastered the first major subject area.`);
    safelyAddMilestone(toDateOnlyString(addDays(startDt, Math.floor(totalDays * 0.6))), MILESTONE_TYPES.SUBJECT_MASTERY_2, 'Subject Mastery II', () => `Ensure you have fully mastered the second major subject area.`);
  }

  // 10. Last Week Sprint
  if (totalDays >= 14) {
    const sprintDate = toDateOnlyString(addDays(endDt, -7));
    safelyAddMilestone(sprintDate, MILESTONE_TYPES.LAST_WEEK_SPRINT, 'Last Week Sprint', () => `One week left! Focus entirely on mock exams and active recall.`);
  }

  // 11. Final Review
  if (totalDays >= 5) {
    const finalDate = toDateOnlyString(addDays(endDt, -2));
    safelyAddMilestone(finalDate, MILESTONE_TYPES.FINAL_REVIEW, 'Final Full Revision', () => `Final full revision on ${finalDate}.`);
  }

  // 12. Day Before Exam
  if (totalDays >= 3) {
    const dayBefore = toDateOnlyString(addDays(endDt, -1));
    reservedDates.add(dayBefore); // Reserve it so it overrides others
    byDate[dayBefore] = makeMilestone({
      date: dayBefore,
      type: MILESTONE_TYPES.DAY_BEFORE_EXAM,
      title: 'Day Before Exam',
      description: `Rest well, eat healthy, and organize your exam materials.`,
    });
  }

  // 13. Exam Day
  byDate[end] = makeMilestone({
    date: end,
    type: MILESTONE_TYPES.EXAM_DAY,
    title: examName ? `${examName} — Exam Day` : 'Exam Day',
    description: `Exam day on ${end}. Stay calm, review key formulas and notes, and give it your best.`,
  });

  // 14. Post Exam Reflection (1 day after)
  const postDate = toDateOnlyString(addDays(endDt, 1));
  byDate[postDate] = makeMilestone({
    date: postDate,
    type: MILESTONE_TYPES.POST_EXAM_REFLECTION,
    title: 'Post-Exam Reflection',
    description: `Take a breath and reflect on your performance. You've earned a break!`,
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
