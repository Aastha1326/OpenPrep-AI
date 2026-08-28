import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * The controller holds a module reference and calls through it at request
 * time, so replacing a property on the shared CommonJS module object is enough
 * to stand the service in. This is not vi.mock — CONTRIBUTING.md is right that
 * vi.mock cannot intercept a CJS require — it is the same object both files
 * already share.
 */
const doubtSessionService = require('../../services/doubtSessionService');
const controller = require('../../controllers/doubtSolverController');

const ORIGINAL = {
  startSession: doubtSessionService.startSession,
  revealNextHint: doubtSessionService.revealNextHint,
  appendFollowUp: doubtSessionService.appendFollowUp,
};

function makeRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

function taggedError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

describe('doubtSolverController — startSession', () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    Object.assign(doubtSessionService, ORIGINAL);
    vi.restoreAllMocks();
  });

  it('returns 201 with the session id, first hint and ladder size', async () => {
    doubtSessionService.startSession = vi.fn(async () => ({
      session: { id: 'session-9', currentLevel: 0 },
      hint: { level: 1, kind: 'concept', content: 'Start from the second law.' },
      totalHints: 4,
    }));

    await controller.startSession(
      { user: { id: 'student-1' }, body: { question: 'Why?' }, file: undefined },
      res
    );

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      success: true,
      data: {
        sessionId: 'session-9',
        hint: { level: 1, content: 'Start from the second law.' },
        totalHints: 4,
        currentLevel: 0,
      },
    });
  });

  it('does not leak the internal hint kind to the client', async () => {
    doubtSessionService.startSession = vi.fn(async () => ({
      session: { id: 's', currentLevel: 0 },
      hint: { level: 1, kind: 'concept', content: 'x' },
      totalHints: 4,
    }));

    await controller.startSession({ user: { id: 'u' }, body: { question: 'q' } }, res);

    expect(res.body.data.hint).not.toHaveProperty('kind');
  });

  it('passes the uploaded file straight through to the service', async () => {
    const file = { buffer: Buffer.from('img'), mimetype: 'image/png' };
    doubtSessionService.startSession = vi.fn(async () => ({
      session: { id: 's', currentLevel: 0 },
      hint: null,
      totalHints: 4,
    }));

    await controller.startSession(
      { user: { id: 'student-1' }, body: { question: 'q', subject: 'Physics' }, file },
      res
    );

    expect(doubtSessionService.startSession).toHaveBeenCalledWith({
      studentId: 'student-1',
      question: 'q',
      subject: 'Physics',
      image: file,
    });
  });

  it('passes a tagged validation error through with its own status', async () => {
    doubtSessionService.startSession = vi.fn(async () => {
      throw taggedError(400, 'Question text is required.');
    });

    await controller.startSession({ user: { id: 'u' }, body: {} }, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Question text is required.' });
  });

  it('does not echo an untagged failure back to the client', async () => {
    doubtSessionService.startSession = vi.fn(async () => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
    });

    await controller.startSession({ user: { id: 'u' }, body: { question: 'q' } }, res);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Failed to start the doubt session');
    expect(JSON.stringify(res.body)).not.toContain('ECONNREFUSED');
  });
});

describe('doubtSolverController — revealHint', () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    Object.assign(doubtSessionService, ORIGINAL);
    vi.restoreAllMocks();
  });

  it('returns the next hint and the level it left the session at', async () => {
    doubtSessionService.revealNextHint = vi.fn(async () => ({
      session: { currentLevel: 2 },
      hint: { level: 3, kind: 'approach', content: 'Begin with F = ma.' },
      exhausted: false,
      totalHints: 4,
    }));

    await controller.revealHint({ user: { id: 'u' }, params: { id: 'session-1' } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual({
      hint: { level: 3, content: 'Begin with F = ma.' },
      exhausted: false,
      totalHints: 4,
      currentLevel: 2,
    });
    expect(res.body.message).toBeUndefined();
  });

  it('reports exhaustion with a null hint rather than an error', async () => {
    doubtSessionService.revealNextHint = vi.fn(async () => ({
      session: { currentLevel: 3 },
      hint: null,
      exhausted: true,
      totalHints: 4,
    }));

    await controller.revealHint({ user: { id: 'u' }, params: { id: 'session-1' } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('All hints already revealed.');
    expect(res.body.data.hint).toBeNull();
  });

  it('403s a session belonging to someone else', async () => {
    doubtSessionService.revealNextHint = vi.fn(async () => {
      throw taggedError(403, 'Not authorized.');
    });

    await controller.revealHint({ user: { id: 'u' }, params: { id: 'session-1' } }, res);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ success: false, message: 'Not authorized.' });
  });

  it('404s an unknown session', async () => {
    doubtSessionService.revealNextHint = vi.fn(async () => {
      throw taggedError(404, 'Session not found.');
    });

    await controller.revealHint({ user: { id: 'u' }, params: { id: 'nope' } }, res);

    expect(res.statusCode).toBe(404);
  });
});

describe('doubtSolverController — sendMessage', () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    Object.assign(doubtSessionService, ORIGINAL);
    vi.restoreAllMocks();
  });

  it('returns the tutor reply', async () => {
    doubtSessionService.appendFollowUp = vi.fn(async () => ({
      session: { currentLevel: 1 },
      reply: 'Because the surface is frictionless.',
    }));

    await controller.sendMessage(
      { user: { id: 'u' }, params: { id: 'session-1' }, body: { message: 'Why?' } },
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: { reply: 'Because the surface is frictionless.', currentLevel: 1 },
    });
  });

  it('400s an empty message', async () => {
    doubtSessionService.appendFollowUp = vi.fn(async () => {
      throw taggedError(400, 'Message text is required.');
    });

    await controller.sendMessage(
      { user: { id: 'u' }, params: { id: 'session-1' }, body: {} },
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Message text is required.');
  });

  it('forwards the session id and caller to the service', async () => {
    doubtSessionService.appendFollowUp = vi.fn(async () => ({
      session: { currentLevel: 0 },
      reply: 'ok',
    }));

    await controller.sendMessage(
      { user: { id: 'student-7' }, params: { id: 'session-3' }, body: { message: 'hi' } },
      res
    );

    expect(doubtSessionService.appendFollowUp).toHaveBeenCalledWith({
      sessionId: 'session-3',
      studentId: 'student-7',
      message: 'hi',
    });
  });
});

describe('doubtSolverController — solveDoubt', () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('400s when no image was uploaded', async () => {
    await controller.solveDoubt({ body: { text: 'help' }, file: undefined }, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'An image file is required.' });
  });
});
