const { Topic, Progress, Quiz, QuizAttempt, Flashcard, StudyPlan } = require('../models');

/**
 * Relative weight of each component in the Exam Readiness Index. Kept in one
 * place so the weights and the components can never drift apart.
 */
const WEIGHTS = {
  syllabusCoverage: 0.3,
  quizAccuracy: 0.3,
  memoryRetention: 0.25,
  studyVelocity: 0.15,
};

/** Velocity reported when the user has no active study plan to measure against. */
const DEFAULT_STUDY_VELOCITY = 50;

/**
 * SM-2 easiness bounds. utils/sm2.js enforces the 1.3 floor but no ceiling, so
 * a well-drilled card's efactor keeps climbing past 3.0. Retention is a
 * percentage, so the value is clamped here before it is mapped onto 0-100.
 */
const MIN_EFACTOR = 1.3;
const MAX_EFACTOR = 3.0;
const DEFAULT_EFACTOR = 2.5;

/** Repetitions at which a card counts as fully drilled for the retention score. */
const REPETITIONS_FOR_FULL_SCORE = 5;

const clampPercent = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
};

/**
 * Coerce to a finite number, falling back for anything absent or unusable.
 * null and '' are treated as missing rather than as zero — Number(null) is 0,
 * which would quietly read a card with no easiness factor as the worst
 * possible one instead of an unrated one.
 */
const toFiniteNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Share of the subject's topics the user has worked through.
 *
 * A topic can carry more than one Progress row (subject-level and topic-level
 * flashcard reviews both upsert one). Summing them all and dividing by the
 * topic count pushes coverage past 100, so the best row per topic wins.
 */
const computeSyllabusCoverage = (topics = [], progresses = []) => {
  if (!topics.length) return 0;

  const bestByTopic = new Map();
  for (const progress of progresses) {
    const topicId = String(progress.topic);
    const percentage = clampPercent(toFiniteNumber(progress.completionPercentage));
    const current = bestByTopic.get(topicId);
    if (current === undefined || percentage > current) {
      bestByTopic.set(topicId, percentage);
    }
  }

  let total = 0;
  for (const topic of topics) {
    total += bestByTopic.get(String(topic.id)) || 0;
  }

  return Math.round(clampPercent(total / topics.length));
};

/**
 * Mean quiz accuracy, weighted by quiz length.
 *
 * QuizAttempt.score is a percentage — quizController stores
 * `Math.round((earned / max) * 100)`. Treating it as a count of correct
 * answers and dividing by the question total inflates the result by roughly
 * the number of questions per quiz, which is how this metric came to report
 * 1000% for a student with three perfect ten-question quizzes.
 *
 * Weighting by question count keeps a 50-question quiz worth more than a
 * 5-question one without ever leaving the 0-100 range.
 */
const computeQuizAccuracy = (attempts = []) => {
  let weightedScore = 0;
  let totalQuestions = 0;

  for (const attempt of attempts) {
    const questions = Math.max(0, toFiniteNumber(attempt.totalQuestions, 0));
    if (questions === 0) continue;

    const scorePercent = clampPercent(toFiniteNumber(attempt.score, 0));
    weightedScore += scorePercent * questions;
    totalQuestions += questions;
  }

  if (totalQuestions === 0) return 0;

  return Math.round(clampPercent(weightedScore / totalQuestions));
};

/**
 * Spaced-repetition retention, from SM-2 easiness and repetition depth.
 *
 * A card with a missing or non-numeric efactor falls back to the model default
 * rather than turning the whole subject's readiness into NaN.
 */
const computeMemoryRetention = (flashcards = []) => {
  if (!flashcards.length) return 0;

  const total = flashcards.reduce((sum, card) => {
    const efactor = Math.min(
      MAX_EFACTOR,
      Math.max(MIN_EFACTOR, toFiniteNumber(card.efactor, DEFAULT_EFACTOR))
    );
    const efactorScore = ((efactor - MIN_EFACTOR) / (MAX_EFACTOR - MIN_EFACTOR)) * 100;

    const repetitions = Math.max(0, toFiniteNumber(card.repetitions, 0));
    const repScore = Math.min(100, (repetitions / REPETITIONS_FOR_FULL_SCORE) * 100);

    return sum + (efactorScore * 0.6 + repScore * 0.4);
  }, 0);

  return Math.round(clampPercent(total / flashcards.length));
};

/** Share of the active plan's daily goals the user has ticked off. */
const computeStudyVelocity = (studyPlan) => {
  const goals = studyPlan && Array.isArray(studyPlan.dailyGoals) ? studyPlan.dailyGoals : null;
  if (!goals || goals.length === 0) return DEFAULT_STUDY_VELOCITY;

  const completed = goals.filter((goal) => goal && goal.completed).length;
  return Math.round(clampPercent((completed / goals.length) * 100));
};

/** Weighted blend of the four components, clamped to a reportable percentage. */
const computeReadinessScore = ({
  syllabusCoverage = 0,
  quizAccuracy = 0,
  memoryRetention = 0,
  studyVelocity = 0,
} = {}) =>
  Math.round(
    clampPercent(
      clampPercent(syllabusCoverage) * WEIGHTS.syllabusCoverage +
        clampPercent(quizAccuracy) * WEIGHTS.quizAccuracy +
        clampPercent(memoryRetention) * WEIGHTS.memoryRetention +
        clampPercent(studyVelocity) * WEIGHTS.studyVelocity
    )
  );

/**
 * Calculates dynamic readiness metrics for a user in a specific subject.
 *
 * @param {string} userId
 * @param {string} subjectId
 * @param {object} [deps] Injected models, for tests.
 * @returns {Promise<{ syllabusCoverage: number, quizAccuracy: number, memoryRetention: number, studyVelocity: number, readinessScore: number }>}
 */
const calculateSubjectReadiness = async (userId, subjectId, deps = {}) => {
  const topicModel = deps.topicModel || Topic;
  const progressModel = deps.progressModel || Progress;
  const quizModel = deps.quizModel || Quiz;
  const quizAttemptModel = deps.quizAttemptModel || QuizAttempt;
  const flashcardModel = deps.flashcardModel || Flashcard;
  const studyPlanModel = deps.studyPlanModel || StudyPlan;

  const topics = await topicModel.findAll({ where: { subject: subjectId } });

  let progresses = [];
  if (topics.length > 0) {
    progresses = await progressModel.findAll({
      where: { user: userId, topic: topics.map((t) => t.id) },
    });
  }

  const attempts = await quizAttemptModel.findAll({
    where: { user: userId },
    include: [
      {
        model: quizModel,
        as: 'quizRef',
        where: { subject: subjectId },
      },
    ],
  });

  const flashcards = await flashcardModel.findAll({
    where: { user: userId, subject: subjectId },
  });

  const studyPlan = await studyPlanModel.findOne({
    where: { user: userId, status: 'active' },
  });

  const metrics = {
    syllabusCoverage: computeSyllabusCoverage(topics, progresses),
    quizAccuracy: computeQuizAccuracy(attempts),
    memoryRetention: computeMemoryRetention(flashcards),
    studyVelocity: computeStudyVelocity(studyPlan),
  };

  return {
    ...metrics,
    readinessScore: computeReadinessScore(metrics),
  };
};

module.exports = {
  calculateSubjectReadiness,
  computeSyllabusCoverage,
  computeQuizAccuracy,
  computeMemoryRetention,
  computeStudyVelocity,
  computeReadinessScore,
  WEIGHTS,
  DEFAULT_STUDY_VELOCITY,
};
