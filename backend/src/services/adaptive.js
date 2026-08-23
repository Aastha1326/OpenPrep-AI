/**
 * Adaptive Difficulty Engine Service
 *
 * Recalculates user skill scores and determines personalized difficulty levels
 * based on recent accuracy and weighted question difficulty.
 */

const DIFFICULTY_RATINGS = {
  Easy: 800,
  Medium: 1000,
  Hard: 1200,
};

const K_FACTOR = 32;
const MAX_HISTORY_LENGTH = 20;

/**
 * Maps numerical difficulty string or rating to Elo-style rating
 * @param {string|number} difficulty
 * @returns {number}
 */

function getDifficultyRating(difficulty) {
  if (typeof difficulty === 'number') return difficulty;
  if (!difficulty) return DIFFICULTY_RATINGS.Medium;
  const key = String(difficulty).trim();
  const normalizedKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
  return DIFFICULTY_RATINGS[normalizedKey] || DIFFICULTY_RATINGS.Medium;
}

/**
 * Maps skillScore to discrete difficulty tier ('Easy' | 'Medium' | 'Hard')
 * @param {number} skillScore
 * @returns {'Easy' | 'Medium' | 'Hard'}
 */
function getDifficultyFromSkill(skillScore) {
  const score = Number(skillScore) || 1000;
  if (score < 900) return 'Easy';
  if (score > 1150) return 'Hard';
  return 'Medium';
}

/**
 * Calculates updated skill score based on current skill and recent answer outcome
 * @param {number} currentSkillScore
 * @param {Object} answerDetails
 * @param {string|number} answerDetails.difficulty
 * @param {boolean} answerDetails.isCorrect
 * @returns {number}
 */
function calculateSkillScore(currentSkillScore, { difficulty, isCorrect }) {
  const currentSkill = typeof currentSkillScore === 'number' && !isNaN(currentSkillScore)
    ? currentSkillScore
    : 1000;

  const questionRating = getDifficultyRating(difficulty);
  const expected = 1 / (1 + Math.pow(10, (questionRating - currentSkill) / 400));
  const actual = isCorrect ? 1 : 0;

  const newScore = currentSkill + K_FACTOR * (actual - expected);
  return Math.round(newScore * 10) / 10;
}

/**
 * Records an answer outcome in user's history and updates skillScore
 * @param {Object} user - User model instance or object
 * @param {Object} answerData - { questionId, difficulty, isCorrect, timeSpentMs }
 * @returns {Object} { skillScore, difficulty, recentAnswerHistory }
 */
async function recordAnswerAndAdjustSkill(user, answerData) {
  if (!user) {
    throw new Error('User object is required to update adaptive skill');
  }

  const currentScore = user.skillScore !== undefined && user.skillScore !== null
    ? Number(user.skillScore)
    : 1000;

  const questionDifficulty = answerData.difficulty || 'Medium';
  const isCorrect = Boolean(answerData.isCorrect);

  const updatedSkillScore = calculateSkillScore(currentScore, {
    difficulty: questionDifficulty,
    isCorrect,
  });

  const history = Array.isArray(user.recentAnswerHistory) ? [...user.recentAnswerHistory] : [];
  history.push({
    questionId: answerData.questionId || null,
    difficulty: questionDifficulty,
    isCorrect,
    timestamp: new Date().toISOString(),
  });

  if (history.length > MAX_HISTORY_LENGTH) {
    history.shift();
  }

  user.skillScore = updatedSkillScore;
  user.recentAnswerHistory = history;

  if (typeof user.save === 'function') {
    await user.save();
  }

  const targetDifficulty = getDifficultyFromSkill(updatedSkillScore);

  return {
    skillScore: updatedSkillScore,
    difficulty: targetDifficulty,
    recentAnswerHistory: history,
  };
}

module.exports = {
  DIFFICULTY_RATINGS,
  getDifficultyRating,
  getDifficultyFromSkill,
  calculateSkillScore,
  recordAnswerAndAdjustSkill,
};
