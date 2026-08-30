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

// Calculate Test Information (sum of Fisher Information across responses)
// Higher information = more precise ability estimate
const calculateTestInformation = (session) => {
  let totalInfo = 0;
  session.history.forEach((h) => {
    const q = session.questionBank.find((qb) => qb.id === h.questionId);
    if (q) {
      // Use ability at that step for information calculation
      totalInfo += calculateFisherInformation(h.newTheta, q.a, q.b, q.c);
    }
  });
  return totalInfo;
};

// Calculate Standard Error of Ability Estimate
// SE = 1 / sqrt(Test Information)
// Lower SE = more confident estimate (convergence criterion: SE < 0.25)
const calculateStandardError = (session) => {
  const testInfo = calculateTestInformation(session);
  if (testInfo === 0) return 3.0; // Maximum uncertainty at start
  return 1.0 / Math.sqrt(testInfo);
};

// Bayesian Expected A Posteriori (EAP) Ability Estimation
// More stable than MLE, uses prior distribution N(0, 1)
const calculateEAPAbility = (session) => {
  const priorMean = 0.0;
  const priorSD = 1.0;
  
  if (session.history.length === 0) {
    return priorMean;
  }

  // Use Newton-Raphson for EAP optimization
  // Posterior: log-likelihood + log-prior
  let theta = session.currentTheta;
  
  for (let iter = 0; iter < 10; iter++) {
    let logLikelihoodDerivative = 0;
    let logLikelihoodSecondDerivative = 0;

    session.history.forEach((h) => {
      const q = session.questionBank.find((qb) => qb.id === h.questionId);
      if (q) {
        const p = calculate3PLProbability(theta, q.a, q.b, q.c);
        const pMinusC = p - q.c;
        const oneMinusC = 1 - q.c;
        
        // Response derivative: d(logL)/d(theta)
        const derivative = q.a * (oneMinusC / pMinusC) * ((h.isCorrect ? 1 : 0) - p);
        const secondDerivative = -(q.a * q.a) * (oneMinusC * oneMinusC) * p * (1 - p) / (pMinusC * pMinusC);
        
        logLikelihoodDerivative += derivative;
        logLikelihoodSecondDerivative += secondDerivative;
      }
    });

    // Add prior contribution (N(0, 1))
    const priorDerivative = -(theta - priorMean) / (priorSD * priorSD);
    const priorSecondDerivative = -1.0 / (priorSD * priorSD);

    const totalDerivative = logLikelihoodDerivative + priorDerivative;
    const totalSecondDerivative = logLikelihoodSecondDerivative + priorSecondDerivative;

    if (Math.abs(totalDerivative) < 0.001) break;

    const step = -totalDerivative / totalSecondDerivative;
    theta += step;
    theta = Math.max(-3.0, Math.min(3.0, theta));
  }

  return Math.round(theta * 1000) / 1000;
};

// Ability Theta Update (Newton-Raphson with EAP)
const updateAbilityTheta = (currentTheta, isCorrect, a = 1.2, b = 0.0, c = 0.25) => {
  const prob = calculate3PLProbability(currentTheta, a, b, c);
  const learningRate = 0.6; // Scale factor for step size
  const delta = learningRate * a * ((isCorrect ? 1 : 0) - prob);
  const newTheta = currentTheta + delta;
  // Clamp theta between -3.0 and +3.0
  return Math.max(-3.0, Math.min(3.0, Math.round(newTheta * 1000) / 1000));
};

// Calculate confidence interval bounds (95% CI)
const calculateConfidenceInterval = (session) => {
  const se = calculateStandardError(session);
  const theta = session.currentTheta;
  const z = 1.96; // 95% confidence
  return {
    lower: Math.round((theta - z * se) * 1000) / 1000,
    upper: Math.round((theta + z * se) * 1000) / 1000,
  };
};

// Check if convergence criteria met
// Convergence: SE < 0.25 or max items reached
const hasConverged = (session) => {
  const se = calculateStandardError(session);
  const maxItemsThreshold = session.totalQuestions;
  return se < 0.25 || session.history.length >= maxItemsThreshold;
};

