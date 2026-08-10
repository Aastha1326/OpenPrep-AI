const { v4: uuidv4 } = require('uuid');
const { validateSubmitQuizAttempt } = require('../../middleware/validators');

const VALID_UUID = uuidv4();

function runValidators(validators, body) {
  return new Promise((resolve) => {
    const req = { body };
    const res = {
      code: null,
      data: null,
      status(c) { this.code = c; return this; },
      json(d) { this.data = d; },
    };

    let idx = 0;
    function next() {
      if (idx >= validators.length || res.code !== null) {
        resolve(res);
        return;
      }
      validators[idx++](req, res, next);
    }

    next();

    setTimeout(() => resolve(res), 1000);
  });
}

const validBody = {
  answers: [{ questionId: VALID_UUID, selectedAnswer: 0 }],
};

describe('validateSubmitQuizAttempt - selectedAnswer', () => {
  it('should pass with selectedAnswer at min (0)', async () => {
    const res = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      answers: [{ questionId: VALID_UUID, selectedAnswer: 0 }],
    });
    expect(res.code).toBeNull();
  });

  it('should pass with selectedAnswer at max (3)', async () => {
    const res = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      answers: [{ questionId: VALID_UUID, selectedAnswer: 3 }],
    });
    expect(res.code).toBeNull();
  });

  it('should pass with selectedAnswer in valid range (1, 2)', async () => {
    const res1 = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      answers: [{ questionId: VALID_UUID, selectedAnswer: 1 }],
    });
    expect(res1.code).toBeNull();

    const res2 = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      answers: [{ questionId: VALID_UUID, selectedAnswer: 2 }],
    });
    expect(res2.code).toBeNull();
  });

  it('should reject selectedAnswer below 0', async () => {
    const res = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      answers: [{ questionId: VALID_UUID, selectedAnswer: -1 }],
    });
    expect(res.code).toBe(400);
    expect(res.data.error).toContain('selectedAnswer');
  });

  it('should reject selectedAnswer above 3', async () => {
    const res = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      answers: [{ questionId: VALID_UUID, selectedAnswer: 4 }],
    });
    expect(res.code).toBe(400);
    expect(res.data.error).toContain('selectedAnswer');
  });

  it('should reject non-integer selectedAnswer', async () => {
    const res = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      answers: [{ questionId: VALID_UUID, selectedAnswer: 'A' }],
    });
    expect(res.code).toBe(400);
    expect(res.data.error).toContain('selectedAnswer');
  });

  it('should reject float selectedAnswer', async () => {
    const res = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      answers: [{ questionId: VALID_UUID, selectedAnswer: 1.5 }],
    });
    expect(res.code).toBe(400);
    expect(res.data.error).toContain('selectedAnswer');
  });

  it('should reject null selectedAnswer', async () => {
    const res = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      answers: [{ questionId: VALID_UUID, selectedAnswer: null }],
    });
    expect(res.code).toBe(400);
    expect(res.data.error).toContain('selectedAnswer');
  });

  it('should reject missing selectedAnswer', async () => {
    const res = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      answers: [{ questionId: VALID_UUID }],
    });
    expect(res.code).toBe(400);
    expect(res.data.error).toContain('selectedAnswer');
  });
});

describe('validateSubmitQuizAttempt - timeSpent', () => {
  it('should pass with valid timeSpent', async () => {
    const res = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      timeSpent: 120,
    });
    expect(res.code).toBeNull();
  });

  it('should pass without timeSpent (optional)', async () => {
    const res = await runValidators(validateSubmitQuizAttempt, validBody);
    expect(res.code).toBeNull();
  });

  it('should pass with timeSpent of 0', async () => {
    const res = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      timeSpent: 0,
    });
    expect(res.code).toBeNull();
  });

  it('should pass with timeSpent at max (86400)', async () => {
    const res = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      timeSpent: 86400,
    });
    expect(res.code).toBeNull();
  });

  it('should reject negative timeSpent', async () => {
    const res = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      timeSpent: -10,
    });
    expect(res.code).toBe(400);
    expect(res.data.error).toContain('timeSpent');
  });

  it('should reject timeSpent exceeding 86400', async () => {
    const res = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      timeSpent: 999999,
    });
    expect(res.code).toBe(400);
    expect(res.data.error).toContain('timeSpent');
  });

  it('should reject non-numeric timeSpent', async () => {
    const res = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      timeSpent: 'abc',
    });
    expect(res.code).toBe(400);
    expect(res.data.error).toContain('timeSpent');
  });

  it('should reject null timeSpent', async () => {
    const res = await runValidators(validateSubmitQuizAttempt, {
      ...validBody,
      timeSpent: null,
    });
    expect(res.code).toBe(400);
    expect(res.data.error).toContain('timeSpent');
  });
});
