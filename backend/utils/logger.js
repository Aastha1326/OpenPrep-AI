/**
 * Leveled application logger.
 *
 * Emits one JSON object per line when NODE_ENV=production so log drains
 * (Render, CloudWatch, Loki) can index the fields, and colourised
 * human-readable lines everywhere else. Stays silent under NODE_ENV=test
 * unless LOG_LEVEL is set explicitly, which keeps `vitest` output readable.
 *
 * Deliberately dependency-free: the backend is deployed to a serverless
 * target where every extra transport/worker dependency costs cold-start
 * time, and the feature set we actually need (levels, JSON, redaction,
 * child loggers) is a couple hundred lines.
 */

const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const LEVEL_COLOURS = {
  error: '\x1b[31m', // red
  warn: '\x1b[33m', // yellow
  info: '\x1b[36m', // cyan
  debug: '\x1b[90m', // grey
};

const COLOUR_RESET = '\x1b[0m';

/**
 * Keys whose values are never safe to write to a log. Matched
 * case-insensitively against the *whole* key, plus a few substring rules
 * below, so `refreshToken`, `REFRESH_TOKEN` and `x-refresh-token` all hit.
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordconfirm',
  'currentpassword',
  'newpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'jwt',
  'authorization',
  'cookie',
  'setcookie',
  'apikey',
  'api_key',
  'secret',
  'clientsecret',
  'privatekey',
  'sessionid',
  'otp',
  'mfasecret',
  'totpsecret',
  'creditcard',
  'ssn',
]);

/**
 * Substrings that mark a key as sensitive even when the exact name isn't in
 * the set above — covers Sequelize/Passport field names we don't enumerate,
 * e.g. `googleRefreshTokenEncrypted` or `vapidPrivateKey`.
 */
const SENSITIVE_PATTERNS = ['password', 'secret', 'token', 'apikey', 'api_key', 'privatekey'];

const REDACTED = '[REDACTED]';
const MAX_DEPTH = 6;
const MAX_ARRAY_ITEMS = 50;
const MAX_STRING_LENGTH = 2000;

const normaliseKey = (key) => String(key).toLowerCase().replace(/[-_\s]/g, '');

const isSensitiveKey = (key) => {
  const normalised = normaliseKey(key);
  if (SENSITIVE_KEYS.has(normalised)) return true;
  return SENSITIVE_PATTERNS.some((pattern) => normalised.includes(pattern));
};

/**
 * Recursively copy `value`, replacing sensitive values with [REDACTED].
 *
 * Bounded on three axes so a hostile or merely enormous payload (a Sequelize
 * error carrying a full result set, say) can't stall the process or blow the
 * stack: depth, array length, and string length. Circular references are
 * tracked with a WeakSet because Express request/response objects and
 * Sequelize instances are riddled with them.
 */
const redact = (value, depth = 0, seen = new WeakSet()) => {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}…[truncated ${value.length - MAX_STRING_LENGTH} chars]`
      : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return typeof value === 'bigint' ? value.toString() : value;
  }

  if (typeof value === 'function') return '[Function]';
  if (typeof value === 'symbol') return value.toString();

  if (value instanceof Date) return value.toISOString();

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      // Only the top frames matter for triage and full traces dominate the
      // line length in aggregators.
      stack: typeof value.stack === 'string' ? value.stack.split('\n').slice(0, 12).join('\n') : undefined,
      ...(value.statusCode ? { statusCode: value.statusCode } : {}),
      ...(value.code ? { code: value.code } : {}),
    };
  }

  if (depth >= MAX_DEPTH) return '[Object]';

  if (Array.isArray(value)) {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    const items = value.slice(0, MAX_ARRAY_ITEMS).map((item) => redact(item, depth + 1, seen));
    if (value.length > MAX_ARRAY_ITEMS) {
      items.push(`…${value.length - MAX_ARRAY_ITEMS} more items`);
    }
    return items;
  }

  if (typeof value === 'object') {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);

    // Sequelize model instances expose their columns through dataValues;
    // logging the raw instance would dump the whole prototype chain.
    const source = value.dataValues && typeof value.dataValues === 'object' ? value.dataValues : value;

    const output = {};
    for (const key of Object.keys(source)) {
      output[key] = isSensitiveKey(key) ? REDACTED : redact(source[key], depth + 1, seen);
    }
    return output;
  }

  return String(value);
};

const resolveLevel = () => {
  const configured = process.env.LOG_LEVEL && process.env.LOG_LEVEL.toLowerCase();
  if (configured && configured in LEVELS) return configured;
  if (configured === 'silent') return 'silent';
  if (process.env.NODE_ENV === 'test') return 'silent';
  if (process.env.NODE_ENV === 'production') return 'info';
  return 'debug';
};

const formatPretty = (level, message, meta) => {
  const colour = LEVEL_COLOURS[level] || '';
  const time = new Date().toISOString().slice(11, 23);
  const head = `${colour}${level.toUpperCase().padEnd(5)}${COLOUR_RESET} ${time} ${message}`;
  const keys = Object.keys(meta);
  if (keys.length === 0) return head;
  // Compact single-line context keeps the dev console scannable; anything
  // deeper is still available in the JSON produced in production.
  const context = keys
    .map((key) => `${key}=${typeof meta[key] === 'object' ? JSON.stringify(meta[key]) : meta[key]}`)
    .join(' ');
  return `${head} ${COLOUR_RESET}${LEVEL_COLOURS.debug}${context}${COLOUR_RESET}`;
};

const write = (level, message, meta = {}) => {
  const activeLevel = resolveLevel();
  if (activeLevel === 'silent') return;
  if (LEVELS[level] > LEVELS[activeLevel]) return;

  const safeMeta = redact(meta);
  const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;

  if (process.env.NODE_ENV === 'production') {
    stream.write(
      `${JSON.stringify({
        level,
        time: new Date().toISOString(),
        message: String(message),
        ...safeMeta,
      })}\n`
    );
    return;
  }

  stream.write(`${formatPretty(level, message, safeMeta)}\n`);
};

/**
 * Create a logger whose every call is merged with `boundMeta`. Used by the
 * request logger to pin the correlation ID onto everything logged while
 * handling that request.
 */
const child = (boundMeta = {}) => ({
  error: (message, meta = {}) => write('error', message, { ...boundMeta, ...meta }),
  warn: (message, meta = {}) => write('warn', message, { ...boundMeta, ...meta }),
  info: (message, meta = {}) => write('info', message, { ...boundMeta, ...meta }),
  debug: (message, meta = {}) => write('debug', message, { ...boundMeta, ...meta }),
  child: (extraMeta = {}) => child({ ...boundMeta, ...extraMeta }),
});

const logger = {
  ...child({}),
  // Exported for tests and for callers that want to redact before handing a
  // payload to another sink (e.g. an error tracker).
  redact,
  isSensitiveKey,
  getLevel: resolveLevel,
  LEVELS,
};

module.exports = logger;
