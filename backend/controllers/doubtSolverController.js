/**
 * @fileoverview HTTP layer for the AI Academic Doubt Solver.
 *
 * Session state and hint generation live in services/doubtSessionService.js;
 * everything here is request parsing and status codes.
 */
const doubtService = require('../services/multimodalDoubtService');
const doubtSessionService = require('../services/doubtSessionService');

/**
 * Map a service error onto a response.
 *
 * The service tags the errors a client caused with a `status`. Anything
 * untagged is ours, and is logged rather than echoed back.
 */
function respondWithError(res, error, fallbackMessage) {
  if (error?.status) {
    return res.status(error.status).json({ success: false, message: error.message });
  }

  console.error(`${fallbackMessage}:`, error);
  return res.status(500).json({ success: false, message: fallbackMessage });
}

/** Shape a hint for the client, hiding the internal `kind` tag. */
function serializeHint(hint) {
  if (!hint) return null;
  return { level: hint.level, content: hint.content };
}

/**
 * Processes an uploaded image and text to generate a one-shot solution.
 *
 * @route POST /api/doubt-solver/solve
 */
const solveDoubt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'An image file is required.' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const solution = await doubtService.solveDoubt(base64Image, req.body.text);

    return res.status(200).json({ success: true, data: { solution } });
  } catch (error) {
    return respondWithError(res, error, 'Failed to process the doubt');
  }
};

/**
 * Start a doubt session and hand back the first hint.
 *
 * @route POST /api/doubts/start
 */
async function startSession(req, res) {
  try {
    const { session, hint, totalHints } = await doubtSessionService.startSession({
      studentId: req.user.id,
      question: req.body.question,
      subject: req.body.subject,
      image: req.file,
    });

    return res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        hint: serializeHint(hint),
        totalHints,
        currentLevel: session.currentLevel,
      },
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to start the doubt session');
  }
}

/**
 * Reveal the next rung of the hint ladder.
 *
 * @route POST /api/doubts/:id/reveal-step
 */
async function revealHint(req, res) {
  try {
    const { session, hint, exhausted, totalHints } = await doubtSessionService.revealNextHint({
      sessionId: req.params.id,
      studentId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: exhausted ? 'All hints already revealed.' : undefined,
      data: {
        hint: serializeHint(hint),
        exhausted,
        totalHints,
        currentLevel: session.currentLevel,
      },
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to reveal the next hint');
  }
}

/**
 * Answer a follow-up question inside an existing session.
 *
 * @route POST /api/doubts/:id/message
 */
async function sendMessage(req, res) {
  try {
    const { session, reply } = await doubtSessionService.appendFollowUp({
      sessionId: req.params.id,
      studentId: req.user.id,
      message: req.body.message,
    });

    return res.status(200).json({
      success: true,
      data: { reply, currentLevel: session.currentLevel },
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to send the message');
  }
}

module.exports = { solveDoubt, startSession, revealHint, sendMessage };
