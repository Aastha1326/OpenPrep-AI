import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_TIMEOUT_MS,
  SLOW_ENDPOINT_TIMEOUT_MS,
  getRetryDelay,
  isNetworkError,
  isOnline,
  isTimeoutError,
  parseRetryAfter,
  resolveTimeout,
  shouldRetry,
  wait,
  waitForOnline,
} from './retry';

describe('resolveTimeout', () => {
  test('applies the default deadline to an ordinary endpoint', () => {
    expect(resolveTimeout('/flashcards')).toBe(DEFAULT_TIMEOUT_MS);
    expect(resolveTimeout('/quizzes/123')).toBe(DEFAULT_TIMEOUT_MS);
  });

  test('widens the deadline for endpoints that are legitimately slow', () => {
    expect(resolveTimeout('/ai/generate-quiz')).toBe(SLOW_ENDPOINT_TIMEOUT_MS);
    expect(resolveTimeout('/documents/parse')).toBe(SLOW_ENDPOINT_TIMEOUT_MS);
    expect(resolveTimeout('/ocr/extract')).toBe(SLOW_ENDPOINT_TIMEOUT_MS);
    expect(resolveTimeout('/flashcards/from-audio')).toBe(SLOW_ENDPOINT_TIMEOUT_MS);
    expect(resolveTimeout('/pdf/quiz')).toBe(SLOW_ENDPOINT_TIMEOUT_MS);
  });

  test('an explicit per-request timeout wins over both', () => {
    expect(resolveTimeout('/ai/generate-quiz', 5000)).toBe(5000);
    expect(resolveTimeout('/flashcards', 90000)).toBe(90000);
  });

  test('ignores a non-positive or non-numeric explicit timeout', () => {
    expect(resolveTimeout('/flashcards', 0)).toBe(DEFAULT_TIMEOUT_MS);
    expect(resolveTimeout('/flashcards', -1)).toBe(DEFAULT_TIMEOUT_MS);
    expect(resolveTimeout('/flashcards', '5000')).toBe(DEFAULT_TIMEOUT_MS);
  });

  test('handles a missing url without throwing', () => {
    expect(resolveTimeout()).toBe(DEFAULT_TIMEOUT_MS);
  });
});

describe('error classification', () => {
  test('recognises axios timeout errors', () => {
    expect(isTimeoutError({ code: 'ECONNABORTED' })).toBe(true);
    expect(isTimeoutError({ code: 'ETIMEDOUT' })).toBe(true);
    expect(isTimeoutError({ message: 'timeout of 15000ms exceeded' })).toBe(true);
    expect(isTimeoutError({ code: 'ERR_BAD_REQUEST' })).toBe(false);
  });

  test('recognises network errors only when no response came back', () => {
    expect(isNetworkError({ code: 'ERR_NETWORK' })).toBe(true);
    expect(isNetworkError({ message: 'Network Error' })).toBe(true);
    expect(isNetworkError({ code: 'ECONNRESET' })).toBe(true);
    // A 500 is a real answer from the server, not a network failure.
    expect(isNetworkError({ code: 'ERR_NETWORK', response: { status: 500 } })).toBe(false);
    expect(isNetworkError({ response: { status: 503 } })).toBe(false);
  });
});

describe('shouldRetry', () => {
  const networkError = { code: 'ERR_NETWORK', message: 'Network Error' };
  const getConfig = { method: 'get', url: '/flashcards' };

  test('retries idempotent requests that never reached the server', () => {
    expect(shouldRetry(networkError, getConfig, 0)).toBe(true);
    expect(shouldRetry({ code: 'ECONNABORTED' }, getConfig, 0)).toBe(true);
  });

  test('retries idempotent requests on retryable status codes', () => {
    for (const status of [408, 425, 429, 500, 502, 503, 504]) {
      expect(shouldRetry({ response: { status } }, getConfig, 0)).toBe(true);
    }
  });

  test('does not retry a genuine client error', () => {
    for (const status of [400, 401, 403, 404, 409, 422]) {
      expect(shouldRetry({ response: { status } }, getConfig, 0)).toBe(false);
    }
  });

  test('does not replay mutating requests by default', () => {
    // A replayed POST can double-submit a quiz, and the CSRF token attached
    // by the request interceptor is single-use.
    for (const method of ['post', 'put', 'patch', 'delete']) {
      expect(shouldRetry(networkError, { method, url: '/quizzes/submit' }, 0)).toBe(false);
    }
  });

  test('allows an explicit opt-in for a mutating request known to be safe', () => {
    expect(
      shouldRetry(networkError, { method: 'post', url: '/analytics/telemetry', retryNonIdempotent: true }, 0)
    ).toBe(true);
  });

  test('never replays the refresh-token call', () => {
    expect(shouldRetry(networkError, { method: 'get', url: '/auth/refresh-token' }, 0)).toBe(false);
    expect(
      shouldRetry(networkError, { method: 'post', url: '/auth/refresh-token', retryNonIdempotent: true }, 0)
    ).toBe(false);
  });

  test('stops once the attempt budget is spent', () => {
    expect(shouldRetry(networkError, getConfig, 0)).toBe(true);
    expect(shouldRetry(networkError, getConfig, 1)).toBe(true);
    expect(shouldRetry(networkError, getConfig, 2)).toBe(false);
    expect(shouldRetry(networkError, getConfig, 99)).toBe(false);
  });

  test('honours a per-request retry budget', () => {
    expect(shouldRetry(networkError, { ...getConfig, retries: 0 }, 0)).toBe(false);
    expect(shouldRetry(networkError, { ...getConfig, retries: 5 }, 4)).toBe(true);
  });

  test('treats a missing method as a GET', () => {
    expect(shouldRetry(networkError, { url: '/flashcards' }, 0)).toBe(true);
  });

  test('is case-insensitive about the method', () => {
    expect(shouldRetry(networkError, { method: 'GET', url: '/flashcards' }, 0)).toBe(true);
    expect(shouldRetry(networkError, { method: 'POST', url: '/notes' }, 0)).toBe(false);
  });
});

