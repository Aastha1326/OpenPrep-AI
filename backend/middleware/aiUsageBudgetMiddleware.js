const aiUsageBudgetService = require('../services/aiUsageBudgetService');
const logger = require('../utils/logger');

/**
 * Middleware to check AI budget before processing AI requests
 */
async function checkAIBudget(req, res, next) {
  // Skip if not an AI request or user not authenticated
  if (!req.user || !req.user.id) {
    return next();
  }

  // Check if this is an AI feature route
  const feature = detectFeature(req.path, req.body);
  if (!feature) {
    return next();
  }

  try {
    const budgetCheck = await aiUsageBudgetService.canMakeRequest(req.user.id, feature);

    if (!budgetCheck.allowed) {
      logger.warn('AI budget exceeded', {
        userId: req.user.id,
        feature,
        reason: budgetCheck.reason,
      });

      return res.status(429).json({
        error: 'AI_USAGE_LIMIT_EXCEEDED',
        message: `${budgetCheck.reason.replace(/_/g, ' ')}`,
        retryAfter: budgetCheck.retryAfter,
        currentUsage: budgetCheck.currentUsage,
        limit: budgetCheck.limit,
      });
    }

    // Store feature info for later use
    req.aiFeature = feature;
    req.aiUsageTracker = {
      startTime: Date.now(),
      tokens: 0,
    };

    next();
  } catch (err) {
    logger.error('Error checking AI budget', { error: err.message });
    // Fail open - allow request to proceed
    next();
  }
}

/**
 * Detect AI feature from request path/body
 */
function detectFeature(path, body) {
  // Map paths to features
  const featureMap = {
    '/api/ai/generate-quiz': 'quiz-generation',
    '/api/ai/study-plan': 'study-planning',
    '/api/ai/explain': 'question-explanation',
    '/api/ai/doubt-solver': 'doubt-solver',
    '/api/ai/chat': 'ai-chat',
    '/api/ai/generate-flashcards': 'flashcard-generation',
    '/api/ai/explain-solution': 'solution-explanation',
  };

  for (const [route, feature] of Object.entries(featureMap)) {
    if (path.includes(route)) {
      return feature;
    }
  }

  // Check body for feature hints
  if (body && body.feature) {
    return body.feature;
  }

  return null;
}

/**
 * Middleware to record AI usage after request
 */
function recordUsageAfterRequest(req, res, next) {
  // Wrap res.json to capture responses
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    if (req.aiFeature && req.aiUsageTracker) {
      recordUsage(req, data).catch(err => {
        logger.error('Error recording usage', { error: err.message });
      });
    }
    return originalJson(data);
  };

  next();
}

async function recordUsage(req, responseData) {
  const { userId } = req.user || {};
  const { aiFeature: feature } = req;
  const { startTime } = req.aiUsageTracker || {};

  if (!userId || !feature) return;

  const responseTime = Date.now() - startTime;
  const status = responseData.error ? 'provider_error' : 'success';

  await aiUsageBudgetService.recordUsage(
    userId,
    feature,
    'text-generation',
    responseData.tokens || 0,
    status,
    { responseTime }
  );
}

module.exports = {
  checkAIBudget,
  recordUsageAfterRequest,
};