/**
 * Retry policy for the shared axios client.
 *
 * Kept in its own module (rather than inline in services/api.js) so the
 * decision logic — "is this request safe to replay, and how long should we
 * wait?" — is testable without standing up an axios instance.
 */

/** Requests we may replay without the server observing a second side effect. */
const IDEMPOTENT_METHODS = ['get', 'head', 'options'];

/** Status codes worth a second attempt. Everything else is a real answer. */
const RETRYABLE_STATUS_CODES = [408, 425, 429, 500, 502, 503, 504];

/** axios/browser error codes that mean "the request never got an answer". */
const RETRYABLE_ERROR_CODES = ['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'ERR_NETWORK', 'EAI_AGAIN'];

export const DEFAULT_RETRY_CONFIG = {
  retries: 2,
  baseDelayMs: 400,
  maxDelayMs: 8000,
};

/**
 * Endpoints that legitimately take a long time — AI generation, PDF parsing,
 * OCR and uploads. Matched against the request URL; anything else uses the
 * default deadline.
 */
export const SLOW_ENDPOINT_PATTERNS = [
  /\/ai\//,
  /\/documents\//,
  /\/ocr\//,
  /\/pdf/,
  /\/flashcards\/from-/,
  /\/syllabus\/(import|parse)/,
  /\/upload/,
];

export const DEFAULT_TIMEOUT_MS = 15000;
export const SLOW_ENDPOINT_TIMEOUT_MS = 120000;

/**
 * Pick a deadline for a request. Without this every request inherits axios's
 * default of *no* timeout, which is what leaves the dashboard spinning
 * forever when a connection drops mid-flight.
 */
export const resolveTimeout = (url = '', explicitTimeout) => {
  if (typeof explicitTimeout === 'number' && explicitTimeout > 0) return explicitTimeout;
  if (SLOW_ENDPOINT_PATTERNS.some((pattern) => pattern.test(url))) return SLOW_ENDPOINT_TIMEOUT_MS;
  return DEFAULT_TIMEOUT_MS;
};

export const isTimeoutError = (error) =>
  error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT' || /timeout/i.test(error?.message || '');

/** No `error.response` means the request never reached the server. */
export const isNetworkError = (error) =>
  !error?.response && (RETRYABLE_ERROR_CODES.includes(error?.code) || error?.message === 'Network Error');

/**
 * Whether `error` is worth replaying.
 *
 * The conservative half of this matters more than the permissive half: a
 * replayed POST can double-charge a quiz submission, and the CSRF token
 * attached by the request interceptor is single-use, so a blind retry of a
 * mutating request fails with a confusing 403 rather than succeeding.
 */
export const shouldRetry = (error, config = {}, attempt = 0) => {
  const retries = config.retries ?? DEFAULT_RETRY_CONFIG.retries;
  if (attempt >= retries) return false;

  // Never replay the refresh call — the interceptor already queues around it,
  // and a second refresh can rotate the token out from under the first.
  const url = config.url || '';
  if (url.includes('/auth/refresh-token')) return false;

  const method = (config.method || 'get').toLowerCase();
  const isIdempotent = IDEMPOTENT_METHODS.includes(method);
  // Callers that know their POST is safe (or server-side idempotent) opt in
  // explicitly rather than us guessing.
  if (!isIdempotent && config.retryNonIdempotent !== true) return false;

  if (isNetworkError(error) || isTimeoutError(error)) return true;

  const status = error?.response?.status;
  return typeof status === 'number' && RETRYABLE_STATUS_CODES.includes(status);
};

/**
 * Parse a Retry-After header. Accepts both forms in the spec: delta-seconds
 * and an HTTP date. Returns null when absent or unparseable so the caller
 * falls back to computed backoff.
 */
export const parseRetryAfter = (headers = {}, now = Date.now()) => {
  const raw = headers['retry-after'] ?? headers['Retry-After'];
  if (raw === undefined || raw === null || raw === '') return null;

  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return seconds >= 0 ? seconds * 1000 : null;

  const timestamp = Date.parse(raw);
  if (Number.isNaN(timestamp)) return null;

  return Math.max(0, timestamp - now);
};

/**
 * Exponential backoff with full jitter.
 *
 * Full jitter (a uniform draw over the whole window, not base + jitter) is
 * what actually prevents a thundering herd: after a backend restart every
 * client would otherwise wake at the same instant and knock it over again.
 */
export const getRetryDelay = (attempt, error, config = {}, random = Math.random) => {
  const baseDelayMs = config.baseDelayMs ?? DEFAULT_RETRY_CONFIG.baseDelayMs;
  const maxDelayMs = config.maxDelayMs ?? DEFAULT_RETRY_CONFIG.maxDelayMs;

  // A server that tells us when to come back wins over our guess.
  const retryAfter = parseRetryAfter(error?.response?.headers || {});
  if (retryAfter !== null) return Math.min(retryAfter, maxDelayMs);

  const exponential = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
  return Math.round(random() * exponential);
};

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** navigator is absent in SSR/test contexts; assume online rather than blocking. */
export const isOnline = () => {
  if (typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean') return true;
  return navigator.onLine;
};

/**
 * Resolve once the browser reports connectivity again, or after `timeoutMs`.
 *
 * Waiting on the `online` event instead of sleeping means a user who
 * reconnects after ten seconds in a tunnel gets their request served
 * immediately rather than after the full backoff.
 */
export const waitForOnline = (timeoutMs = 30000) => {
  if (isOnline()) return Promise.resolve(true);
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('online', onOnline);
      clearTimeout(timer);
      resolve(value);
    };

    const onOnline = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);

    window.addEventListener('online', onOnline);
  });
};

export const RETRY_CONSTANTS = {
  IDEMPOTENT_METHODS,
  RETRYABLE_STATUS_CODES,
  RETRYABLE_ERROR_CODES,
};
