/**
 * Computes study metrics, velocity vectors, and milestone target balances.
 */
function calculateVelocitySummary(loggedSessions, incompleteTopics, daysRemaining) {
  // 1. Calculate historical 14-day study velocity
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const relevantSessions = loggedSessions.filter(session => new Date(session.timestamp) >= fourteenDaysAgo);
  const totalHoursLogged = relevantSessions.reduce((sum, s) => sum + s.durationHours, 0);
  const currentVelocity = parseFloat((totalHoursLogged / 14).toFixed(2));

  // 2. Aggregate remaining work bounds based on estimated topic durations and weights
  const totalRemainingSyllabusHours = incompleteTopics.reduce((sum, topic) => {
    const baseDuration = topic.estimatedBaseHours || 10;
    const difficultyMultiplier = topic.difficultyRating >= 4 ? 1.5 : 1.0;
    return sum + (baseDuration * difficultyMultiplier);
  }, 0);

  // 3. Compute target execution rate needed to finish before the milestone date
  const rawRequired = totalRemainingSyllabusHours / Math.max(daysRemaining, 1);
  const requiredVelocity = parseFloat(Math.max(rawRequired, 0.5).toFixed(2));

  return {
    currentVelocity,
    requiredVelocity,
    remainingSyllabusHours: totalRemainingSyllabusHours,
    daysRemaining
  };
}

module.exports = { calculateVelocitySummary };
