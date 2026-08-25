const diagramQuestionService = require('../services/diagramQuestionService');

// @desc    Auto-generate diagram hotspots & prompts from an uploaded diagram image
// @route   POST /api/quizzes/diagram-hotspot/generate
// @access  Private
exports.generateDiagramHotspots = async (req, res, next) => {
  try {
    const { topic } = req.body;
    const imageBuffer = req.file ? req.file.buffer : null;
    const mimeType = req.file ? req.file.mimetype : 'image/jpeg';

    const hotspots = await diagramQuestionService.generateDiagramHotspots(
      imageBuffer,
      mimeType,
      topic || 'Visual Diagram'
    );

    res.status(200).json({
      success: true,
      data: {
        topic: topic || 'Visual Diagram',
        imageUrl: req.file ? `data:${mimeType};base64,${imageBuffer.toString('base64')}` : null,
        hotspots,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify student click coordinates against target diagram hotspot region
// @route   POST /api/quizzes/diagram-hotspot/verify
// @access  Private
exports.verifyHotspotClick = async (req, res, next) => {
  try {
    const { hotspot, clickCoordinates } = req.body;

    if (!hotspot || !clickCoordinates) {
      return res.status(400).json({
        success: false,
        error: 'Both hotspot definition and clickCoordinates {x, y} are required.',
      });
    }

    const verification = diagramQuestionService.verifyDiagramHotspotAnswer(
      hotspot,
      clickCoordinates
    );

    res.status(200).json({
      success: true,
      data: verification,
    });
  } catch (error) {
    next(error);
  }
};