// Generate Mock Question Bank for Adaptive Testing
const generateAdaptiveQuestionBank = (subjectId = 'general') => {
  const questions = [];
  const topics = ['Algebra', 'Calculus', 'Thermodynamics', 'Mechanics', 'Organic Chemistry'];

  for (let i = 1; i <= 20; i++) {
    // Generate difficulty b ranging from -2.5 (easy) to +2.5 (hard)
    const difficulty = Math.round((-2.5 + (i - 1) * 0.26) * 100) / 100;
    const topic = topics[i % topics.length];
    
    // Vary discrimination (a) and guessing (c) parameters
    const discrimination = Math.round((0.8 + Math.random() * 1.2) * 100) / 100;
    const guessing = Math.round((0.15 + Math.random() * 0.2) * 100) / 100;

    questions.push({
      id: `cat-q-${i}`,
      question: `[Difficulty ${difficulty >= 0 ? '+' : ''}${difficulty}] Solve ${topic} Question ${i}: What is the value of X when parameters are optimized?`,
      options: ['Option A (Correct)', 'Option B', 'Option C', 'Option D'],
      correctOptionIndex: 0,
      a: discrimination, // Discrimination
      b: difficulty, // Difficulty
      c: guessing, // Guessing
      topic,
    });
  }
  return questions;
};

/**
 * Initialize a new Computer Adaptive Testing (CAT) session
 */
