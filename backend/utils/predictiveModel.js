/**
 * Predictive Exam Readiness Score Model
 * Calculates current readiness, historical velocity trajectory, and projected score based on daily study hours simulation.
 */

function calculateReadinessProjection({
  attempts = [],
  topics = [],
  targetExamDate = null,
  dailyHours = 2,
  targetScore = 85,
}) {
  if (!attempts || attempts.length < 3) {
    return {
      insufficientData: true,
      message: 'Insufficient attempt data to model projection. Complete at least 3 quizzes to view trajectory.',
      minimumAttemptsRequired: 3,
      currentAttemptCount: attempts ? attempts.length : 0,
    };
  }

  // 1. Sort attempts by date ascending
  const sorted = [...attempts].sort(
    (a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date)
  );

  const now = new Date();

  // 2. Exponential decay weighted current readiness score
  let totalWeightedScore = 0;
  let totalWeight = 0;
  const HALF_LIFE_DAYS = 14;
  const DECAY_LAMBDA = Math.LN2 / HALF_LIFE_DAYS;

  sorted.forEach((att) => {
    const scorePct = att.scorePercentage || (att.score && att.maxScore ? (att.score / att.maxScore) * 100 : att.score || 0);
    const attDate = new Date(att.createdAt || att.date || now);
    const ageInDays = Math.max(0, (now - attDate) / (1000 * 60 * 60 * 24));
    const weight = Math.exp(-DECAY_LAMBDA * ageInDays);

    totalWeightedScore += scorePct * weight;
    totalWeight += weight;
  });

  const currentReadiness = Math.round(totalWeight > 0 ? totalWeightedScore / totalWeight : 50);

  // 3. Historical score velocity (% change per day)
  const firstAttDate = new Date(sorted[0].createdAt || sorted[0].date || now);
  const daysDiff = Math.max(1, (now - firstAttDate) / (1000 * 60 * 60 * 24));
  const firstScore = sorted[0].scorePercentage || (sorted[0].score && sorted[0].maxScore ? (sorted[0].score / sorted[0].maxScore) * 100 : sorted[0].score || 50);
  const lastScore = sorted[sorted.length - 1].scorePercentage || (sorted[sorted.length - 1].score && sorted[sorted.length - 1].maxScore ? (sorted[sorted.length - 1].score / sorted[sorted.length - 1].maxScore) * 100 : sorted[sorted.length - 1].score || currentReadiness);
  
  const dailyVelocity = Math.max(-0.5, Math.min(2.0, (lastScore - firstScore) / daysDiff));

  // 4. Target Exam Date calculation
  let examDateObj = targetExamDate ? new Date(targetExamDate) : null;
  if (!examDateObj || isNaN(examDateObj.getTime()) || examDateObj <= now) {
    examDateObj = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // default 30 days out
  }

  const daysRemaining = Math.max(1, Math.round((examDateObj - now) / (1000 * 60 * 60 * 24)));

  // 5. Daily study hours simulator impact (+2.5% per hour above baseline 2 hrs/day)
  const hoursBaseline = 2;
  const hoursImpact = (dailyHours - hoursBaseline) * 2.5;

  const rawProjectedScore = currentReadiness + dailyVelocity * daysRemaining + hoursImpact;
  const projectedScore = Math.min(98, Math.max(20, Math.round(rawProjectedScore)));

  // 6. Risk Status Determination
  const isAtRisk = projectedScore < targetScore;
  const scoreGap = targetScore - projectedScore;

  // 7. Trajectory Data Points for Chart (Historical + Projected)
  const trajectoryPoints = [];
  
  // Historical points
  sorted.forEach((att, idx) => {
    const dateStr = new Date(att.createdAt || att.date).toLocaleDateString([], { month: 'short', day: 'numeric' });
    const scorePct = Math.round(att.scorePercentage || (att.score && att.maxScore ? (att.score / att.maxScore) * 100 : att.score || 0));
    trajectoryPoints.push({
      label: dateStr,
      historicalScore: scorePct,
      projectedScore: null,
      type: 'historical',
    });
  });

  // Current Date anchor point
  const todayStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
  trajectoryPoints.push({
    label: `Today (${todayStr})`,
    historicalScore: currentReadiness,
    projectedScore: currentReadiness,
    type: 'anchor',
  });

  // Future projection points (midpoint and exam date)
  const midDays = Math.round(daysRemaining / 2);
  const midDate = new Date(now.getTime() + midDays * 24 * 60 * 60 * 1000);
  const midScore = Math.min(98, Math.max(20, Math.round(currentReadiness + dailyVelocity * midDays + hoursImpact * 0.5)));

  trajectoryPoints.push({
    label: midDate.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    historicalScore: null,
    projectedScore: midScore,
    type: 'projected',
  });

  trajectoryPoints.push({
    label: `Exam Date (${examDateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })})`,
    historicalScore: null,
    projectedScore: projectedScore,
    type: 'projected',
  });

  // 8. Top 3 Weakness Recommendations to close gap
  const recommendedTopics = (topics || [])
    .slice(0, 3)
    .map((t) => ({
      id: t.id || t._id,
      name: t.name || 'High Weightage Topic',
      scoreBumpPotential: '+4-6% readiness bump',
    }));

  if (recommendedTopics.length === 0) {
    recommendedTopics.push(
      { name: 'Core Foundations & Practice PYQs', scoreBumpPotential: '+5% score bump' },
      { name: 'Timed Formula & Definition Drills', scoreBumpPotential: '+4% score bump' },
      { name: 'High-Frequency Weakness Areas', scoreBumpPotential: '+3% score bump' }
    );
  }

  return {
    insufficientData: false,
    currentReadiness,
    targetScore,
    projectedScore,
    daysRemaining,
    dailyHours,
    dailyVelocity: Number(dailyVelocity.toFixed(2)),
    status: isAtRisk ? 'AT_RISK' : 'ON_TRACK',
    statusLabel: isAtRisk ? 'Target Score at Risk' : 'On Track to Reach Target',
    scoreGap: isAtRisk ? scoreGap : 0,
    trajectoryPoints,
    recommendedTopics,
  };
}

module.exports = {
  calculateReadinessProjection,
};
