const geminiService = require('./geminiService');
const cacheService = require('./cacheService');
const crypto = require('crypto');

const REMEDIATION_CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours per spec

/**
 * Compile weak flashcard entries into a clean context string for Gemini.
 * @param {Array<{front: string, back: string}>} weakCards
 * @returns {string}
 */
function buildWeakCardContext(weakCards) {
  return weakCards
    .slice(0, 20) // cap payload size
    .map((c, i) => `${i + 1}. Term: "${c.front}" — Answer: "${c.back}"`)
    .join('\n');
}

/**
 * Generate a targeted MCQ diagnostic quiz from a user's forgotten flashcards.
 *
 * Caches the result keyed on (userId, deckId, cardIds) for 24 hours so repeated
 * banner clicks don't incur extra Gemini quota.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.deckId           Subject/deck UUID
 * @param {string} params.subjectName
 * @param {Array<{id:string, front:string, back:string}>} params.weakCards
 * @param {number} [params.count=5]        Number of questions (5–10)
 * @param {boolean} [params.forceRefresh=false]
 * @returns {Promise<{title:string, questions:Array}>}
 */
async function generateRemediationQuiz({ userId, deckId, subjectName, weakCards, count = 5, forceRefresh = false }) {
  if (!weakCards || weakCards.length < 2) {
    throw new Error('At least 2 failed cards are required to generate a remediation quiz.');
  }

  const clampedCount = Math.min(10, Math.max(5, count));
  const cardIds = weakCards.map((c) => c.id).sort().join(',');
  const rawKey = `remediation:${userId}:${deckId}:${cardIds}`;
  const cacheKey = crypto.createHash('md5').update(rawKey).digest('hex');

  if (!forceRefresh) {
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;
  }

  const context = buildWeakCardContext(weakCards);

  // Use the existing generateQuiz function with an enriched topic name and a
  // cards-context injected through the notesText parameter so we re-use all
  // existing retry/rate-limit/mock fallback logic.
  const notesText = `
The student struggled with the following spaced-repetition flashcard concepts during their review session.
Generate diagnostic MCQ questions that directly test whether the student understands these exact terms and their meanings.
Each question MUST be grounded in one of the concepts below — do not invent unrelated questions.

Weak flashcard concepts:
${context}
  `.trim();

  const result = await geminiService.generateQuiz(
    subjectName,
    'Weakness Diagnostic',
    notesText,
    clampedCount,
    true, // always force-refresh from Gemini; we do our own caching
    'english',
    'Medium',
    'MCQ'
  );

  await cacheService.set(cacheKey, result, REMEDIATION_CACHE_TTL_SECONDS);
  return result;
}

module.exports = { generateRemediationQuiz, buildWeakCardContext };
