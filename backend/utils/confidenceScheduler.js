const CONFIDENCE_INTERVAL_MULTIPLIERS = Object.freeze({
  very_unsure: 0.65,
  unsure: 0.85,
  confident: 1.0,
  very_confident: 1.15,
});

const MIN_REVIEW_INTERVAL_DAYS = 1;

/**
 * Adjusts an SM-2 interval using an optional confidence level.
 *
 * Confidence is optional. When omitted or invalid, the original
 * SM-2 interval is returned unchanged.
 *
 * @param {Object} params
 * @param {number} params.interval Base SM-2 interval in days
 * @param {string} [params.confidence] very_unsure | unsure | confident | very_confident
 * @returns {number} Confidence-adjusted interval in days
 */
const adjustIntervalByConfidence = ({ interval, confidence }) => {
  if (!Number.isFinite(interval) || interval < MIN_REVIEW_INTERVAL_DAYS) {
    throw new Error('interval must be a positive number');
  }

  if (!confidence) {
    return Math.max(MIN_REVIEW_INTERVAL_DAYS, Math.round(interval));
  }

  const multiplier = CONFIDENCE_INTERVAL_MULTIPLIERS[confidence];

  if (multiplier === undefined) {
    return Math.max(MIN_REVIEW_INTERVAL_DAYS, Math.round(interval));
  }

  return Math.max(
    MIN_REVIEW_INTERVAL_DAYS,
    Math.round(interval * multiplier)
  );
};

module.exports = {
  CONFIDENCE_INTERVAL_MULTIPLIERS,
  MIN_REVIEW_INTERVAL_DAYS,
  adjustIntervalByConfidence,
};
