const retentionService = require('../services/retentionService');

/**
 * @desc    Get Ebbinghaus retention curves and memory decay forecasts
 * @route   GET /api/analytics/retention
 * @access  Private
 */
exports.getRetentionForecast = async (req, res) => {
  try {
    const projections = retentionService.generateSubjectDecayProjections();

    return res.json({
      success: true,
      data: {
        projections,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
