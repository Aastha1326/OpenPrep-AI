/**
 * Validated environment configuration.
 *
 * Single source of truth for every variable the backend reads. Values are
 * coerced to real types, constrained, and checked at startup so a
 * misconfiguration fails immediately and loudly instead of surfacing hours
 * later as a 500 buried in a service.
 *
 * Uses zod, which is already a backend dependency — no new package.
 */

const { z } = require('zod');

/**
 * Values that mean "someone copied .env.example and never filled this in".
 * Treated as unset rather than accepted, because a placeholder that boots
 * successfully is worse than one that fails: SMTP silently sends nowhere,
 * and a placeholder JWT secret is a known-value signing key.
 */
const PLACEHOLDER_PATTERNS = [
  /^your_.*_here$/i,
  /^your_[a-z_]+$/i,
  /^changeme$/i,
  /^change_me$/i,
  /^placeholder$/i,
  /^xxx+$/i,
  /^<.*>$/,
];

const isPlaceholder = (value) =>
  typeof value === 'string' && PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value.trim()));

/**
 * Normalise raw process.env before validation: trim, and collapse empty
 * strings and placeholders to undefined so zod's `.optional()` and defaults
 * behave the way an operator expects. `FOO=` in a .env file means "unset",
 * not "the empty string".
 */
const normaliseEnv = (source) => {
  const output = {};
  for (const [key, value] of Object.entries(source)) {
    if (typeof value !== 'string') {
      output[key] = value;
      continue;
    }
    const trimmed = value.trim();
    if (trimmed === '' || isPlaceholder(trimmed)) continue;
    output[key] = trimmed;
  }
  return output;
};

/**
 * Boolean parser. `process.env.FOO === 'true'` is applied inconsistently
 * across the codebase, and anywhere the comparison is forgotten the string
 * "false" is truthy. This is explicit in both directions and rejects
 * anything ambiguous rather than guessing.
 */
const booleanFromString = (defaultValue) =>
  z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value, ctx) => {
      if (value === undefined) return defaultValue;
      if (typeof value === 'boolean') return value;

      const normalised = value.toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(normalised)) return true;
      if (['false', '0', 'no', 'off'].includes(normalised)) return false;

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `expected a boolean (true/false, 1/0, yes/no, on/off), received "${value}"`,
      });
      return z.NEVER;
    });

/**
 * Integer parser with bounds. Guards against the current failure mode where
 * `parseInt` on a typo yields NaN and produces a subtly broken rate limiter
 * or connection pool rather than an error.
 */
const intFromString = (defaultValue, { min, max } = {}) =>
  z
    .union([z.number(), z.string()])
    .optional()
    .transform((value, ctx) => {
      if (value === undefined) return defaultValue;

      const parsed = typeof value === 'number' ? value : Number(value);

      if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `expected an integer, received "${value}"`,
        });
        return z.NEVER;
      }
      if (min !== undefined && parsed < min) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `must be >= ${min}, received ${parsed}` });
        return z.NEVER;
      }
      if (max !== undefined && parsed > max) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `must be <= ${max}, received ${parsed}` });
        return z.NEVER;
      }

      return parsed;
    });

const MIN_SECRET_LENGTH = 32;

const schema = z.object({
  // ── Runtime ──────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: intFromString(5000, { min: 1, max: 65535 }),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'silent']).optional(),
  TZ: z.string().optional(),
  VERCEL: z.string().optional(),

  // ── Database ─────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().optional(),
  DATABASE_URL_TEST: z.string().optional(),
  DB_POOL_MAX: intFromString(10, { min: 1, max: 100 }),
  DB_POOL_MIN: intFromString(0, { min: 0, max: 100 }),
  DB_POOL_IDLE: intFromString(10000, { min: 0 }),
  DB_POOL_ACQUIRE: intFromString(30000, { min: 0 }),
  DB_STATEMENT_TIMEOUT: intFromString(30000, { min: 0 }),
  DB_IDLE_IN_TRANSACTION_TIMEOUT: intFromString(30000, { min: 0 }),

  // ── Auth ─────────────────────────────────────────────────────────────────
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRE: z.string().default('15m'),
  ENCRYPTION_KEY: z.string().optional(),

  // ── URLs / CORS ──────────────────────────────────────────────────────────
  CLIENT_URL: z.string().url({ message: 'must be a valid URL' }).optional(),
  CLIENT_ORIGIN: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  FRONTEND_URL: z.string().url({ message: 'must be a valid URL' }).optional(),

  // ── Optional integrations ────────────────────────────────────────────────
  REDIS_URL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: intFromString(587, { min: 1, max: 65535 }),
  SMTP_SECURE: booleanFromString(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_PUBLIC_BASE_URL: z.string().optional(),
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),

  // ── Caching ──────────────────────────────────────────────────────────────
  CACHE_TTL: intFromString(3600, { min: 0 }),
  CACHE_MAX_KEYS: intFromString(1000, { min: 1 }),

  // ── OCR ───────────────────────────────────────────────────────────────────
  OCR_TIMEOUT_MS: intFromString(60000, { min: 1000 }),
  // ── File upload limits ────────────────────────────────────────────────────
  MAX_AUDIO_UPLOAD_SIZE_MB: intFromString(25, { min: 1, max: 500 }),

  // ── Test-only switches ───────────────────────────────────────────────────
  ENABLE_RATE_LIMIT_TESTS: booleanFromString(false),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  RECAPTCHA_SECRET_KEY: z.string().optional(),
});