const startSession = (userId, subjectId = 'general', totalQuestions = 15) => {
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
      { step: 0, theta: initialTheta, label: 'Baseline Start', se: 3.0 }
    ],
    currentQuestion,
    startTime: Date.now(),
    isCompleted: false,
    convergenceMetrics: {
      initialSE: 3.0,
      targetSE: 0.25,
    },
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
    discrimination: currentQ.a,
    guessing: currentQ.c,
    isCorrect,
    oldTheta,
    newTheta,
    timeSpentSeconds,
  });

  // Calculate current standard error and confidence interval
  const se = calculateStandardError(session);
  const ci = calculateConfidenceInterval(session);

  session.trajectory.push({
    step: session.history.length,
    theta: newTheta,
    label: `Q${session.history.length} (${isCorrect ? 'Correct' : 'Incorrect'})`,
    difficulty: currentQ.b,
    se: Math.round(se * 1000) / 1000,
    ciLower: ci.lower,
    ciUpper: ci.upper,
  });

  // Check convergence criteria: SE < 0.25 or max items reached
  const converged = hasConverged(session);

  if (converged) {
    session.isCompleted = true;
    session.currentQuestion = null;
    return {
      isCompleted: true,
      isCorrect,
      oldTheta,
      newTheta,
      standardError: se,
      convergenceReached: se < 0.25,
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
      standardError: se,
      convergenceReached: false,
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
    standardError: se,
    convergenceMetrics: {
      standardError: Math.round(se * 1000) / 1000,
      confidenceInterval: ci,
      converged: false,
      targetSE: 0.25,
    },
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

// Generate Item Characteristic Curves (ICC) for all answered items
const generateICCData = (session) => {
  const thetaRange = [];
  for (let t = -3.0; t <= 3.0; t += 0.1) {
    thetaRange.push(Math.round(t * 10) / 10);
  }

  return session.history.map((h, idx) => {
    const q = session.questionBank.find((qb) => qb.id === h.questionId);
    if (!q) return null;

    const iccPoints = thetaRange.map((t) => ({
      theta: t,
      probability: Math.round(calculate3PLProbability(t, q.a, q.b, q.c) * 1000) / 1000,
    }));

    return {
      questionIndex: idx + 1,
      questionId: q.id,
      question: q.question,
      topic: q.topic,
      itemParams: {
        a: q.a, // discrimination
        b: q.b, // difficulty
        c: q.c, // guessing
      },
      wasCorrect: h.isCorrect,
      ircPoints: iccPoints,
      studentAbilityAtThisQuestion: h.newTheta,
    };
  }).filter(Boolean);
};

// Calculate sub-domain mastery with EAP per domain
const calculateDomainMastery = (session) => {
  const domainStats = {};
  const domainThetas = {};

  session.history.forEach((h) => {
    const topic = h.topic;
    if (!domainStats[topic]) {
      domainStats[topic] = { total: 0, correct: 0 };
      domainThetas[topic] = [];
    }
    domainStats[topic].total += 1;
    if (h.isCorrect) domainStats[topic].correct += 1;
    domainThetas[topic].push(h.newTheta);
  });

  return Object.keys(domainStats).map((topic) => {
    const accuracy = Math.round((domainStats[topic].correct / domainStats[topic].total) * 100);
    const thetasForTopic = domainThetas[topic];
    const domainEAP = thetasForTopic.reduce((a, b) => a + b, 0) / thetasForTopic.length;

    return {
      topic,
      accuracy,
      questionsCount: domainStats[topic].total,
      eapAbility: Math.round(domainEAP * 1000) / 1000,
    };
  });
};

const generateScoreReportInternal = (session) => {
  const finalTheta = session.currentTheta;
  const se = calculateStandardError(session);
  const ci = calculateConfidenceInterval(session);
  const eapTheta = calculateEAPAbility(session);
  
  // Convert Theta (-3 to +3) to Percentile (0 to 100) using Logistic CDF
  const percentile = Math.round((1 / (1 + Math.exp(-eapTheta))) * 100);

  const totalAnswered = session.history.length;
  const totalCorrect = session.history.filter((h) => h.isCorrect).length;
  const accuracyPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Topic/Domain mastery breakdown
  const topicBreakdown = calculateDomainMastery(session);

  // ICC data for visualization
  const ircData = generateICCData(session);

  // Convergence status
  const converged = se < 0.25;
  const convergenceReport = {
    converged,
    standardError: Math.round(se * 1000) / 1000,
    targetStandardError: 0.25,
    questionsRequired: totalAnswered,
    questionsRemaining: Math.max(0, session.totalQuestions - totalAnswered),
  };

  return {
    sessionId: session.sessionId,
    finalTheta: Math.round(finalTheta * 1000) / 1000,
    eapTheta: Math.round(eapTheta * 1000) / 1000,
    percentile,
    accuracyPct,
    totalAnswered,
    totalCorrect,
    standardError: Math.round(se * 1000) / 1000,
    confidenceInterval: {
      lower: ci.lower,
      upper: ci.upper,
      level: 0.95,
    },
    trajectory: session.trajectory,
    topicBreakdown,
    ircData,
    convergenceReport,
    performanceRating: 
      percentile >= 80 ? 'Advanced / Exemplary' :
      percentile >= 50 ? 'Proficient / Competitive' :
      'Developing Mastery',
  };
};

const formatPublicSession = (session) => {
  const se = calculateStandardError(session);
  const ci = calculateConfidenceInterval(session);
  
  return {
    sessionId: session.sessionId,
    totalQuestions: session.totalQuestions,
    currentStep: 1,
    currentTheta: session.currentTheta,
    standardError: Math.round(se * 1000) / 1000,
    confidenceInterval: ci,
    convergenceMetrics: {
      targetSE: 0.25,
      currentSE: Math.round(se * 1000) / 1000,
      converged: false,
    },
    currentQuestion: formatPublicQuestion(session.currentQuestion),
  };
};

const formatPublicQuestion = (q) => ({
  id: q.id,
  question: q.question,
  options: q.options,
  difficulty: q.b,
  discrimination: q.a,
  guessing: q.c,
  topic: q.topic,
});

module.exports = {
  startSession,
  submitAnswer,
  getScoreReport,
  calculate3PLProbability,
  calculateFisherInformation,
  updateAbilityTheta,
  calculateStandardError,
  calculateEAPAbility,
  calculateConfidenceInterval,
  hasConverged,
  calculateTestInformation,
  generateICCData,
  calculateDomainMastery,
};
