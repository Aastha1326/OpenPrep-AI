const logger = require('./logger');
const aiUsageBudgetService = require('../services/aiUsageBudgetService');

/**
 * Execute AI request with retry logic and budget checks
 */
async function executeWithRetry(
  requestFn,
  options = {}
) {
  const {
    userId,
    feature,
    provider = 'gemini',
    maxRetries = 3,
    onRetry = null,
  } = options;

  // Check budget before attempting
  if (userId && feature) {
    const budgetCheck = await aiUsageBudgetService.canMakeRequest(userId, feature);
    if (!budgetCheck.allowed) {
      logger.warn('AI request blocked by budget', {
        userId,
        feature,
        reason: budgetCheck.reason,
      });
      throw new Error(`AI budget limit: ${budgetCheck.reason}`);
    }
  }

  // Check provider health
  if (!aiUsageBudgetService.isProviderHealthy(provider)) {
    throw new Error(`Provider ${provider} is currently unavailable`);
  }

  let lastError = null;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await requestFn();
      const responseTime = Date.now() - startTime;

      // Record successful usage
      if (userId && feature) {
        await aiUsageBudgetService.recordUsage(
          userId,
          feature,
          options.requestType || 'general',
          options.estimatedTokens || 0,
          'success',
          { responseTime, retryCount: attempt - 1 }
        );
      }

      // Record provider success
      await aiUsageBudgetService.recordProviderSuccess(provider);

      return result;
    } catch (error) {
      lastError = error;
      const responseTime = Date.now() - startTime;

      // Determine if error is retryable
      const isRetryable = isRetryableError(error);
      const shouldRetry = isRetryable && attempt < maxRetries;

      logger.warn('AI request failed', {
        attempt,
        provider,
        userId,
        feature,
        error: error.message,
        isRetryable,
        shouldRetry,
        responseTime,
      });

      // Record failure
      if (userId && feature) {
        await aiUsageBudgetService.recordUsage(
          userId,
          feature,
          options.requestType || 'general',
          0,
          getErrorStatus(error),
          {
            errorMessage: error.message,
            responseTime,
            retryCount: attempt,
          }
        );
      }

      // Record provider failure
      await aiUsageBudgetService.recordProviderFailure(
        provider,
        error.type || error.name,
        error.message
      );

      if (!shouldRetry) {
        break;
      }

      // Calculate backoff
      const backoffMs = aiUsageBudgetService.calculateBackoff(attempt);

      if (onRetry) {
        onRetry(attempt, backoffMs, error);
      }

      // Wait before retrying
      await sleep(backoffMs);
    }
  }

  // All retries exhausted
  logger.error('AI request exhausted retries', {
    provider,
    userId,
    feature,
    attempts: maxRetries,
    lastError: lastError?.message,
  });

  throw lastError;
}

/**
 * Determine if error is retryable
 */
function isRetryableError(error) {
  if (!error) return false;

  const message = (error.message || '').toLowerCase();
  const status = error.status || error.statusCode;

  // Timeout errors are retryable
  if (message.includes('timeout') || message.includes('econnrefused')) {
    return true;
  }

  // 5xx errors are retryable
  if (status >= 500 && status < 600) {
    return true;
  }

  // 429 (rate limit) is retryable
  if (status === 429) {
    return true;
  }

  // 503 (service unavailable) is retryable
  if (status === 503) {
    return true;
  }

  // Non-retryable: 400, 401, 403, 404
  if ([400, 401, 403, 404].includes(status)) {
    return false;
  }

  return false;
}

/**
 * Map error to usage log status
 */
function getErrorStatus(error) {
  const message = (error.message || '').toLowerCase();
  const status = error.status || error.statusCode;

  if (message.includes('quota') || status === 429) {
    return 'quota_exceeded';
  }

  if (message.includes('timeout')) {
    return 'timeout';
  }

  return 'provider_error';
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  executeWithRetry,
  isRetryableError,
  getErrorStatus,
};