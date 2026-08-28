const { v4: uuidv4 } = require('uuid');

/**
 * Computer Adaptive Testing (CAT) & 3-Parameter Logistic (3PL) Item Response Theory (IRT) Engine
 * 
 * 3PL Formula: P(theta) = c + (1 - c) / (1 + exp(-a * (theta - b)))
 * theta: Student ability estimate (-3.0 to +3.0)
 * a: Item discrimination parameter (default 1.2)
 * b: Item difficulty parameter (-3.0 to +3.0)
 * c: Item guessing parameter (default 0.25 for 4-option MCQ)
 */

// In-memory active adaptive exam sessions store
const activeSessions = new Map();

// Helper 3PL Probability
const calculate3PLProbability = (theta, a = 1.2, b = 0.0, c = 0.25) => {
  const exponent = -a * (theta - b);
  return c + (1 - c) / (1 + Math.exp(exponent));
};

// Helper Fisher Information Function
const calculateFisherInformation = (theta, a = 1.2, b = 0.0, c = 0.25) => {
  const p = calculate3PLProbability(theta, a, b, c);
  const pMinusC = p - c;
  const oneMinusC = 1 - c;
  const num = (a * a) * (pMinusC * pMinusC) * (1 - p);
  const den = (oneMinusC * oneMinusC) * p;
  return num / Math.max(0.0001, den);
};

// Ability Theta Update (MLE / Bayesian Gradient Step)
const updateAbilityTheta = (currentTheta, isCorrect, a = 1.2, b = 0.0, c = 0.25) => {
  const prob = calculate3PLProbability(currentTheta, a, b, c);
  const learningRate = 0.6; // Scale factor for step size
  const delta = learningRate * a * ((isCorrect ? 1 : 0) - prob);
  const newTheta = currentTheta + delta;
  // Clamp theta between -3.0 and +3.0
  return Math.max(-3.0, Math.min(3.0, Math.round(newTheta * 1000) / 1000));
};

// Generate Mock Question Bank for Adaptive Testing
const generateAdaptiveQuestionBank = (subjectId = 'general') => {
  const questions = [];
  const topics = ['Algebra', 'Calculus', 'Thermodynamics', 'Mechanics', 'Organic Chemistry'];

  for (let i = 1; i <= 20; i++) {
    // Generate difficulty b ranging from -2.5 (easy) to +2.5 (hard)
    const difficulty = Math.round((-2.5 + (i - 1) * 0.26) * 100) / 100;
    const topic = topics[i % topics.length];

    questions.push({
      id: `cat-q-${i}`,
      question: `[Difficulty ${difficulty >= 0 ? '+' : ''}${difficulty}] Solve ${topic} Question ${i}: What is the value of X when parameters are optimized?`,
      options: ['Option A (Correct)', 'Option B', 'Option C', 'Option D'],
      correctOptionIndex: 0,
      a: 1.2, // Discrimination
      b: difficulty, // Difficulty
      c: 0.25, // Guessing
      topic,
    });
  }
  return questions;
};

/**
 * Initialize a new Computer Adaptive Testing (CAT) session
 */
const startSession = (userId, subjectId = 'general', totalQuestions = 10) => {
  const sessionId = uuidv4();
  const questionBank = generateAdaptiveQuestionBank(subjectId);

  const initialTheta = 0.0; // Baseline candidate ability
  // Select first question closest to difficulty b = 0.0
  const currentQuestion = selectNextQuestion(questionBank, initialTheta, new Set());

  const session = {
    sessionId,
    userId,
    subjectId,
    totalQuestions,
    questionBank,
    usedQuestionIds: new Set([currentQuestion.id]),
    currentTheta: initialTheta,
    history: [],
    trajectory: [
      { step: 0, theta: initialTheta, label: 'Baseline Start' }
    ],
    currentQuestion,
    startTime: Date.now(),
    isCompleted: false,
  };

  activeSessions.set(sessionId, session);
  return formatPublicSession(session);
};

/**
 * Select next question that maximizes Fisher Information at candidate's theta
 */
const selectNextQuestion = (questionBank, theta, usedSet) => {
  const available = questionBank.filter((q) => !usedSet.has(q.id));
  if (available.length === 0) return null;

  let bestQuestion = available[0];
  let maxInfo = -1;

  available.forEach((q) => {
    const info = calculateFisherInformation(theta, q.a, q.b, q.c);
    if (info > maxInfo) {
      maxInfo = info;
      bestQuestion = q;
    }
  });

  return bestQuestion;
};

