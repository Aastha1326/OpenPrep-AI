/**
 * Request correlation + access logging.
 *
 * Assigns every request an ID, exposes it as `req.id` and on the
 * `X-Request-Id` response header, and writes one completion line carrying
 * method, path, status, duration and (when authenticated) the user ID.
 *
 * An inbound `X-Request-Id` is honoured so a trace started at the proxy or
 * in the frontend survives into the API logs — but it is validated first,
 * because that header is attacker-controlled and would otherwise be a log
 * injection vector.
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

// Paths that would otherwise dominate the log: platform health probes fire
// every few seconds and static avatars are served on every page render.
const DEFAULT_SKIP_PATHS = ['/healthz', '/api/health', '/api/v1/health', '/uploads/avatars', '/favicon.ico'];

const MAX_INBOUND_ID_LENGTH = 64;
const SAFE_ID_PATTERN = /^[A-Za-z0-9._-]+$/;

/**
 * Only accept an inbound ID that is short and alphanumeric. Anything else
 * (newlines, control characters, a 4 KB blob) gets a fresh generated ID
 * instead of being echoed into the log stream.
 */
const sanitiseInboundId = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_INBOUND_ID_LENGTH) return null;
  if (!SAFE_ID_PATTERN.test(trimmed)) return null;
  return trimmed;
};

const generateId = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Map a status code onto the level its access line should be logged at, so
 * a production `info` level still surfaces every failing request.
 */
const levelForStatus = (status) => {
  if (status >= 500) return 'error';
  if (status >= 400) return 'warn';
  return 'info';
};

const shouldSkip = (path, skipPaths) => skipPaths.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

const requestLogger = (options = {}) => {
  const skipPaths = options.skipPaths || DEFAULT_SKIP_PATHS;
  const slowRequestMs = options.slowRequestMs || 1000;

  return (req, res, next) => {
    const inbound = sanitiseInboundId(req.headers['x-request-id']);
    const requestId = inbound || generateId();

    req.id = requestId;
    // Bound logger so controllers can `req.log.info(...)` and inherit the
    // correlation ID without threading it through every call site.
    req.log = logger.child({ requestId });
    res.setHeader('X-Request-Id', requestId);

    if (shouldSkip(req.path, skipPaths)) {
      return next();
    }

    const startedAt = process.hrtime.bigint();

    // `finish` covers normal responses; `close` catches clients that hang up
    // mid-response, which would otherwise never be logged at all.
    let logged = false;
    const complete = (aborted) => {
      if (logged) return;
      logged = true;

      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      const status = res.statusCode;
      const level = aborted ? 'warn' : levelForStatus(status);

      logger[level](aborted ? 'request aborted' : 'request completed', {
        requestId,
        method: req.method,
        // req.originalUrl keeps the query string; strip it so tokens passed
        // as query params (some OAuth callbacks do) never reach the log.
        path: req.originalUrl ? req.originalUrl.split('?')[0] : req.path,
        status,
        durationMs: Math.round(durationMs * 100) / 100,
        ...(req.user && req.user.id ? { userId: req.user.id } : {}),
        ...(durationMs > slowRequestMs ? { slow: true } : {}),
        ...(aborted ? { aborted: true } : {}),
      });
    };

    res.on('finish', () => complete(false));
    res.on('close', () => {
      // `close` fires after `finish` on a healthy response too; the `logged`
      // guard means only a genuinely aborted request takes this branch.
      if (!res.writableEnded) complete(true);
    });

    return next();
  };
};

module.exports = requestLogger;
module.exports.DEFAULT_SKIP_PATHS = DEFAULT_SKIP_PATHS;
module.exports.sanitiseInboundId = sanitiseInboundId;
module.exports.levelForStatus = levelForStatus;
