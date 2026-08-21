const geminiService = require('../services/geminiService');
const { GeminiRateLimitError, GeminiServerError } = require('../services/geminiService');

// @desc    Generate AI hint / step-by-step explanation for a quiz question
// @route   POST /api/ai/explain-question
// @access  Private
exports.explainQuestion = async (req, res, next) => {
  try {
    const {
      question,
      options,
      correctAnswer,
      userAnswer,
      explanation,
      mode,
      subjectName,
      topicName,
    } = req.body;

    const explanationData = await geminiService.generateQuestionExplanation({
      question,
      options,
      correctAnswer,
      userAnswer: userAnswer ?? null,
      explanation: explanation || '',
      mode: mode || 'full',
      subjectName: subjectName || '',
      topicName: topicName || '',
      forceRefresh: req.query.refresh === 'true',
    });

    res.status(200).json({ success: true, data: explanationData });
  } catch (error) {
    // Handle Gemini API rate limit errors
    if (error instanceof GeminiRateLimitError) {
      return res.status(429).json({
        success: false,
        error: error.message,
        retryAfter: error.retryAfter,
      });
    }
    // Handle Gemini API server errors
    if (error instanceof GeminiServerError) {
      return res.status(503).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

// @desc    Interact with the AI study assistant (chat)
// @route   POST /api/ai/chat
// @access  Private
exports.chatWithAssistant = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message content is required.' });
    }

    const responseText = await geminiService.generateChatResponse({
      message,
      history: history || [],
    });

    res.status(200).json({ success: true, text: responseText });
  } catch (error) {
    if (error instanceof GeminiRateLimitError) {
      return res.status(429).json({
        success: false,
        error: error.message,
        retryAfter: error.retryAfter,
      });
    }
    if (error instanceof GeminiServerError) {
      return res.status(503).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

// @desc    Solve uploaded math/physics formula or diagram image via Gemini Multimodal Vision
// @route   POST /api/ai/solve-image
// @access  Private
exports.solveImageQuestion = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'Please upload an image file of the equation or diagram.' });
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, error: 'Invalid file format. Only JPEG, PNG, and WebP images are supported.' });
    }

    const { prompt } = req.body;
    const solution = await geminiService.solveImageQuestion(req.file.buffer, req.file.mimetype, prompt || '');

    res.status(200).json({
      success: true,
      data: solution,
    });
  } catch (error) {
    if (error instanceof GeminiRateLimitError) {
      return res.status(429).json({
        success: false,
        error: error.message,
        retryAfter: error.retryAfter,
      });
    }
    if (error instanceof GeminiServerError) {
      return res.status(503).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

