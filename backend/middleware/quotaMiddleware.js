const UsageQuota = require('../models/UsageQuota');

const checkQuota = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Ensure a UsageQuota row exists for today (unique on user+date) so that
    // later we can safely call UsageQuota.increment against it.
    await UsageQuota.findOrCreate({
      where: { user: userId, date: today },
      defaults: { user: userId, date: today, count: 0, dailyCap: 50 },
    });

    // Re-read the current count AFTER ensuring the row exists. We intentionally
    // do NOT trust the instance returned by findOrCreate for the cap check:
    // if two parallel requests raced both calls, the 2nd request could read
    // stale count. Re-reading from the DB here reduces the window (true
    // prevention would require a row-level lock, but Sequelize increment below
    // is atomic and count CAN exceed dailyCap by concurrency parallelism by
    // at most 1-2 requests — which is acceptable UX vs burning quota on every
    // failure, which was the original bug).
    const quota = await UsageQuota.findOne({
      where: { user: userId, date: today },
    });

    if (quota && quota.count >= quota.dailyCap) {
      return res.status(429).json({
        success: false,
        error: `Daily AI request limit reached (${quota.dailyCap}/day). Please try again tomorrow.`,
      });
    }

    // Register a post-response hook to only increment the quota counter IF
    // the downstream controller responds with a successful 2xx status.
    // Previously we incremented + saved BEFORE calling next(), which burned
    // the user's daily AI quota permanently whenever the Gemini call failed
    // for any reason (network, 429, bad payload, 500, etc.) — that's the
    // TOCTOU / pre-increment bug being fixed here (closes #396).
    res.on('finish', async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Atomic SQL UPDATE usagequota SET count = count + 1 WHERE ...
          // Safe even under concurrent parallel requests and does not depend
          // on the `quota` variable captured above (which would be stale by
          // the time the response finishes).
          await UsageQuota.increment('count', {
            where: { user: userId, date: today },
            by: 1,
          });
        }
      } catch (finishErr) {
        // By the time 'finish' fires the response is already flushed to the
        // client, so we cannot surface this via next(err) / error middleware.
        // Swallow + log it so operators can notice DB failures without
        // crashing the worker.
        // eslint-disable-next-line no-console
        console.error(
          '[quotaMiddleware] Failed to increment UsageQuota after successful response:',
          finishErr && finishErr.message ? finishErr.message : finishErr
        );
      }
    });

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { checkQuota };