/**
 * Requirements that only apply in production.
 *
 * Development should stay runnable with an empty .env so a frontend
 * contributor is not blocked on provisioning Redis and SMTP. Production has
 * no such excuse, and the difference has to be encoded somewhere.
 */
const productionRules = [
  {
    key: 'DATABASE_URL',
    check: (config) => Boolean(config.DATABASE_URL),
    message: 'is required in production',
    hint: 'Set the PostgreSQL connection string, e.g. postgres://user:pass@host:5432/db',
  },
  {
    key: 'JWT_SECRET',
    check: (config) => Boolean(config.JWT_SECRET),
    message: 'is required',
    hint: 'Generate one with: openssl rand -hex 32',
  },
  {
    key: 'JWT_SECRET',
    // Existence was already checked above; only judge length when it is set,
    // so a missing secret does not produce two errors for one problem.
    check: (config) => !config.JWT_SECRET || config.JWT_SECRET.length >= MIN_SECRET_LENGTH,
    message: `must be at least ${MIN_SECRET_LENGTH} characters in production`,
    hint: 'A short signing key is brute-forceable. Generate one with: openssl rand -hex 32',
  },
  {
    key: 'CLIENT_URL',
    check: (config) => Boolean(config.CLIENT_URL || config.CLIENT_ORIGIN || config.CORS_ORIGIN),
    message: 'is required in production (or set CLIENT_ORIGIN / CORS_ORIGIN)',
    hint: 'Without it, CORS falls back to the localhost development origin.',
  },
  {
    key: 'STORAGE_PROVIDER',
    check: (config) => {
      if (config.STORAGE_PROVIDER === 's3') {
        return Boolean(config.AWS_S3_BUCKET && config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY && config.AWS_REGION);
      }
      return true;
    },
    message: 'when set to s3, requires AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION',
    hint: 'Configure AWS credentials or set STORAGE_PROVIDER=local for development',
  },
];

/** Optional integrations, reported at boot as enabled/disabled — never their values. */
const INTEGRATIONS = {
  redis: (config) => Boolean(config.REDIS_URL),
  gemini: (config) => Boolean(config.GEMINI_API_KEY),
  smtp: (config) => Boolean(config.SMTP_HOST && config.SMTP_USER),
  googleOAuth: (config) => Boolean(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET),
  githubOAuth: (config) => Boolean(config.GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET),
  webPush: (config) => Boolean(config.VAPID_PUBLIC_KEY && config.VAPID_PRIVATE_KEY),
  storage: (config) => config.STORAGE_PROVIDER || 'local',
};

const summariseIntegrations = (config) => {
  const summary = {};
  for (const [name, isEnabled] of Object.entries(INTEGRATIONS)) {
    summary[name] = isEnabled(config) ? 'enabled' : 'disabled';
  }
  return summary;
};

/**
 * Validate an environment object.
 *
 * Collects *every* problem rather than throwing on the first one — an
 * operator fixing a fresh deployment should see the whole list in one pass,
 * not play whack-a-mole across six restarts.
 *
 * @returns {{success: boolean, config: object|null, errors: Array<{key: string, message: string, hint?: string}>}}
 */
const validateEnv = (source = process.env) => {
  const normalised = normaliseEnv(source);
  const parsed = schema.safeParse(normalised);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => ({
      key: issue.path.join('.') || '(root)',
      message: issue.message,
    }));
    return { success: false, config: null, errors };
  }

  const config = parsed.data;
  const errors = [];

  if (config.NODE_ENV === 'production') {
    for (const rule of productionRules) {
      if (!rule.check(config)) {
        errors.push({ key: rule.key, message: rule.message, hint: rule.hint });
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, config, errors };
  }

  return { success: true, config, errors: [] };
};

/** Render errors as a readable block rather than a stack trace. */
const formatErrors = (errors) => {
  const lines = ['', 'Environment configuration is invalid:', ''];
  for (const error of errors) {
    lines.push(`  • ${error.key}: ${error.message}`);
    if (error.hint) lines.push(`      ${error.hint}`);
  }
  lines.push('', 'See backend/.env.example for the full list of supported variables.', '');
  return lines.join('\n');
};

/**
 * Validate at startup and return the frozen config.
 *
 * Production exits on failure. Development degrades to a warning so a
 * frontend contributor with a half-filled .env can still boot the API.
 * Test never exits — a hard exit inside a test runner kills the whole run
 * and hides the actual assertion failure.
 */
const loadEnv = (source = process.env, options = {}) => {
  const { onExit = (code) => process.exit(code), logger = console } = options;
  const result = validateEnv(source);

  if (!result.success) {
    const nodeEnv = source.NODE_ENV || 'development';
    const report = formatErrors(result.errors);

    if (nodeEnv === 'production') {
      logger.error(report);
      onExit(1);
      return result.config ? Object.freeze(result.config) : null;
    }

    logger.warn(report);
    logger.warn('Continuing with defaults because NODE_ENV is not production.\n');
  }

  return result.config ? Object.freeze(result.config) : null;
};

module.exports = {
  loadEnv,
  validateEnv,
  formatErrors,
  summariseIntegrations,
  isPlaceholder,
  normaliseEnv,
  schema,
  MIN_SECRET_LENGTH,
  PLACEHOLDER_PATTERNS,
};
