const User = require('../models/User');

const TIER_LIMITS = {
  student: 15,
  contributor: 50,
  admin: 100,
  premium: 100,
  default: 15,
};

const checkAiQuota = async (req, res, next) => {
  try {
    // Bypass in testing unless rate limit checks are specifically requested via header
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    if (!req.user || !req.user.id) {
      return next();
    }

    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const now = new Date();
    const lastReset = user.lastAiUsageReset ? new Date(user.lastAiUsageReset) : null;

    // Check if the current time has rolled over past midnight UTC relative to last reset
    const needsReset =
      !lastReset ||
      lastReset.getUTCFullYear() !== now.getUTCFullYear() ||
      lastReset.getUTCMonth() !== now.getUTCMonth() ||
      lastReset.getUTCDate() !== now.getUTCDate();

    if (needsReset) {
      user.dailyAiUsageCount = 0;
      user.lastAiUsageReset = now;
      await user.save();
    }

    const limit = TIER_LIMITS[user.role] || TIER_LIMITS.default;
    const remaining = Math.max(0, limit - user.dailyAiUsageCount);

    const tomorrowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const secondsUntilReset = Math.ceil((tomorrowUTC.getTime() - now.getTime()) / 1000);

    // Set standard response headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Reset', tomorrowUTC.toISOString());

    if (remaining <= 0) {
      res.setHeader('Retry-After', secondsUntilReset);
      res.setHeader('X-RateLimit-Remaining', 0);
      return res.status(429).json({
        success: false,
        error: 'AI daily usage quota exceeded.',
        retryInSeconds: secondsUntilReset,
        remainingQuota: 0,
      });
    }

    res.setHeader('X-RateLimit-Remaining', remaining - 1);

    // Increment daily usage only on a successful 2xx status response
    res.on('finish', async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await User.increment('dailyAiUsageCount', {
            where: { id: userId },
            by: 1,
          });
        }
      } catch (err) {
        console.error('[aiQuotaMiddleware] Failed to increment dailyAiUsageCount:', err);
      }
    });

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { checkAiQuota };
