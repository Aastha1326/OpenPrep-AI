import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const fs = require('fs');
const path = require('path');

const CONTROLLER_PATH = path.join(__dirname, '..', '..', 'controllers', 'MockInterviewController.js');
const SOURCE = fs.readFileSync(CONTROLLER_PATH, 'utf8');

const MockInterviewService = require('../../services/MockInterviewService');
const MockInterviewController = require('../../controllers/MockInterviewController');

/** Minimal Express response double that records status and payload. */
function mockRes() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };
}

const mockReq = (overrides = {}) => ({
  params: {},
  body: {},
  user: { id: 42 },
  ...overrides,
});

describe('MockInterviewController source integrity', () => {
  it('parses as valid JavaScript', () => {
    // getFeedbackProvenance had been spliced into the middle of
    // getEvaluation's try block, so the file died on
    // `SyntaxError: Unexpected strict mode reserved word` and every router
    // that mounts it failed to load.
    expect(() => new Function(SOURCE)).not.toThrow();
  });

  it('declares every handler at class-body indentation', () => {
    // A `static async` nested inside another method's body is the exact shape
    // of the regression: the declaration sat at eight spaces of indent inside
    // an open try, rather than at four as a sibling.
    const misplaced = SOURCE.split('\n')
      .map((line, index) => ({ line, number: index + 1 }))
      .filter(({ line }) => /^\s*static\s+async\s/.test(line) && !/^ {4}static\s/.test(line));

    expect(misplaced.map((entry) => `${entry.number}: ${entry.line.trim()}`)).toEqual([]);
  });

  it('gives each handler exactly one try and one catch', () => {
    // getEvaluation had a try with no catch; getFeedbackProvenance was
    // followed by a catch belonging to a different method.
    const handlers = SOURCE.split(/^ {4}(?=static\s+async\s)/m).slice(1);

    expect(handlers.length).toBeGreaterThan(0);

    for (const handler of handlers) {
      const name = handler.match(/static\s+async\s+(\w+)/)[1];
      const tries = (handler.match(/\btry\s*\{/g) || []).length;
      const catches = (handler.match(/\}\s*catch\s*\(/g) || []).length;

      expect(tries, `${name} try count`).toBe(1);
      expect(catches, `${name} catch count`).toBe(1);
    }
  });

  it('exposes every handler mockInterviewRoutes binds', () => {
    for (const handler of [
      'initiate',
      'start',
      'submitReply',
      'getEvaluation',
      'getFeedbackProvenance',
      'compareEvaluation',
      'conclude',
      'processingStatus',
      'retryProcessing',
    ]) {
      expect(typeof MockInterviewController[handler], `${handler} is missing`).toBe('function');
    }
  });
});

describe('MockInterviewController.getEvaluation', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the evaluation metadata for the session', async () => {
    vi.spyOn(MockInterviewService, 'getEvaluationMetadata').mockResolvedValue({
      version: 3,
      overallScore: 78,
    });

    const res = mockRes();
    await MockInterviewController.getEvaluation(mockReq({ params: { id: 'sess-1' } }), res);

    expect(MockInterviewService.getEvaluationMetadata).toHaveBeenCalledWith('sess-1', 42);
    expect(res.statusCode).toBe(200);
    expect(res.payload).toEqual({ success: true, data: { version: 3, overallScore: 78 } });
  });

  it('answers 400 rather than throwing when the service rejects', async () => {
    // This is the branch the missing catch removed entirely: the rejection
    // escaped the handler and surfaced as an unhandled promise rejection
    // instead of a response.
    vi.spyOn(MockInterviewService, 'getEvaluationMetadata').mockRejectedValue(
      new Error('Session not found')
    );

    const res = mockRes();
    await MockInterviewController.getEvaluation(mockReq({ params: { id: 'missing' } }), res);

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ error: 'Session not found' });
  });

  it('falls back to a generic message when the error carries none', async () => {
    vi.spyOn(MockInterviewService, 'getEvaluationMetadata').mockRejectedValue(new Error(''));

    const res = mockRes();
    await MockInterviewController.getEvaluation(mockReq({ params: { id: 'x' } }), res);

    expect(res.payload).toEqual({ error: 'Failed to get evaluation metadata' });
  });

  it('reads the user from the body when no session user is attached', async () => {
    vi.spyOn(MockInterviewService, 'getEvaluationMetadata').mockResolvedValue({});

    const res = mockRes();
    await MockInterviewController.getEvaluation(
      mockReq({ params: { id: 'sess-2' }, body: { userId: 7 }, user: undefined }),
      res
    );

    expect(MockInterviewService.getEvaluationMetadata).toHaveBeenCalledWith('sess-2', 7);
  });
});

