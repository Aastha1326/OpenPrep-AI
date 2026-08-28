/**
 * @fileoverview Business logic for the AI Academic Doubt Solver.
 *
 * Two things live here that used to live in the controller:
 *
 * 1. Building the hint ladder. The shipped version used three string literals
 *    - "Hint 1: Identify the core concept.", "Hint 2: Recall relevant
 *    formulas.", "Hint 3: Outline step-by-step approach." - which are the same
 *    for every question anyone has ever asked. Only the fourth level, the full
 *    solution, carried content. A hint that does not mention the problem is
 *    not a hint.
 *
 * 2. Session state transitions, so the controller is left doing HTTP.
 *
 * Collaborators are injected rather than mocked. Per CONTRIBUTING.md, vi.mock
 * does not intercept a CommonJS `require`, so a service that reaches for its
 * own dependencies internally cannot be unit tested without a live database
 * and a live Gemini key.
 */
const DoubtSessionModels = require('../models');
const geminiService = require('./geminiService');
const multimodalDoubtService = require('./multimodalDoubtService');

/** Levels in a ladder: three nudges, then the worked solution. */
const HINT_LADDER_SIZE = 4;

/** What each rung is meant to do, in order. */
const HINT_KINDS = ['concept', 'formula', 'approach', 'solution'];

const MAX_QUESTION_LENGTH = 4000;
const MAX_MESSAGE_LENGTH = 2000;

/** A 400 the controller can pass straight through. */
function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

/** A 404 the controller can pass straight through. */
function notFound(message) {
  const error = new Error(message);
  error.status = 404;
  return error;
}

/** A 403 the controller can pass straight through. */
function forbidden(message) {
  const error = new Error(message);
  error.status = 403;
  return error;
}

/**
 * Split a markdown solution into `{ heading, body }` sections.
 *
 * The solver prompt in multimodalDoubtService asks for three headed sections -
 * Problem Identification, Step-by-Step Solution, Key Concept - but models
 * drift, so this tolerates any heading style (`#`, `**bold**`, `1.`) and
 * returns a single untitled section when it finds none.
 */
function splitSections(solution) {
  const text = String(solution || '').trim();
  if (!text) return [];

  const lines = text.split('\n');
  const sections = [];
  let current = { heading: '', body: [] };

  /**
   * A heading, plus whatever followed it on the same line.
   *
   * The solver prompt produces `3. **Key Concept**: Newton's second law ...`,
   * where the section's entire body sits after the colon. Treating the whole
   * line as a heading and dropping the rest left those sections empty, which
   * silently downgraded the concept hint to a generic one.
   */
  const headingOf = (line) => {
    const trimmed = line.trim();

    const markdownHeading = trimmed.match(/^#{1,6}\s+(.+?)\s*$/);
    if (markdownHeading) {
      return { heading: markdownHeading[1].replace(/\*+/g, '').trim(), rest: '' };
    }

    const inlineHeading = trimmed.match(/^(?:\d+[.)]\s*)?\*\*(.+?)\*\*\s*:?\s*(.*)$/);
    if (inlineHeading) {
      return { heading: inlineHeading[1].trim(), rest: (inlineHeading[2] || '').trim() };
    }

    return null;
  };

  for (const line of lines) {
    const parsed = headingOf(line);
    if (parsed) {
      if (current.heading || current.body.length) sections.push(current);
      current = { heading: parsed.heading, body: parsed.rest ? [parsed.rest] : [] };
    } else {
      current.body.push(line);
    }
  }
  if (current.heading || current.body.length) sections.push(current);

  return sections
    .map((section) => ({ heading: section.heading, body: section.body.join('\n').trim() }))
    .filter((section) => section.heading || section.body);
}

/** The first section whose heading matches any of `needles`. */
function findSection(sections, needles) {
  return (
    sections.find((section) =>
      needles.some((needle) => section.heading.toLowerCase().includes(needle))
    ) || null
  );
}

/**
 * Discrete solution steps, in order.
 *
 * Looks inside the step-by-step section when there is one, and falls back to
 * any numbered or bulleted list in the whole document.
 */
function extractSteps(solution) {
  const sections = splitSections(solution);
  const stepSection = findSection(sections, ['step', 'solution', 'working']);
  const source = stepSection ? stepSection.body : String(solution || '');

  return source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^(?:\d+[.)]|[-*•])\s+/.test(line))
    .map((line) => line.replace(/^(?:\d+[.)]|[-*•])\s+/, '').trim())
    .filter(Boolean);
}

/**
 * Every distinct maths expression in the solution: `$...$`, `$$...$$`, and
 * `\(...\)`. Used to build the formula rung without handing over the numbers
 * it was applied to.
 */
