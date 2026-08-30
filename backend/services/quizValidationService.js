/**
 * @fileoverview Service for validating AI-generated quiz questions
 * before persistence and delivery to students.
 */

const { QuizValidationLog, Question } = require('../models');

/**
 * Validates schema correctness of a question
 * @param {Object} question - Question object
 * @returns {Object} { isValid: boolean, error: string|null }
 */
function validateSchema(question) {
  if (!question || typeof question !== 'object') {
    return { isValid: false, error: 'Question must be an object' };
  }

  const requiredFields = ['text', 'options', 'correctAnswer', 'explanation'];
  for (const field of requiredFields) {
    if (!question[field]) {
      return { isValid: false, error: `Missing required field: ${field}` };
    }
  }

  if (!Array.isArray(question.options) || question.options.length < 2) {
    return { isValid: false, error: 'Question must have at least 2 options' };
  }

  if (typeof question.text !== 'string' || question.text.trim().length === 0) {
    return { isValid: false, error: 'Question text cannot be empty' };
  }

  if (typeof question.explanation !== 'string' || question.explanation.trim().length === 0) {
    return { isValid: false, error: 'Explanation cannot be empty' };
  }

  return { isValid: true, error: null };
}

/**
 * Validates that exactly one answer is correct
 * @param {Object} question - Question object
 * @returns {Object} { isValid: boolean, error: string|null }
 */
function validateAnswerKey(question) {
  const correctAnswer = question.correctAnswer;

  if (!question.options.includes(correctAnswer)) {
    return { isValid: false, error: 'Correct answer not found in options' };
  }

  const correctCount = question.options.filter(opt => opt === correctAnswer).length;
  if (correctCount !== 1) {
    return { isValid: false, error: 'Multiple identical correct answers detected' };
  }

  return { isValid: true, error: null };
}

/**
 * Detects duplicate or near-duplicate questions
 * @param {Object} question - Question object
 * @param {Array} existingQuestions - Array of existing questions
 * @returns {Object} { isValid: boolean, error: string|null }
 */
function detectDuplicates(question, existingQuestions = []) {
  if (!existingQuestions || existingQuestions.length === 0) {
    return { isValid: true, error: null };
  }

  const normalizeText = (text) => text.toLowerCase().trim().replace(/\s+/g, ' ');
  const newQuestionNorm = normalizeText(question.text);

  for (const existing of existingQuestions) {
    const existingNorm = normalizeText(existing.text);

    // Exact match
    if (newQuestionNorm === existingNorm) {
      return { isValid: false, error: `Exact duplicate found: "${existing.text}"` };
    }

    // Near-duplicate (>85% similarity)
    const similarity = calculateSimilarity(newQuestionNorm, existingNorm);
    if (similarity > 0.85) {
      return { isValid: false, error: `Near-duplicate detected with ${(similarity * 100).toFixed(1)}% similarity` };
    }
  }

  return { isValid: true, error: null };
}

/**
 * Calculates Levenshtein similarity between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
  const matrix = Array(str2.length + 1)
    .fill(0)
    .map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = matrix[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}

/**
 * Validates explanation consistency with source material
 * @param {Object} question - Question object
 * @param {string} sourceContext - Source material context
 * @returns {Object} { isValid: boolean, error: string|null }
 */
function validateExplanationConsistency(question, sourceContext = '') {
  const explanation = question.explanation.toLowerCase();
  const context = sourceContext.toLowerCase();

  if (!sourceContext || sourceContext.trim().length === 0) {
    // If no context, just check explanation length
    return question.explanation.length >= 20
      ? { isValid: true, error: null }
      : { isValid: false, error: 'Explanation is too brief' };
  }

  // Check if explanation references context
  const contextKeywords = context.split(/\s+/).filter(w => w.length > 5);
  const explanationKeywords = explanation.split(/\s+/);

  let matchCount = 0;
  for (const keyword of contextKeywords.slice(0, 10)) {
    if (explanationKeywords.includes(keyword)) matchCount++;
  }

  if (matchCount < 2) {
    return { isValid: false, error: 'Explanation does not reference source material' };
  }

  return { isValid: true, error: null };
}

/**
 * Validates distractor quality
 * @param {Object} question - Question object
 * @returns {Object} { isValid: boolean, error: string|null }
 */
