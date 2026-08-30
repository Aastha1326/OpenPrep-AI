const adaptiveTestingService = require('../services/adaptiveTestingService');

// @desc    Start a Computer Adaptive Testing (CAT) exam session
// @route   POST /api/adaptive-exams/start
// @access  Private
exports.startAdaptiveExam = async (req, res, next) => {
  try {
    const { subjectId, totalQuestions } = req.body;
    const session = adaptiveTestingService.startSession(
      req.user.id,
      subjectId || 'general',
      totalQuestions || 10
    );

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit an answer and get next adaptive question / score update
// @route   POST /api/adaptive-exams/:sessionId/submit-answer
// @access  Private
exports.submitAdaptiveAnswer = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { questionId, selectedOptionIndex, timeSpentSeconds } = req.body;

    if (selectedOptionIndex === undefined || selectedOptionIndex === null) {
      return res.status(400).json({ success: false, error: 'selectedOptionIndex is required.' });
    }

    const result = adaptiveTestingService.submitAnswer(
      sessionId,
      questionId,
      selectedOptionIndex,
      timeSpentSeconds || 30
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('completed')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Get post-exam diagnostic score report & percentile ranking
// @route   GET /api/adaptive-exams/:sessionId/score-report
// @access  Private
exports.getAdaptiveScoreReport = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const report = adaptiveTestingService.getScoreReport(sessionId);

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
};
