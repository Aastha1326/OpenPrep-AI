const codeReviewService = require('../services/codeReviewService');
const plagiarismService = require('../services/plagiarismService');
const astAnalysisService = require('../services/astAnalysisService');
const CodeSubmission = require('../models/CodeSubmission');

/**
 * @desc    Analyze code quality, complexity and generate review
 * @route   POST /api/code-analysis/review
 * @access  Private
 */
exports.analyzeCodeReview = async (req, res) => {
  try {
    const { code, language = 'javascript', problemId, problemTitle } = req.body;
    if (!code) return res.status(400).json({ message: 'Source code is required' });

    const review = await codeReviewService.reviewCode(code, language, problemTitle);
    const tokens = astAnalysisService.abstractTokens(code, language);
    const fingerprint = plagiarismService.generateFingerprint(tokens);

    // Save submission if problemId provided
    let submissionId = null;
    if (problemId) {
      const sub = await CodeSubmission.create({
        userId: req.user.id,
        problemId,
        language,
        code,
        tokenFingerprint: fingerprint,
        cyclomaticComplexity: review.metrics.cyclomaticComplexity,
        halsteadVolume: review.metrics.halsteadVolume,
        reviewReport: review,
      });
      submissionId = sub.id;
    }

    return res.json({
      success: true,
      data: {
        submissionId,
        ...review,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Compare code originality against past submissions for a problem
 * @route   POST /api/code-analysis/check-similarity
 * @access  Private
 */
exports.checkCodeSimilarity = async (req, res) => {
  try {
    const { code, problemId } = req.body;
    if (!code || !problemId) {
      return res.status(400).json({ message: 'Code and problemId are required' });
    }

    const previousSubmissions = await CodeSubmission.findAll({
      where: { problemId },
      attributes: ['id', 'userId', 'tokenFingerprint'],
      limit: 100,
    });

    const result = plagiarismService.compareAgainstCorpus(code, previousSubmissions);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
