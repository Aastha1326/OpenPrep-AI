const weaknessDetectionEngine = require('../services/weaknessDetectionEngine');
const WeaknessReport = require('../models/WeaknessReport');

/**
 * @route   POST /api/weakness/analyze
 * @desc    Run a full weakness analysis for the authenticated user
 * @access  Private
 */
exports.analyze = async (req, res) => {
  try {
    const userId = req.user.id;
    const snapshotType = req.body.snapshotType || 'manual';

    const { report, profile } = await weaknessDetectionEngine.runFullAnalysis(
      userId,
      snapshotType
    );

    res.status(200).json({
      success: true,
      data: {
        reportId: report.id,
        profile,
        recommendations: report.aiRecommendations,
        trend: {
          direction: report.trendDirection,
          delta: report.comparisonDelta,
        },
      },
    });
  } catch (error) {
    console.error('Error in weakness analysis:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to run weakness analysis',
    });
  }
};

/**
 * @route   GET /api/weakness/profile
 * @desc    Get current weakness profile without creating a report
 * @access  Private
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await weaknessDetectionEngine.buildWeaknessProfile(userId);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error fetching weakness profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch weakness profile',
    });
  }
};

/**
 * @route   GET /api/weakness/reports
 * @desc    Get all historical weakness reports for the user
 * @access  Private
 */
exports.getReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 50;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    const { rows: reports, count: total } = await WeaknessReport.findAndCountAll({
      where: { user: userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching weakness reports:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch weakness reports',
    });
  }
};

/**
 * @route   GET /api/weakness/reports/:id
 * @desc    Get a specific weakness report by ID
 * @access  Private
 */
exports.getReportById = async (req, res) => {
  try {
    const userId = req.user.id;
    const report = await weaknessDetectionEngine.getReportById(req.params.id, userId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error fetching weakness report:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch weakness report',
    });
  }
};

/**
 * @route   GET /api/weakness/trends
 * @desc    Get trend data (historical scores) for charting
 * @access  Private
 */
exports.getTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 30;

    const trends = await weaknessDetectionEngine.getTrendData(userId, limit);

    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('Error fetching weakness trends:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch weakness trends',
    });
  }
};

/**
 * @route   GET /api/weakness/heatmap
 * @desc    Get heatmap data — subjects as rows, topics as cells, color = status
 * @access  Private
 */
exports.getHeatmap = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await weaknessDetectionEngine.buildWeaknessProfile(userId);

    const heatmapData = profile.subjects.map((subject) => ({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      avgScore: subject.avgScore,
      topics: subject.topics.map((topic) => ({
        topicId: topic.topicId,
        topicName: topic.topicName,
        status: topic.status,
        avgScore: topic.avgScore,
        confidenceScore: topic.confidenceScore,
        attemptCount: topic.attemptCount,
      })),
    }));

    res.status(200).json({
      success: true,
      data: {
        heatmap: heatmapData,
        summary: {
          overallScore: profile.overallScore,
          weakCount: profile.weakCount,
          mediumCount: profile.mediumCount,
          strongCount: profile.strongCount,
          coveragePercentage: profile.coveragePercentage,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch heatmap data',
    });
  }
};

/**
 * @route   GET /api/weakness/recommendations
 * @desc    Get or regenerate AI recommendations for weak topics
 * @access  Private
 */
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await weaknessDetectionEngine.buildWeaknessProfile(userId);
    const weakTopics = profile.topics.filter((t) => t.status === 'Weak');

    const recommendations = await weaknessDetectionEngine.generateAIRecommendations(
      userId,
      weakTopics
    );

    res.status(200).json({
      success: true,
      data: {
        recommendations,
        weakTopics: weakTopics.map((t) => ({
          topicId: t.topicId,
          topicName: t.topicName,
          avgScore: t.avgScore,
          improvementVelocity: t.improvementVelocity,
        })),
      },
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate recommendations',
    });
  }
};

/**
 * @route   GET /api/weakness/subject/:subjectId
 * @desc    Get detailed weakness analysis for a specific subject
 * @access  Private
 */
exports.getSubjectAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subjectId } = req.params;

    const profile = await weaknessDetectionEngine.buildWeaknessProfile(userId);
    const subject = profile.subjects.find((s) => s.subjectId === subjectId);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found in your profile',
      });
    }

    res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error('Error fetching subject analysis:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch subject analysis',
    });
  }
};