describe('parseRetryAfter', () => {
  test('parses delta-seconds', () => {
    expect(parseRetryAfter({ 'retry-after': '30' })).toBe(30000);
    expect(parseRetryAfter({ 'retry-after': 5 })).toBe(5000);
    expect(parseRetryAfter({ 'retry-after': '0' })).toBe(0);
  });

  test('parses the HTTP-date form relative to now', () => {
    const now = Date.parse('2026-08-12T10:00:00Z');
    const headers = { 'retry-after': 'Wed, 12 Aug 2026 10:00:45 GMT' };
    expect(parseRetryAfter(headers, now)).toBe(45000);
  });

  test('clamps a date already in the past to zero', () => {
    const now = Date.parse('2026-08-12T10:00:00Z');
    expect(parseRetryAfter({ 'retry-after': 'Wed, 12 Aug 2026 09:59:00 GMT' }, now)).toBe(0);
  });

  test('accepts the canonical header casing', () => {
    expect(parseRetryAfter({ 'Retry-After': '10' })).toBe(10000);
  });

  test('returns null when absent or unparseable', () => {
    expect(parseRetryAfter({})).toBeNull();
    expect(parseRetryAfter({ 'retry-after': '' })).toBeNull();
    expect(parseRetryAfter({ 'retry-after': 'soon' })).toBeNull();
    expect(parseRetryAfter({ 'retry-after': '-5' })).toBeNull();
    expect(parseRetryAfter()).toBeNull();
  });
});

describe('getRetryDelay', () => {
  test('grows exponentially across attempts', () => {
    const noJitter = () => 1; // full jitter draws over [0, window); pin to the top
    expect(getRetryDelay(0, {}, {}, noJitter)).toBe(400);
    expect(getRetryDelay(1, {}, {}, noJitter)).toBe(800);
    expect(getRetryDelay(2, {}, {}, noJitter)).toBe(1600);
    expect(getRetryDelay(3, {}, {}, noJitter)).toBe(3200);
  });

  test('caps at the configured maximum', () => {
    const noJitter = () => 1;
    expect(getRetryDelay(20, {}, {}, noJitter)).toBe(8000);
    expect(getRetryDelay(20, {}, { maxDelayMs: 2000 }, noJitter)).toBe(2000);
  });

  test('applies full jitter so clients do not wake in lockstep', () => {
    // A herd of clients retrying a restarted backend at the same instant
    // would knock it over again; the delay must be spread across the window.
    expect(getRetryDelay(2, {}, {}, () => 0)).toBe(0);
    expect(getRetryDelay(2, {}, {}, () => 0.5)).toBe(800);
    expect(getRetryDelay(2, {}, {}, () => 1)).toBe(1600);
  });

  test('a server-supplied Retry-After wins over computed backoff', () => {
    const error = { response: { headers: { 'retry-after': '3' } } };
    expect(getRetryDelay(0, error, {}, () => 1)).toBe(3000);
  });

  test('still caps a Retry-After that exceeds the maximum', () => {
    const error = { response: { headers: { 'retry-after': '600' } } };
    expect(getRetryDelay(0, error, {}, () => 1)).toBe(8000);
  });

  test('honours a custom base delay', () => {
    expect(getRetryDelay(0, {}, { baseDelayMs: 1000 }, () => 1)).toBe(1000);
  });
});

describe('connectivity helpers', () => {
  let originalOnLine;

  beforeEach(() => {
    originalOnLine = Object.getOwnPropertyDescriptor(window.navigator, 'onLine');
  });

  afterEach(() => {
    if (originalOnLine) {
      Object.defineProperty(window.navigator, 'onLine', originalOnLine);
    }
    vi.useRealTimers();
  });

  const setOnLine = (value) => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => value,
    });
  };

  test('isOnline reflects navigator.onLine', () => {
    setOnLine(true);
    expect(isOnline()).toBe(true);
    setOnLine(false);
    expect(isOnline()).toBe(false);
  });

  test('waitForOnline resolves immediately when already online', async () => {
    setOnLine(true);
    await expect(waitForOnline(50)).resolves.toBe(true);
  });

  test('waitForOnline resolves as soon as the online event fires', async () => {
    setOnLine(false);
    const pending = waitForOnline(5000);

    setOnLine(true);
    window.dispatchEvent(new Event('online'));

    await expect(pending).resolves.toBe(true);
  });

  test('waitForOnline gives up after the timeout', async () => {
    vi.useFakeTimers();
    setOnLine(false);

    const pending = waitForOnline(1000);
    vi.advanceTimersByTime(1000);

    await expect(pending).resolves.toBe(false);
  });

  test('wait resolves after the given delay', async () => {
    vi.useFakeTimers();
    const pending = wait(500);
    vi.advanceTimersByTime(500);
    await expect(pending).resolves.toBeUndefined();
  });
});