/**
 * Submit candidate answer and update ability estimate
 */
const submitAnswer = (sessionId, questionId, selectedOptionIndex, timeSpentSeconds = 30) => {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error('Adaptive exam session not found.');
  }

  if (session.isCompleted) {
    throw new Error('Adaptive exam session is already completed.');
  }

  const currentQ = session.currentQuestion;
  if (!currentQ || currentQ.id !== questionId) {
    throw new Error('Invalid question submission for active step.');
  }

  const isCorrect = Number(selectedOptionIndex) === currentQ.correctOptionIndex;
  const oldTheta = session.currentTheta;
  const newTheta = updateAbilityTheta(oldTheta, isCorrect, currentQ.a, currentQ.b, currentQ.c);

  session.currentTheta = newTheta;
  session.history.push({
    questionId: currentQ.id,
    question: currentQ.question,
    topic: currentQ.topic,
    difficulty: currentQ.b,
    isCorrect,
    oldTheta,
    newTheta,
    timeSpentSeconds,
  });

  session.trajectory.push({
    step: session.history.length,
    theta: newTheta,
    label: `Q${session.history.length} (${isCorrect ? 'Correct' : 'Incorrect'})`,
    difficulty: currentQ.b,
  });

  // Check if session reached max questions
  if (session.history.length >= session.totalQuestions) {
    session.isCompleted = true;
    session.currentQuestion = null;
    return {
      isCompleted: true,
      isCorrect,
      oldTheta,
      newTheta,
      scoreReport: generateScoreReportInternal(session),
    };
  }

  // Select next adaptive question
  const nextQ = selectNextQuestion(session.questionBank, newTheta, session.usedQuestionIds);
  if (!nextQ) {
    session.isCompleted = true;
    session.currentQuestion = null;
    return {
      isCompleted: true,
      isCorrect,
      oldTheta,
      newTheta,
      scoreReport: generateScoreReportInternal(session),
    };
  }

  session.usedQuestionIds.add(nextQ.id);
  session.currentQuestion = nextQ;

  return {
    isCompleted: false,
    isCorrect,
    oldTheta,
    newTheta,
    nextQuestion: formatPublicQuestion(nextQ),
    currentStep: session.history.length + 1,
    totalQuestions: session.totalQuestions,
  };
};

/**
 * Generate post-exam diagnostic score report & percentile
 */
const getScoreReport = (sessionId) => {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error('Adaptive exam session not found.');
  }
  return generateScoreReportInternal(session);
};

const generateScoreReportInternal = (session) => {
  const finalTheta = session.currentTheta;
  // Convert Theta (-3 to +3) to Percentile (0 to 100) using Logistic CDF
  const percentile = Math.round((1 / (1 + Math.exp(-finalTheta))) * 100);

  const totalAnswered = session.history.length;
  const totalCorrect = session.history.filter((h) => h.isCorrect).length;
  const accuracyPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Topic mastery breakdown
  const topicStats = {};
  session.history.forEach((h) => {
    if (!topicStats[h.topic]) {
      topicStats[h.topic] = { total: 0, correct: 0 };
    }
    topicStats[h.topic].total += 1;
    if (h.isCorrect) topicStats[h.topic].correct += 1;
  });

  const topicBreakdown = Object.keys(topicStats).map((topic) => ({
    topic,
    accuracy: Math.round((topicStats[topic].correct / topicStats[topic].total) * 100),
    questionsCount: topicStats[topic].total,
  }));

  return {
    sessionId: session.sessionId,
    finalTheta,
    percentile,
    accuracyPct,
    totalAnswered,
    totalCorrect,
    trajectory: session.trajectory,
    topicBreakdown,
  };
};

const formatPublicSession = (session) => ({
  sessionId: session.sessionId,
  totalQuestions: session.totalQuestions,
  currentStep: 1,
  currentTheta: session.currentTheta,
  currentQuestion: formatPublicQuestion(session.currentQuestion),
});

const formatPublicQuestion = (q) => ({
  id: q.id,
  question: q.question,
  options: q.options,
  difficulty: q.b,
  topic: q.topic,
});

module.exports = {
  startSession,
  submitAnswer,
  getScoreReport,
  calculate3PLProbability,
  calculateFisherInformation,
  updateAbilityTheta,
};
