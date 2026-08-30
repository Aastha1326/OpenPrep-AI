/**
 * @fileoverview Service for detecting duplicate review submissions
 */

const { ReviewSubmissionToken } = require('../models');

/**
 * Check if a submission token has already been processed
 * @param {string} flashcardId - Flashcard ID
 * @param {string} submissionToken - Unique token from client
 * @returns {Promise<boolean>} True if duplicate, false otherwise
 */
async function checkDuplicate(flashcardId, submissionToken) {
  const existing = await ReviewSubmissionToken.findOne({
    where: {
      flashcardId,
      submissionToken,
    },
  });

  return !!existing;
}

/**
 * Record a submission token as processed
 * Already handled in processReview, but exported for testing
 * @param {string} flashcardId - Flashcard ID
 * @param {string} submissionToken - Unique token
 * @param {string} reviewHistoryId - Reference to review history
 */
async function recordSubmission(flashcardId, submissionToken, reviewHistoryId) {
  return await ReviewSubmissionToken.create({
    flashcardId,
    submissionToken,
    reviewHistoryId,
  });
}

/**
 * Generate a unique submission token (client-side utility)
 * Format: "card-{flashcardId}-{timestamp}-{random}"
 */
function generateSubmissionToken(flashcardId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `card-${flashcardId}-${timestamp}-${random}`;
}

module.exports = {
  checkDuplicate,
  recordSubmission,
  generateSubmissionToken,
};