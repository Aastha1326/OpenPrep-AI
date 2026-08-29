/**
 * @fileoverview Transactional spaced repetition scheduler
 * Handles atomic review state transitions with duplicate detection
 */

const {
  FlashcardSchedulingState,
  FlashcardReviewHistory,
  ReviewSubmissionToken,
  SchedulerVersion,
  sequelize,
} = require('../models');
const DuplicateDetectionService = require('./duplicateDetectionService');

/**
 * Initialize scheduler version if not exists
 */
async function initializeSchedulerVersion() {
  const existingVersion = await SchedulerVersion.findOne({
    where: { versionNumber: 1 },
  });

  if (!existingVersion) {
    await SchedulerVersion.create({
      versionNumber: 1,
      algorithmName: 'SM-2',
      description: 'Supermemo 2 algorithm for spaced repetition',
      isActive: true,
    });
  }

  return existingVersion || (await SchedulerVersion.findOne({ where: { versionNumber: 1 } }));
}

/**
 * Get active scheduler version
 */
async function getActiveSchedulerVersion() {
  const version = await SchedulerVersion.findOne({
    where: { isActive: true },
    order: [['versionNumber', 'DESC']],
  });
  return version;
}

/**
 * Initialize scheduling state for a new flashcard
 */
async function initializeFlashcardScheduling(flashcardId, timezone = 'UTC') {
  const schedulerVersion = await getActiveSchedulerVersion();
  if (!schedulerVersion) {
    throw new Error('No active scheduler version found');
  }

  const existingState = await FlashcardSchedulingState.findOne({
    where: { flashcardId },
  });

  if (existingState) {
    return existingState;
  }

  return await FlashcardSchedulingState.create({
    flashcardId,
    schedulerVersionId: schedulerVersion.id,
    repetitionCount: 0,
    interval: 1,
    easeFactor: 2.5,
    nextReviewDate: new Date(),
    state: 'new',
    timezoneIdentifier: timezone,
  });
}

/**
 * SM-2 algorithm implementation
 * Calculates next interval and ease factor based on review quality
 */
function calculateSM2(currentState, quality) {
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5');
  }

  let newRepetitionCount = currentState.repetitionCount;
  let newInterval = currentState.interval;
  let newEaseFactor = currentState.easeFactor;

  if (quality < 3) {
    // Failed review
    newRepetitionCount = 0;
    newInterval = 1;
  } else {
    // Passing review
    if (newRepetitionCount === 0) {
      newInterval = 1;
    } else if (newRepetitionCount === 1) {
      newInterval = 3;
    } else {
      newInterval = Math.round(currentState.interval * newEaseFactor);
    }
    newRepetitionCount += 1;
  }

  // Update ease factor
  newEaseFactor = Math.max(
    1.3,
    currentState.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  return {
    repetitionCount: newRepetitionCount,
    interval: newInterval,
    easeFactor: newEaseFactor,
  };
}

/**
 * Process a review submission with duplicate detection and atomic transaction
 */
async function processReview(flashcardId, quality, submissionToken, timezone = 'UTC') {
  // Check for duplicate submission
  const isDuplicate = await DuplicateDetectionService.checkDuplicate(
    flashcardId,
    submissionToken
  );

  if (isDuplicate) {
    return {
      success: false,
      isDuplicate: true,
      message: 'This review has already been processed',
    };
  }

  const transaction = await sequelize.transaction();

  try {
    // Lock the row for update
    const currentState = await FlashcardSchedulingState.findOne(
      {
        where: { flashcardId },
        lock: transaction.LOCK.UPDATE,
      },
      { transaction }
    );

    if (!currentState) {
      throw new Error('Flashcard scheduling state not found');
    }

    // Validate quality
    if (quality < 0 || quality > 5) {
      throw new Error('Quality must be between 0 and 5');
    }

    // Get scheduler version
    const schedulerVersion = await SchedulerVersion.findByPk(currentState.schedulerVersionId, {
      transaction,
    });

    if (!schedulerVersion) {
      throw new Error('Scheduler version not found');
    }

    // Calculate new state using SM-2
    const calculation = calculateSM2(currentState, quality);

    // Determine new state
    let newState = currentState.state;
    if (quality < 3) {
      newState = currentState.state === 'new' ? 'learning' : 'relearning';
    } else {
      newState = 'review';
    }

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + calculation.interval);

    // Save pre-state for history
    const preState = {
      repetitionCount: currentState.repetitionCount,
      interval: currentState.interval,
      easeFactor: currentState.easeFactor,
      state: currentState.state,
      nextReviewDate: currentState.nextReviewDate,
    };

    // Update scheduling state
    await currentState.update(
      {
        repetitionCount: calculation.repetitionCount,
        interval: calculation.interval,
        easeFactor: calculation.easeFactor,
        state: newState,
        nextReviewDate,
        lastReviewedAt: new Date(),
        timezoneIdentifier: timezone,
      },
      { transaction }
    );

    // Post-state for history
    const postState = {
      repetitionCount: calculation.repetitionCount,
      interval: calculation.interval,
      easeFactor: calculation.easeFactor,
      state: newState,
      nextReviewDate,
    };

    // Record review history
    const reviewHistory = await FlashcardReviewHistory.create(
      {
        flashcardId,
        schedulerVersionId: schedulerVersion.id,
        reviewedAt: new Date(),
        quality,
        preState,
        postState,
        timezoneIdentifier: timezone,
      },
      { transaction }
    );

    // Mark token as processed
    await ReviewSubmissionToken.create(
      {
        flashcardId,
        submissionToken,
        reviewHistoryId: reviewHistory.id,
      },
      { transaction }
    );

    await transaction.commit();

    return {
      success: true,
      isDuplicate: false,
      reviewHistory: reviewHistory.toJSON(),
      newState: currentState.toJSON(),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Get review history for a flashcard
 */
async function getReviewHistory(flashcardId, limit = 50) {
  return await FlashcardReviewHistory.findAll({
    where: { flashcardId },
    order: [['reviewedAt', 'DESC']],
    limit,
  });
}

/**
 * Get current scheduling state for a flashcard
 */
async function getSchedulingState(flashcardId) {
  return await FlashcardSchedulingState.findOne({
    where: { flashcardId },
    include: [{ model: SchedulerVersion, as: 'SchedulerVersion' }],
  });
}

/**
 * Get cards due for review
 */
async function getCardsDueForReview(limit = 20) {
  return await FlashcardSchedulingState.findAll({
    where: {
      nextReviewDate: {
        [sequelize.Sequelize.Op.lte]: new Date(),
      },
    },
    order: [['nextReviewDate', 'ASC']],
    limit,
  });
}

module.exports = {
  initializeSchedulerVersion,
  getActiveSchedulerVersion,
  initializeFlashcardScheduling,
  calculateSM2,
  processReview,
  getReviewHistory,
  getSchedulingState,
  getCardsDueForReview,
};