function extractFormulas(solution) {
  const text = String(solution || '');
  const patterns = [/\$\$([^$]+)\$\$/g, /\$([^$\n]+)\$/g, /\\\(([^)]+)\\\)/g];
  const found = [];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const expression = match[1].trim();
      if (expression && !found.includes(expression)) found.push(expression);
    }
  }

  return found;
}

/** Trim to a sentence boundary near `limit` so a hint never ends mid-word. */
function truncateAtSentence(text, limit) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;

  const window = clean.slice(0, limit);
  const lastStop = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '), window.lastIndexOf('! '));
  if (lastStop > limit * 0.5) return window.slice(0, lastStop + 1).trim();

  const lastSpace = window.lastIndexOf(' ');
  return `${(lastSpace > 0 ? window.slice(0, lastSpace) : window).trim()}...`;
}

/**
 * Build a hint ladder out of the solution itself, with no second model call.
 *
 * This is the fallback path, and it is what runs with no API key configured.
 * It is deterministic and it is still about the actual problem: the concept
 * rung quotes the solution's own Key Concept section, the formula rung lists
 * the expressions the solution used, and the approach rung gives the first
 * step and says how many remain.
 */
function deriveHintsFromSolution({ question, solution }) {
  const sections = splitSections(solution);
  const concept = findSection(sections, ['key concept', 'concept', 'topic']);
  const identification = findSection(sections, ['problem identification', 'identification', 'problem']);
  const steps = extractSteps(solution);
  const formulas = extractFormulas(solution);

  const conceptHint = concept?.body
    ? `Start from the underlying idea: ${truncateAtSentence(concept.body, 240)}`
    : identification?.body
      ? `Re-read what is actually being asked: ${truncateAtSentence(identification.body, 240)}`
      : `Read the question once more and name the single concept it is testing before you calculate anything: "${truncateAtSentence(question, 160)}"`;

  const formulaHint = formulas.length
    ? `You will need ${formulas.length === 1 ? 'this relationship' : 'these relationships'}: ${formulas
        .slice(0, 3)
        .map((formula) => `$${formula}$`)
        .join(', ')}. Write ${formulas.length === 1 ? 'it' : 'them'} down before substituting anything.`
    : 'Write down the definitions and relationships that connect what you are given to what you are asked for. Do not substitute numbers yet.';

  const approachHint = steps.length
    ? `Begin here: ${truncateAtSentence(steps[0], 240)}${
        steps.length > 1 ? ` There ${steps.length - 1 === 1 ? 'is one further step' : `are ${steps.length - 1} further steps`} after that.` : ''
      }`
    : 'Work backwards from what the question asks for, and check which given value feeds into it first.';

  return [
    { level: 1, kind: 'concept', content: conceptHint },
    { level: 2, kind: 'formula', content: formulaHint },
    { level: 3, kind: 'approach', content: approachHint },
    { level: 4, kind: 'solution', content: String(solution || '').trim() },
  ];
}

/**
 * Normalise whatever the model returned into a well-formed ladder.
 *
 * Returns null when the shape is unusable, so the caller falls back rather
 * than storing a ladder with holes in it.
 */
function normaliseGeneratedHints(generated, solution) {
  if (!Array.isArray(generated) || generated.length < HINT_LADDER_SIZE - 1) return null;

  const nudges = generated
    .map((hint) => String(hint?.content || hint?.text || '').trim())
    .filter(Boolean)
    .slice(0, HINT_LADDER_SIZE - 1);

  if (nudges.length !== HINT_LADDER_SIZE - 1) return null;

  const ladder = nudges.map((content, index) => ({
    level: index + 1,
    kind: HINT_KINDS[index],
    content,
  }));

  ladder.push({ level: HINT_LADDER_SIZE, kind: 'solution', content: String(solution || '').trim() });
  return ladder;
}

/**
 * The hint ladder for one question.
 *
 * Asks the model for three graded nudges and appends the full solution as the
 * last rung. Any failure - no key, bad JSON, rate limit - falls back to
 * deriving the ladder from the solution text, because a degraded hint is
 * better than a 500 on a feature whose whole point is not showing the answer
 * immediately.
 */
async function buildHintLadder({ question, solution, subject }, deps = {}) {
  const ai = deps.ai || geminiService;

  if (typeof ai.generateSocraticHints === 'function') {
    try {
      const generated = await ai.generateSocraticHints({ question, solution, subject });
      const ladder = normaliseGeneratedHints(generated?.hints, solution);
      if (ladder) return { hints: ladder, isFallback: false };
    } catch (error) {
      // Falling through to the deterministic ladder is the point of this catch.
      console.warn('[DoubtSession] Socratic hint generation failed:', error.message);
    }
  }

  return { hints: deriveHintsFromSolution({ question, solution }), isFallback: true };
}

/**
 * Open a session: solve the problem once, build the ladder, hand back rung 1.
 *
 * The full solution is generated up front and stored, so revealing a later
 * hint is a database read rather than another model call. A student walking
 * the whole ladder costs one AI request, not four.
 */