describe('MockInterviewController.compareEvaluation', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes the requested version through to the service', async () => {
    vi.spyOn(MockInterviewService, 'compareEvaluationVersions').mockResolvedValue({ delta: 5 });

    const res = mockRes();
    await MockInterviewController.compareEvaluation(
      mockReq({ params: { id: 'sess-1', version: '2' } }),
      res
    );

    expect(MockInterviewService.compareEvaluationVersions).toHaveBeenCalledWith('sess-1', 42, '2');
    expect(res.statusCode).toBe(200);
    expect(res.payload).toEqual({ success: true, data: { delta: 5 } });
  });

  it('answers 400 when the version cannot be compared', async () => {
    vi.spyOn(MockInterviewService, 'compareEvaluationVersions').mockRejectedValue(
      new Error('Version 9 does not exist')
    );

    const res = mockRes();
    await MockInterviewController.compareEvaluation(
      mockReq({ params: { id: 'sess-1', version: '9' } }),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ error: 'Version 9 does not exist' });
  });
});

describe('MockInterviewController.initiate', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects an unauthenticated request before touching the service', async () => {
    const spy = vi.spyOn(MockInterviewService, 'initiateSession');

    const res = mockRes();
    await MockInterviewController.initiate(mockReq({ user: undefined, body: {} }), res);

    expect(res.statusCode).toBe(401);
    expect(res.payload).toEqual({ error: 'Unauthorized' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns 201 with the created session', async () => {
    vi.spyOn(MockInterviewService, 'initiateSession').mockResolvedValue({ id: 'sess-9' });

    const res = mockRes();
    await MockInterviewController.initiate(mockReq({ body: { role: 'backend' } }), res);

    expect(res.statusCode).toBe(201);
    expect(res.payload).toEqual({ success: true, data: { id: 'sess-9' } });
  });

  it('answers 500 when session creation fails', async () => {
    vi.spyOn(MockInterviewService, 'initiateSession').mockRejectedValue(new Error('db down'));

    const res = mockRes();
    await MockInterviewController.initiate(mockReq({ body: {} }), res);

    expect(res.statusCode).toBe(500);
    expect(res.payload).toEqual({ error: 'Failed to initialize session' });
  });
});

describe('MockInterviewController.submitReply', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requires message text', async () => {
    const spy = vi.spyOn(MockInterviewService, 'submitResponse');

    const res = mockRes();
    await MockInterviewController.submitReply(mockReq({ params: { id: 'sess-1' }, body: {} }), res);

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ error: 'Message text is required' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('forwards the reply and returns the service payload', async () => {
    vi.spyOn(MockInterviewService, 'submitResponse').mockResolvedValue({ nextQuestion: 'Why?' });

    const res = mockRes();
    await MockInterviewController.submitReply(
      mockReq({ params: { id: 'sess-1' }, body: { text: 'Because.' } }),
      res
    );

    expect(MockInterviewService.submitResponse).toHaveBeenCalledWith('sess-1', 42, 'Because.');
    expect(res.statusCode).toBe(200);
    expect(res.payload).toEqual({ success: true, data: { nextQuestion: 'Why?' } });
  });
});
