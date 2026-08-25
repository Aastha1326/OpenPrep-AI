const pyqIntelligenceService = require('../services/pyqIntelligenceService');

/**
 * @route   GET /api/pyq-intelligence/frequency/:subjectId
 * @desc    Get frequency analysis for a subject's PYQ questions
 * @access  Private
 */
exports.getFrequencyAnalysis = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const data = await pyqIntelligenceService.analyzeFrequency(req.user.id, subjectId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in frequency analysis:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to analyze frequency' });
  }
};

/**
 * @route   GET /api/pyq-intelligence/trends/:subjectId
 * @desc    Get trend detection for chapter weightage over time
 * @access  Private
 */
exports.getTrendAnalysis = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const data = await pyqIntelligenceService.detectTrends(req.user.id, subjectId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in trend analysis:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to detect trends' });
  }
};

/**
 * @route   GET /api/pyq-intelligence/repeats/:subjectId
 * @desc    Get repeated/near-duplicate question detection
 * @access  Private
 */
exports.getRepeatDetection = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const data = await pyqIntelligenceService.detectRepeats(req.user.id, subjectId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in repeat detection:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to detect repeats' });
  }
};

/**
 * @route   GET /api/pyq-intelligence/recommendations/:subjectId
 * @desc    Get smart study recommendations based on PYQ intelligence
 * @access  Private
 */
exports.getSmartRecommendations = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const data = await pyqIntelligenceService.generateSmartRecommendations(req.user.id, subjectId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error generating smart recommendations:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate recommendations' });
  }
};

/**
 * @route   GET /api/pyq-intelligence/compare/:subjectId
 * @desc    Compare chapter weightage between two year ranges
 * @access  Private
 */
exports.compareYearRanges = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { range1Start, range1End, range2Start, range2End } = req.query;

    if (!range1Start || !range1End || !range2Start || !range2End) {
      return res.status(400).json({
        success: false,
        message: 'All year range parameters are required: range1Start, range1End, range2Start, range2End',
      });
    }

    const data = await pyqIntelligenceService.compareYearRanges(
      req.user.id,
      subjectId,
      parseInt(range1Start, 10),
      parseInt(range1End, 10),
      parseInt(range2Start, 10),
      parseInt(range2End, 10)
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error comparing year ranges:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to compare year ranges' });
  }
};

/**
 * @route   GET /api/pyq-intelligence/full-intelligence/:subjectId
 * @desc    Get complete intelligence summary (frequency + trends + repeats + recommendations)
 * @access  Private
 */
exports.getFullIntelligence = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const [frequency, trends, repeats, recommendations] = await Promise.all([
      pyqIntelligenceService.analyzeFrequency(req.user.id, subjectId),
      pyqIntelligenceService.detectTrends(req.user.id, subjectId),
      pyqIntelligenceService.detectRepeats(req.user.id, subjectId),
      pyqIntelligenceService.generateSmartRecommendations(req.user.id, subjectId),
    ]);

    res.status(200).json({
      success: true,
      data: { frequency, trends, repeats, recommendations },
    });
  } catch (error) {
    console.error('Error in full intelligence analysis:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to run intelligence analysis' });
  }
};
