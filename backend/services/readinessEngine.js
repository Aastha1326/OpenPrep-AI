const { Subject, QuizAttempt, Quiz, Syllabus, SyllabusTopic, StudyPlan } = require('../models');
const logger = require('../utils/logger');

/**
 * Calculates student exam readiness projections per subject and overall,
 * using least-squares linear curve fitting to model performance trajectory.
 */
async function calculateReadinessProjection({
  userId,
  targetExamDate = null,
  dailyHours = 2,
  targetScore = 85,
}) {
  const now = new Date();

  // 1. Fetch user subjects
  const subjects = await Subject.findAll({ where: { user: userId } });
  if (subjects.length === 0) {
    return { insufficientData: true, message: 'No subjects created. Please create a subject first.' };
  }

  // 2. Fetch all quiz attempts with subject associations
  const attempts = await QuizAttempt.findAll({
    where: { user: userId },
    include: [
      {
        model: Quiz,
        as: 'quizRef',
        include: [{ model: Subject, as: 'subjectRef' }],
      },
    ],
    order: [['createdAt', 'ASC']],
  });

  if (attempts.length < 3) {
    return {
      insufficientData: true,
      message: 'Insufficient attempt data to model projection. Complete at least 3 quizzes to view trajectory.',
      minimumAttemptsRequired: 3,
      currentAttemptCount: attempts.length,
    };
  }

  // Group attempts by subjectId
  const attemptsBySubject = {};
  attempts.forEach((att) => {
    const subId = att.quizRef && att.quizRef.subject;
    if (subId) {
      if (!attemptsBySubject[subId]) {
        attemptsBySubject[subId] = [];
      }
      attemptsBySubject[subId].push(att);
    }
  });

  const subjectProjections = [];
  let totalScoreSum = 0;
  let maxMasteryTime = now.getTime();
  let hasInsufficientSubjectData = false;

  for (const sub of subjects) {
    const subAttempts = attemptsBySubject[sub.id] || [];

    let currentReadiness = 50; // default initial score
    let slope = 0.5; // default positive trend rate (% per day)
    let intercept = 50;

    if (subAttempts.length >= 3) {
      const firstDate = new Date(subAttempts[0].createdAt);
      const x = [];
      const y = [];

      subAttempts.forEach((att) => {
        const days = Math.max(0, (new Date(att.createdAt) - firstDate) / (1000 * 60 * 60 * 24));
        const pct = att.totalQuestions > 0 ? (att.score / att.totalQuestions) * 100 : att.score || 0;
        x.push(days);
        y.push(pct);
      });

      // Least-squares regression: y = m*x + c
      const n = subAttempts.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumXX += x[i] * x[i];
      }

      const denominator = n * sumXX - sumX * sumX;
      slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0.5;
      intercept = (sumY - slope * sumX) / n;

      // Clamp slope within reasonable parameters [-1.5% to +4.0% per day]
      slope = Math.max(-1.5, Math.min(4.0, slope));

      const daysSinceFirst = Math.max(0, (now - firstDate) / (1000 * 60 * 60 * 24));
      currentReadiness = Math.min(100, Math.max(0, Math.round(slope * daysSinceFirst + intercept)));
    } else if (subAttempts.length > 0) {
      // Calculate simple average for few attempts
      const sum = subAttempts.reduce((acc, att) => acc + (att.totalQuestions > 0 ? (att.score / att.totalQuestions) * 100 : att.score || 0), 0);
      currentReadiness = Math.round(sum / subAttempts.length);
      intercept = currentReadiness;
    }

    // Impact of extra dailyHours study (+1.5% per hour above baseline of 2 hours/day)
    const extraHours = Math.max(0, dailyHours - 2);
    const studyHoursBonus = extraHours * 1.5;
    currentReadiness = Math.min(99, Math.round(currentReadiness + studyHoursBonus));

    // Extrapolate projected mastery date (reaches targetScore)
    let projectedMasteryDate = null;
    if (currentReadiness >= targetScore) {
      projectedMasteryDate = new Date(now);
    } else if (slope <= 0) {
      // If flat or degrading, project target date to a default far-off value (e.g. 6 months)
      projectedMasteryDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    } else {
      const daysToMastery = (targetScore - currentReadiness) / slope;
      projectedMasteryDate = new Date(now.getTime() + daysToMastery * 24 * 60 * 60 * 1000);
    }

    if (projectedMasteryDate && projectedMasteryDate.getTime() > maxMasteryTime) {
      maxMasteryTime = projectedMasteryDate.getTime();
    }

    totalScoreSum += currentReadiness;
    subjectProjections.push({
      subjectId: sub.id,
      subjectName: sub.name,
      readinessScore: currentReadiness,
      projectedMasteryDate: projectedMasteryDate ? projectedMasteryDate.toLocaleDateString() : 'N/A',
      slope: Number(slope.toFixed(3)),
    });
  }

  // 3. Compute Study Velocity (Syllabus items cleared per week)
  const syllabuses = await Syllabus.findAll({ where: { userId } });
  const syllabusIds = syllabuses.map(s => s.id);
  
  let totalTopics = 0;
  let coveredTopics = 0;

  if (syllabusIds.length > 0) {
    totalTopics = await SyllabusTopic.count({ where: { syllabusId: syllabusIds } });
    coveredTopics = await SyllabusTopic.count({ where: { syllabusId: syllabusIds, coverageStatus: 'Covered' } });
  }

  // Compute weeks elapsed in active StudyPlan
  const activePlan = await StudyPlan.findOne({ where: { user: userId, status: 'active' } });
  let weeksElapsed = 2; // default fallback window
  if (activePlan) {
    const start = new Date(activePlan.startDate);
    weeksElapsed = Math.max(1, (now - start) / (1000 * 60 * 60 * 24 * 7));
  }
  const studyVelocity = parseFloat((coveredTopics / weeksElapsed).toFixed(2)) || 1.5;

  // 4. Overall projections & status mapping
  const overallReadiness = subjects.length > 0 ? Math.round(totalScoreSum / subjects.length) : 0;
  const overallProjectedMasteryDate = new Date(maxMasteryTime);

  let examDateObj = targetExamDate ? new Date(targetExamDate) : null;
  if (!examDateObj || isNaN(examDateObj.getTime())) {
    if (activePlan) {
      examDateObj = new Date(activePlan.endDate);
    } else {
      examDateObj = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default
    }
  }

  const isAtRisk = overallProjectedMasteryDate > examDateObj || overallReadiness < targetScore;

  return {
    insufficientData: false,
    overallReadiness,
    projectedMasteryDate: overallProjectedMasteryDate.toLocaleDateString(),
    studyVelocity,
    status: isAtRisk ? 'AT_RISK' : 'ON_TRACK',
    statusLabel: isAtRisk ? 'Target Score at Risk' : 'On Track to Reach Target',
    targetExamDate: examDateObj.toLocaleDateString(),
    targetScore,
    subjects: subjectProjections,
  };
}

module.exports = {
  calculateReadinessProjection,
};