async function startSession({ studentId, question, subject, image }, deps = {}) {
  const models = deps.models || DoubtSessionModels;
  const solver = deps.solver || multimodalDoubtService;

  const trimmedQuestion = String(question || '').trim();
  if (!trimmedQuestion) throw badRequest('Question text is required.');
  if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
    throw badRequest(`Question must be at most ${MAX_QUESTION_LENGTH} characters.`);
  }

  const imageUrls = [];
  let base64Image = '';
  if (image?.buffer) {
    base64Image = image.buffer.toString('base64');
    imageUrls.push({ url: `data:${image.mimetype};base64,${base64Image}`, mimeType: image.mimetype });
  }

  const solution = await solver.solveDoubt(base64Image, trimmedQuestion);
  const { hints, isFallback } = await buildHintLadder(
    { question: trimmedQuestion, solution, subject },
    deps
  );

  const session = await models.DoubtSession.create({
    studentId,
    question: trimmedQuestion,
    subject: subject || null,
    imageUrls,
    hints,
    currentLevel: 0,
    status: 'active',
    hintsAreFallback: isFallback,
  });

  return { session, hint: hints[0] || null, totalHints: hints.length };
}

/** Load a session and confirm it belongs to the caller. */
async function loadOwnedSession(sessionId, studentId, deps = {}) {
  const models = deps.models || DoubtSessionModels;

  const session = await models.DoubtSession.findByPk(sessionId);
  if (!session) throw notFound('Session not found.');
  if (String(session.studentId) !== String(studentId)) throw forbidden('Not authorized.');

  return session;
}

/**
 * Step one rung down the ladder.
 *
 * Reaching the last rung marks the session solved, which is what makes
 * "how far did this student have to go" answerable later.
 */
async function revealNextHint({ sessionId, studentId }, deps = {}) {
  const session = await loadOwnedSession(sessionId, studentId, deps);
  const ladder = Array.isArray(session.hints) ? session.hints : [];
  const nextLevel = session.currentLevel + 1;

  if (nextLevel >= ladder.length) {
    return { session, hint: null, exhausted: true, totalHints: ladder.length };
  }

  session.currentLevel = nextLevel;
  if (nextLevel === ladder.length - 1) {
    session.status = 'solved';
    session.resolvedAt = new Date();
  }
  await session.save();

  return { session, hint: ladder[nextLevel], exhausted: false, totalHints: ladder.length };
}

/**
 * Answer a follow-up question without spoiling unrevealed rungs.
 *
 * The prompt is built from hints the student has already seen. Feeding it the
 * whole ladder would let "what do you mean?" extract the solution from a
 * session still sitting on hint 1.
 */
async function appendFollowUp({ sessionId, studentId, message }, deps = {}) {
  const models = deps.models || DoubtSessionModels;
  const solver = deps.solver || multimodalDoubtService;

  const trimmedMessage = String(message || '').trim();
  if (!trimmedMessage) throw badRequest('Message text is required.');
  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    throw badRequest(`Message must be at most ${MAX_MESSAGE_LENGTH} characters.`);
  }

  const session = await loadOwnedSession(sessionId, studentId, deps);
  const ladder = Array.isArray(session.hints) ? session.hints : [];

  const revealed = ladder
    .slice(0, session.currentLevel + 1)
    .map((hint) => `Hint ${hint.level}: ${hint.content}`)
    .join('\n');

  const history = await models.DoubtSessionMessage.findAll({
    where: { sessionId: session.id },
    order: [['createdAt', 'ASC']],
    limit: 20,
  });

  const transcript = history
    .map((entry) => `${entry.role === 'student' ? 'Student' : 'Tutor'}: ${entry.content}`)
    .join('\n');

  const prompt = [
    `Question: ${session.question}`,
    revealed ? `Hints already given:\n${revealed}` : null,
    transcript ? `Conversation so far:\n${transcript}` : null,
    `Student follow-up: ${trimmedMessage}`,
    'Answer the follow-up without revealing any step beyond the hints already given.',
  ]
    .filter(Boolean)
    .join('\n\n');

  const reply = await solver.solveDoubt('', prompt);

  await models.DoubtSessionMessage.create({
    sessionId: session.id,
    role: 'student',
    content: trimmedMessage,
    hintLevelAtSend: session.currentLevel,
  });
  await models.DoubtSessionMessage.create({
    sessionId: session.id,
    role: 'tutor',
    content: String(reply || '').trim(),
    hintLevelAtSend: session.currentLevel,
  });

  return { session, reply };
}

module.exports = {
  HINT_LADDER_SIZE,
  HINT_KINDS,
  MAX_QUESTION_LENGTH,
  MAX_MESSAGE_LENGTH,
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
};
