import { describe, it, expect, vi, beforeEach } from 'vitest';

const doubtSessionService = require('../../services/doubtSessionService');

const {
  splitSections,
  extractSteps,
  extractFormulas,
  truncateAtSentence,
  deriveHintsFromSolution,
  normaliseGeneratedHints,
  buildHintLadder,
  startSession,
  loadOwnedSession,
  revealNextHint,
  appendFollowUp,
  HINT_LADDER_SIZE,
  MAX_QUESTION_LENGTH,
  MAX_MESSAGE_LENGTH,
} = doubtSessionService;

/**
 * A worked solution in the shape multimodalDoubtService asks the model for.
 * The hint ladder is derived from this text, so the fixture has to look like
 * a real answer rather than a placeholder.
 */
const SOLUTION = [
  '1. **Problem Identification**: The question asks for the acceleration of a 2 kg block pushed by a 10 N force across a frictionless surface.',
  '',
  '2. **Step-by-Step Solution**:',
  '- Write down the second law: $F = ma$',
  '- Rearrange for acceleration: $a = F/m$',
  '- Substitute the given values: $a = 10/2$',
  '- The block accelerates at 5 m/s².',
  '',
  '3. **Key Concept**: Newton\'s second law relates net force, mass and acceleration. With no friction the applied force is the net force.',
].join('\n');

const QUESTION = 'A 10 N force pushes a 2 kg block across a frictionless surface. What is its acceleration?';

/**
 * Collaborators are passed in rather than mocked. CONTRIBUTING.md is explicit
 * that vi.mock does not intercept a CommonJS require, so a service reaching
 * for its own models would hit a live Postgres here.
 */
function makeModels(overrides = {}) {
  const created = [];
  const messages = [];

  return {
    created,
    messages,
    DoubtSession: {
      create: vi.fn(async (values) => {
        const record = {
          ...values,
          id: `session-${created.length + 1}`,
          save: vi.fn(async () => record),
        };
        created.push(record);
        return record;
      }),
      findByPk: vi.fn(async () => null),
      ...overrides.DoubtSession,
    },
    DoubtSessionMessage: {
      create: vi.fn(async (values) => {
        messages.push(values);
        return values;
      }),
      findAll: vi.fn(async () => []),
      ...overrides.DoubtSessionMessage,
    },
  };
}

function makeSessionRecord(overrides = {}) {
  const record = {
    id: 'session-1',
    studentId: 'student-1',
    question: QUESTION,
    hints: deriveHintsFromSolution({ question: QUESTION, solution: SOLUTION }),
    currentLevel: 0,
    status: 'active',
    resolvedAt: null,
    ...overrides,
  };
  record.save = vi.fn(async () => record);
  return record;
}

describe('doubtSessionService — markdown parsing', () => {
  it('splits a solution into its headed sections', () => {
    const sections = splitSections(SOLUTION);
    const headings = sections.map((section) => section.heading);

    expect(headings).toContain('Problem Identification');
    expect(headings).toContain('Step-by-Step Solution');
    expect(headings).toContain('Key Concept');
  });

  it('tolerates a solution with hash headings', () => {
    const sections = splitSections('# Setup\nfirst\n## Working\nsecond');

    expect(sections.map((section) => section.heading)).toEqual(['Setup', 'Working']);
    expect(sections[1].body).toBe('second');
  });

  it('returns a single untitled section when there are no headings', () => {
    const sections = splitSections('Just a paragraph of prose with no structure at all.');

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe('');
    expect(sections[0].body).toContain('no structure');
  });

  it('returns nothing for an empty solution', () => {
    expect(splitSections('')).toEqual([]);
    expect(splitSections(null)).toEqual([]);
    expect(splitSections(undefined)).toEqual([]);
  });

  it('pulls the ordered steps out of the step-by-step section', () => {
    const steps = extractSteps(SOLUTION);

    expect(steps[0]).toContain('second law');
    expect(steps).toHaveLength(4);
    expect(steps.every((step) => !step.startsWith('-'))).toBe(true);
  });

  it('falls back to any list when there is no step section', () => {
    const steps = extractSteps('Some prose\n1. first thing\n2. second thing');

    expect(steps).toEqual(['first thing', 'second thing']);
  });

  it('collects each distinct formula once, in order', () => {
    const formulas = extractFormulas(SOLUTION);

    expect(formulas).toContain('F = ma');
    expect(formulas).toContain('a = F/m');
    expect(new Set(formulas).size).toBe(formulas.length);
  });

  it('reads display maths and escaped-paren maths too', () => {
    const formulas = extractFormulas('Use $$E = mc^2$$ and \\(v = u + at\\) together.');

    expect(formulas).toEqual(['E = mc^2', 'v = u + at']);
  });

  it('returns no formulas for prose', () => {
    expect(extractFormulas('There is no maths in this sentence.')).toEqual([]);
  });
});