function validateDistractorQuality(question) {
  const correctAnswer = question.correctAnswer;
  const distractors = question.options.filter(opt => opt !== correctAnswer);

  if (distractors.length < 1) {
    return { isValid: false, error: 'Must have at least one distractor' };
  }

  // Check for empty or very short distractors
  for (const distractor of distractors) {
    if (!distractor || distractor.trim().length < 3) {
      return { isValid: false, error: 'Distractor is too short or empty' };
    }
  }

  // Check for duplicate distractors
  const uniqueDistractors = new Set(distractors.map(d => d.toLowerCase().trim()));
  if (uniqueDistractors.size !== distractors.length) {
    return { isValid: false, error: 'Duplicate distractors detected' };
  }

  return { isValid: true, error: null };
}

/**
 * Validates difficulty and category consistency
 * @param {Object} question - Question object
 * @returns {Object} { isValid: boolean, error: string|null }
 */
function validateDifficultyConsistency(question) {
  const validDifficulties = ['easy', 'medium', 'hard'];
  if (question.difficulty && !validDifficulties.includes(question.difficulty)) {
    return { isValid: false, error: `Invalid difficulty level: ${question.difficulty}` };
  }

  if (question.category && typeof question.category !== 'string') {
    return { isValid: false, error: 'Category must be a string' };
  }

  return { isValid: true, error: null };
}

/**
 * Validates factual claims in question and explanation
 * @param {Object} question - Question object
 * @param {string} sourceContext - Source material for grounding
 * @returns {Object} { isValid: boolean, error: string|null }
 */
function validateFactualClaims(question, sourceContext = '') {
  if (!sourceContext || sourceContext.trim().length === 0) {
    return { isValid: true, error: null };
  }

  const text = `${question.text} ${question.explanation}`.toLowerCase();
  const context = sourceContext.toLowerCase();

  // Check for contradictory statements (simple heuristic)
  const negationPatterns = ['not', 'never', 'cannot', 'no ', 'false'];
  let hasNegation = false;

  for (const pattern of negationPatterns) {
    if (text.includes(pattern)) {
      hasNegation = true;
      break;
    }
  }

  if (hasNegation && !context.includes('not') && !context.includes('never')) {
    return { isValid: false, error: 'Factual claim contradicts source material' };
  }

  return { isValid: true, error: null };
}

/**
 * Complete validation pipeline for a question
 * @param {Object} question - Question object
 * @param {string} quizId - Quiz ID for logging
 * @param {Object} options - Options {sourceContext, existingQuestions}
 * @returns {Promise<Object>} { isValid: boolean, errors: Array }
 */
async function validateQuestion(question, quizId, options = {}) {
  const { sourceContext = '', existingQuestions = [] } = options;
  const errors = [];

  const validations = [
    { stage: 'schema_correctness', fn: () => validateSchema(question) },
    { stage: 'answer_key_validation', fn: () => validateAnswerKey(question) },
    {
      stage: 'duplicate_detection',
      fn: () => detectDuplicates(question, existingQuestions),
    },
    {
      stage: 'explanation_consistency',
      fn: () => validateExplanationConsistency(question, sourceContext),
    },
    {
      stage: 'source_grounding',
      fn: () => validateFactualClaims(question, sourceContext),
    },
    {
      stage: 'difficulty_consistency',
      fn: () => validateDifficultyConsistency(question),
    },
    {
      stage: 'distractor_quality',
      fn: () => validateDistractorQuality(question),
    },
  ];

  for (const validation of validations) {
    const result = validation.fn();

    await QuizValidationLog.create({
      quizId,
      validationStage: validation.stage,
      status: result.isValid ? 'passed' : 'failed',
      errorMessage: result.error || null,
    });

    if (!result.isValid) {
      errors.push({ stage: validation.stage, error: result.error });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    passedStages: validations.length - errors.length,
    totalStages: validations.length,
  };
}

module.exports = {
  validateSchema,
  validateAnswerKey,
  detectDuplicates,
  validateExplanationConsistency,
  validateDistractorQuality,
  validateDifficultyConsistency,
  validateFactualClaims,
  validateQuestion,
  calculateSimilarity,
};