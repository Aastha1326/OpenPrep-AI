/**
 * Fatigue Engine MVP
 * Calculates a basic heuristic score for cognitive fatigue based on session metrics.
 */
exports.calculateFatigue = ({ sessionDurationMinutes, quizAccuracy, interactionsPerMinute }) => {
  let fatigueScore = 0;
  
  // Base fatigue increases linearly with session time (assuming > 25 mins is tiring)
  if (sessionDurationMinutes > 25) {
    fatigueScore += (sessionDurationMinutes - 25) * 1.5;
  }

  // Dropping accuracy increases fatigue score
  if (quizAccuracy !== undefined && quizAccuracy < 0.6) {
    fatigueScore += 15;
  } else if (quizAccuracy !== undefined && quizAccuracy < 0.8) {
    fatigueScore += 5;
  }

  // Low interaction rate might indicate losing focus
  if (interactionsPerMinute !== undefined && interactionsPerMinute < 2) {
    fatigueScore += 10;
  }

  const isFatigued = fatigueScore > 30;

  return {
    fatigueScore: Math.round(fatigueScore),
    isFatigued,
    recommendation: isFatigued ? 'TAKE_BREAK' : 'CONTINUE',
    message: isFatigued 
      ? "You've been studying hard and your accuracy is dipping. Time for a 5 minute break!" 
      : "You're doing great! Keep it up."
  };
};