describe('doubtSessionService — truncateAtSentence', () => {
  it('leaves short text alone', () => {
    expect(truncateAtSentence('Short enough.', 100)).toBe('Short enough.');
  });

  it('cuts at a sentence boundary when there is one', () => {
    const result = truncateAtSentence('First sentence here. Second sentence runs on and on and on.', 30);

    expect(result).toBe('First sentence here.');
  });

  it('falls back to a word boundary with an ellipsis', () => {
    const result = truncateAtSentence('aaaa bbbb cccc dddd eeee ffff gggg', 20);

    expect(result.endsWith('...')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(23);
  });

  it('collapses whitespace', () => {
    expect(truncateAtSentence('a  \n  b', 100)).toBe('a b');
  });
});

describe('doubtSessionService — deriveHintsFromSolution', () => {
  const hints = deriveHintsFromSolution({ question: QUESTION, solution: SOLUTION });

  it('builds a full ladder', () => {
    expect(hints).toHaveLength(HINT_LADDER_SIZE);
    expect(hints.map((hint) => hint.level)).toEqual([1, 2, 3, 4]);
    expect(hints.map((hint) => hint.kind)).toEqual(['concept', 'formula', 'approach', 'solution']);
  });

  it('does not emit the placeholder strings the feature shipped with', () => {
    // The whole point of the fix: these three literals were the entire
    // "progressive Socratic hint" ladder for every question ever asked.
    const shipped = [
      'Hint 1: Identify the core concept.',
      'Hint 2: Recall relevant formulas.',
      'Hint 3: Outline step‑by‑step approach.',
    ];

    for (const hint of hints) {
      expect(shipped).not.toContain(hint.content);
    }
  });

  it('grounds the concept hint in this problem', () => {
    expect(hints[0].content.toLowerCase()).toContain('second law');
  });

  it('names the formulas without substituting the values', () => {
    expect(hints[1].content).toContain('F = ma');
    expect(hints[1].content).not.toContain('5 m/s');
  });

  it('gives the first step and counts what is left', () => {
    expect(hints[2].content).toContain('second law');
    expect(hints[2].content).toContain('3 further steps');
  });

  it('withholds the answer until the final rung', () => {
    expect(hints[0].content).not.toContain('5 m/s²');
    expect(hints[1].content).not.toContain('5 m/s²');
    expect(hints[2].content).not.toContain('5 m/s²');
    expect(hints[3].content).toContain('5 m/s²');
  });

  it('still produces a ladder for a solution with no structure', () => {
    const bare = deriveHintsFromSolution({ question: QUESTION, solution: 'The answer is 5.' });

    expect(bare).toHaveLength(HINT_LADDER_SIZE);
    expect(bare.every((hint) => hint.content.trim().length > 0)).toBe(true);
    // With nothing to quote, the concept hint falls back to the question.
    expect(bare[0].content).toContain('frictionless');
  });

  it('singularises the step count when only one step remains', () => {
    const single = deriveHintsFromSolution({
      question: QUESTION,
      solution: '2. **Step-by-Step Solution**:\n- do the one thing\n- then the other',
    });

    expect(single[2].content).toContain('one further step');
  });
});

describe('doubtSessionService — normaliseGeneratedHints', () => {
  it('accepts three nudges and appends the solution', () => {
    const ladder = normaliseGeneratedHints(
      [{ content: 'one' }, { content: 'two' }, { content: 'three' }],
      SOLUTION
    );

    expect(ladder).toHaveLength(4);
    expect(ladder[3].kind).toBe('solution');
    expect(ladder[3].content).toBe(SOLUTION.trim());
  });

  it('accepts `text` as well as `content`', () => {
    const ladder = normaliseGeneratedHints([{ text: 'a' }, { text: 'b' }, { text: 'c' }], 'sol');

    expect(ladder.slice(0, 3).map((hint) => hint.content)).toEqual(['a', 'b', 'c']);
  });

  it('rejects a short ladder rather than storing one with holes', () => {
    expect(normaliseGeneratedHints([{ content: 'one' }], SOLUTION)).toBeNull();
    expect(normaliseGeneratedHints([], SOLUTION)).toBeNull();
    expect(normaliseGeneratedHints(null, SOLUTION)).toBeNull();
  });

  it('rejects a ladder whose entries are blank', () => {
    expect(normaliseGeneratedHints([{ content: '  ' }, { content: '' }, { content: 'c' }], 'sol')).toBeNull();
  });

  it('ignores extra rungs beyond the first three', () => {
    const ladder = normaliseGeneratedHints(
      [{ content: 'a' }, { content: 'b' }, { content: 'c' }, { content: 'd' }],
      'sol'
    );

    expect(ladder).toHaveLength(4);
    expect(ladder[2].content).toBe('c');
  });
});

describe('doubtSessionService — buildHintLadder', () => {
  it('uses the model when it returns a usable ladder', async () => {
    const ai = {
      generateSocraticHints: vi.fn(async () => ({
        hints: [{ content: 'concept nudge' }, { content: 'formula nudge' }, { content: 'approach nudge' }],
      })),
    };

    const { hints, isFallback } = await buildHintLadder({ question: QUESTION, solution: SOLUTION }, { ai });

    expect(ai.generateSocraticHints).toHaveBeenCalledOnce();
    expect(isFallback).toBe(false);
    expect(hints[0].content).toBe('concept nudge');
    expect(hints[3].content).toBe(SOLUTION.trim());
  });

  it('falls back to the derived ladder when the model throws', async () => {
    const ai = {
      generateSocraticHints: vi.fn(async () => {
        throw new Error('Gemini API key not configured for Socratic hint generation');
      }),
    };

    const { hints, isFallback } = await buildHintLadder({ question: QUESTION, solution: SOLUTION }, { ai });

    expect(isFallback).toBe(true);
    expect(hints).toHaveLength(HINT_LADDER_SIZE);
    expect(hints[0].content).toContain('second law');
  });

  it('falls back when the model returns a malformed ladder', async () => {
    const ai = { generateSocraticHints: vi.fn(async () => ({ hints: [{ content: 'only one' }] })) };

    const { isFallback } = await buildHintLadder({ question: QUESTION, solution: SOLUTION }, { ai });

    expect(isFallback).toBe(true);
  });

  it('falls back when the collaborator has no generator at all', async () => {
    const { isFallback, hints } = await buildHintLadder({ question: QUESTION, solution: SOLUTION }, { ai: {} });

    expect(isFallback).toBe(true);
    expect(hints).toHaveLength(HINT_LADDER_SIZE);
  });
});

describe('doubtSessionService — startSession', () => {
  let models;
  let solver;
  let ai;

  beforeEach(() => {
    models = makeModels();
    solver = { solveDoubt: vi.fn(async () => SOLUTION) };
    ai = { generateSocraticHints: vi.fn(async () => { throw new Error('no key'); }) };
  });

  it('solves once, stores the ladder, and returns the first hint', async () => {
    const { session, hint, totalHints } = await startSession(
      { studentId: 'student-1', question: QUESTION },
      { models, solver, ai }
    );

    expect(solver.solveDoubt).toHaveBeenCalledOnce();
    expect(totalHints).toBe(HINT_LADDER_SIZE);
    expect(hint.level).toBe(1);
    expect(session.currentLevel).toBe(0);
    expect(session.hints).toHaveLength(HINT_LADDER_SIZE);
  });

  it('generates every rung up front so revealing one costs no AI call', async () => {
    await startSession({ studentId: 'student-1', question: QUESTION }, { models, solver, ai });

    // One solve for the worked answer, one hint attempt. Not one per rung.
    expect(solver.solveDoubt).toHaveBeenCalledTimes(1);
    expect(models.created[0].hints.every((rung) => rung.content.trim())).toBe(true);
  });

  it('records that the ladder came from the fallback path', async () => {
    await startSession({ studentId: 'student-1', question: QUESTION }, { models, solver, ai });

    expect(models.created[0].hintsAreFallback).toBe(true);
  });

  it('stores an uploaded image as a data URI with its real mime type', async () => {
    const image = { buffer: Buffer.from('binary-image-bytes'), mimetype: 'image/png' };

    await startSession({ studentId: 'student-1', question: QUESTION, image }, { models, solver, ai });

    const [stored] = models.created[0].imageUrls;
    expect(stored.mimeType).toBe('image/png');
    expect(stored.url.startsWith('data:image/png;base64,')).toBe(true);
    expect(solver.solveDoubt).toHaveBeenCalledWith(image.buffer.toString('base64'), QUESTION);
  });

  it('starts with no images when none was uploaded', async () => {
    await startSession({ studentId: 'student-1', question: QUESTION }, { models, solver, ai });

    expect(models.created[0].imageUrls).toEqual([]);
    expect(solver.solveDoubt).toHaveBeenCalledWith('', QUESTION);
  });

  it('rejects an empty question with a 400', async () => {
    await expect(
      startSession({ studentId: 'student-1', question: '   ' }, { models, solver, ai })
    ).rejects.toMatchObject({ status: 400, message: 'Question text is required.' });

    expect(solver.solveDoubt).not.toHaveBeenCalled();
  });

  it('rejects an oversized question with a 400', async () => {
    await expect(
      startSession(
        { studentId: 'student-1', question: 'x'.repeat(MAX_QUESTION_LENGTH + 1) },
        { models, solver, ai }
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  it('trims the stored question', async () => {
    await startSession({ studentId: 'student-1', question: `  ${QUESTION}  ` }, { models, solver, ai });

    expect(models.created[0].question).toBe(QUESTION);
  });
});

describe('doubtSessionService — loadOwnedSession', () => {
  it('returns the session for its owner', async () => {
    const record = makeSessionRecord();
    const models = makeModels({ DoubtSession: { findByPk: vi.fn(async () => record) } });

    await expect(loadOwnedSession('session-1', 'student-1', { models })).resolves.toBe(record);
  });

  it('404s an unknown session', async () => {
    const models = makeModels({ DoubtSession: { findByPk: vi.fn(async () => null) } });

    await expect(loadOwnedSession('nope', 'student-1', { models })).rejects.toMatchObject({
      status: 404,
    });
  });

  it('403s another student’s session', async () => {
    const record = makeSessionRecord({ studentId: 'someone-else' });
    const models = makeModels({ DoubtSession: { findByPk: vi.fn(async () => record) } });

    await expect(loadOwnedSession('session-1', 'student-1', { models })).rejects.toMatchObject({
      status: 403,
    });
  });

  it('compares ids as strings so a numeric id still matches', async () => {
    const record = makeSessionRecord({ studentId: 7 });
    const models = makeModels({ DoubtSession: { findByPk: vi.fn(async () => record) } });

    await expect(loadOwnedSession('session-1', '7', { models })).resolves.toBe(record);
  });
});

describe('doubtSessionService — revealNextHint', () => {
  it('walks one rung down and persists the level', async () => {
    const record = makeSessionRecord();
    const models = makeModels({ DoubtSession: { findByPk: vi.fn(async () => record) } });

    const { hint, exhausted, totalHints } = await revealNextHint(
      { sessionId: 'session-1', studentId: 'student-1' },
      { models }
    );

    expect(hint.level).toBe(2);
    expect(exhausted).toBe(false);
    expect(totalHints).toBe(HINT_LADDER_SIZE);
    expect(record.currentLevel).toBe(1);
    expect(record.save).toHaveBeenCalledOnce();
  });

  it('marks the session solved on the final rung', async () => {
    const record = makeSessionRecord({ currentLevel: 2 });
    const models = makeModels({ DoubtSession: { findByPk: vi.fn(async () => record) } });

    const { hint } = await revealNextHint({ sessionId: 'session-1', studentId: 'student-1' }, { models });

    expect(hint.kind).toBe('solution');
    expect(record.status).toBe('solved');
    expect(record.resolvedAt).toBeInstanceOf(Date);
  });

  it('reports exhaustion without writing once the ladder is spent', async () => {
    const record = makeSessionRecord({ currentLevel: 3, status: 'solved' });
    const models = makeModels({ DoubtSession: { findByPk: vi.fn(async () => record) } });

    const { hint, exhausted } = await revealNextHint(
      { sessionId: 'session-1', studentId: 'student-1' },
      { models }
    );

    expect(hint).toBeNull();
    expect(exhausted).toBe(true);
    expect(record.save).not.toHaveBeenCalled();
  });

  it('does not let one student walk another student’s ladder', async () => {
    const record = makeSessionRecord({ studentId: 'someone-else' });
    const models = makeModels({ DoubtSession: { findByPk: vi.fn(async () => record) } });

    await expect(
      revealNextHint({ sessionId: 'session-1', studentId: 'student-1' }, { models })
    ).rejects.toMatchObject({ status: 403 });

    expect(record.save).not.toHaveBeenCalled();
  });
});

describe('doubtSessionService — appendFollowUp', () => {
  let record;
  let models;
  let solver;

  beforeEach(() => {
    record = makeSessionRecord({ currentLevel: 1 });
    models = makeModels({ DoubtSession: { findByPk: vi.fn(async () => record) } });
    solver = { solveDoubt: vi.fn(async () => 'Think about what stays constant.') };
  });

  it('stores the student turn and the tutor turn separately', async () => {
    const { reply } = await appendFollowUp(
      { sessionId: 'session-1', studentId: 'student-1', message: 'Why is friction ignored?' },
      { models, solver }
    );

    expect(reply).toBe('Think about what stays constant.');
    expect(models.messages).toHaveLength(2);
    expect(models.messages[0]).toMatchObject({ role: 'student', content: 'Why is friction ignored?' });
    expect(models.messages[1]).toMatchObject({ role: 'tutor' });
  });

  it('leaves the hint ladder untouched', async () => {
    // The shipped version pushed the exchange onto session.hints, so the next
    // "reveal hint" press replayed the student's own message back at them.
    const before = record.hints.length;

    await appendFollowUp(
      { sessionId: 'session-1', studentId: 'student-1', message: 'Why?' },
      { models, solver }
    );

    expect(record.hints).toHaveLength(before);
    expect(record.save).not.toHaveBeenCalled();
  });

  it('records the hint level the question was asked at', async () => {
    await appendFollowUp(
      { sessionId: 'session-1', studentId: 'student-1', message: 'Why?' },
      { models, solver }
    );

    expect(models.messages[0].hintLevelAtSend).toBe(1);
  });

  it('never shows the model a rung the student has not reached', async () => {
    await appendFollowUp(
      { sessionId: 'session-1', studentId: 'student-1', message: 'Just tell me the answer.' },
      { models, solver }
    );

    const [, prompt] = solver.solveDoubt.mock.calls[0];
    expect(prompt).toContain('Hint 1');
    expect(prompt).toContain('Hint 2');
    expect(prompt).not.toContain('Hint 4');
    expect(prompt).not.toContain('5 m/s²');
  });

  it('replays earlier conversation turns into the prompt', async () => {
    models.DoubtSessionMessage.findAll = vi.fn(async () => [
      { role: 'student', content: 'Is mass relevant?' },
      { role: 'tutor', content: 'It is - keep going.' },
    ]);

    await appendFollowUp(
      { sessionId: 'session-1', studentId: 'student-1', message: 'How?' },
      { models, solver }
    );

    const [, prompt] = solver.solveDoubt.mock.calls[0];
    expect(prompt).toContain('Student: Is mass relevant?');
    expect(prompt).toContain('Tutor: It is - keep going.');
  });

  it('rejects an empty message with a 400', async () => {
    await expect(
      appendFollowUp({ sessionId: 'session-1', studentId: 'student-1', message: '  ' }, { models, solver })
    ).rejects.toMatchObject({ status: 400 });

    expect(solver.solveDoubt).not.toHaveBeenCalled();
  });

  it('rejects an oversized message with a 400', async () => {
    await expect(
      appendFollowUp(
        { sessionId: 'session-1', studentId: 'student-1', message: 'x'.repeat(MAX_MESSAGE_LENGTH + 1) },
        { models, solver }
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  it('does not answer a follow-up on another student’s session', async () => {
    record.studentId = 'someone-else';

    await expect(
      appendFollowUp({ sessionId: 'session-1', studentId: 'student-1', message: 'Hi' }, { models, solver })
    ).rejects.toMatchObject({ status: 403 });

    expect(models.messages).toHaveLength(0);
  });
});
