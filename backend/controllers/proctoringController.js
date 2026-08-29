const { ExamIntegrityReport, User } = require('../models');
const redisService = require('../services/redisService');
const { analyzeKeystrokeDynamics, compareBiometricProfile } = require('../services/proctoringBiometrics');
const logger = require('../utils/logger');

// Local fallback store for user baselines if Redis is offline
const localBiometricsBaseline = new Map();

/**
 * @desc    Save/update student's keystroke dynamic baseline
 * @route   POST /api/proctoring/baseline
 * @access  Private
 */
exports.updateBaseline = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { averageDwellMs, averageFlightMs } = req.body;

    if (!averageDwellMs || !averageFlightMs) {
      return res.status(400).json({ success: false, error: 'averageDwellMs and averageFlightMs are required.' });
    }

    const baseline = {
      averageDwellMs: Number(averageDwellMs),
      averageFlightMs: Number(averageFlightMs),
      updatedAt: new Date().toISOString(),
    };

    const redisKey = `user:biometrics:${userId}`;
    if (redisService.isReady && redisService.client) {
      await redisService.set(redisKey, baseline, 31536000); // 1 year TTL
    }
    localBiometricsBaseline.set(userId, baseline);

    logger.info('[ProctoringController] Keystroke dynamics baseline saved', { userId, baseline });
    res.status(200).json({
      success: true,
      message: 'Biometrics baseline profile updated successfully.',
      data: baseline,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Log focus/blur/resizing telemetry and verify keystrokes dynamics
 * @route   POST /api/proctoring/log
 * @access  Private
 */
exports.logProctoringEvent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { quizAttemptId, eventType, timestamp, metadata = {} } = req.body;

    if (!quizAttemptId || !eventType) {
      return res.status(400).json({ success: false, error: 'quizAttemptId and eventType are required.' });
    }

    // Retrieve active report or create new
    let report = await ExamIntegrityReport.findOne({ where: { quizAttemptId, userId } });
    let logs = report ? (report.telemetryLogs || []) : [];
    let anomalyFlags = report ? (report.anomalyFlags || []) : [];

    const newEvent = {
      eventType,
      timestamp: timestamp || new Date().toISOString(),
      metadata,
    };
    logs.push(newEvent);

    // Fetch baseline biometrics profile
    const redisKey = `user:biometrics:${userId}`;
    let baseline = localBiometricsBaseline.get(userId) || { averageDwellMs: 120, averageFlightMs: 250 };
    if (redisService.isReady && redisService.client) {
      const cached = await redisService.get(redisKey);
      if (cached) baseline = cached;
    }

    // Recalculate Trust Score
    let trustScore = 100;
    let tabBlurCount = 0;
    let resizeCount = 0;
    let copyPasteCount = 0;

    logs.forEach((evt) => {
      if (evt.eventType === 'BLUR') tabBlurCount++;
      if (evt.eventType === 'RESIZE') resizeCount++;
      if (evt.eventType === 'COPY_PASTE') copyPasteCount++;
    });

    // Deduct points for event infractions
    trustScore -= tabBlurCount * 15;     // heavy penalty for swapping tabs
    trustScore -= resizeCount * 5;        // penalty for altering window dimensions
    trustScore -= copyPasteCount * 10;    // penalty for clipboard actions

    // Apply keystroke biometrics validation if keystrokes are logged in this payload
    let biometricsStats = report ? (report.biometrics || {}) : {};
    if (eventType === 'KEYSTROKES' && Array.isArray(metadata.keystrokes)) {
      const sessionStats = analyzeKeystrokeDynamics(metadata.keystrokes);
      const bioResult = compareBiometricProfile(sessionStats, baseline);

      biometricsStats = {
        sessionAvgDwellMs: sessionStats.avgDwellMs,
        sessionAvgFlightMs: sessionStats.avgFlightMs,
        similarityScore: bioResult.similarityScore,
      };

      // Deduct half of the biometrics divergence score from overall trust
      const bioPenalty = Math.round((100 - bioResult.similarityScore) * 0.5);
      trustScore -= bioPenalty;

      // Merge anomaly flags
      bioResult.anomalyFlags.forEach((f) => {
        if (!anomalyFlags.includes(f)) {
          anomalyFlags.push(f);
        }
      });
    }

    if (tabBlurCount >= 3 && !anomalyFlags.includes('EXCESSIVE_TAB_SWITCHING')) {
      anomalyFlags.push('EXCESSIVE_TAB_SWITCHING');
    }

    // Clamp trustScore to [0-100] range
    trustScore = Math.max(0, Math.min(100, trustScore));

    if (report) {
      report.telemetryLogs = logs;
      report.biometrics = biometricsStats;
      report.trustScore = trustScore;
      report.anomalyFlags = anomalyFlags;
      await report.save();
    } else {
      report = await ExamIntegrityReport.create({
        quizAttemptId,
        userId,
        telemetryLogs: logs,
        biometrics: biometricsStats,
        trustScore,
        anomalyFlags,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Proctoring telemetry logged successfully.',
      data: {
        trustScore: report.trustScore,
        anomalyFlags: report.anomalyFlags,
      },
    });

  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Fetch proctoring report details for an attempt
 * @route   GET /api/proctoring/report/:quizAttemptId
 * @access  Private
 */
exports.getProctoringReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { quizAttemptId } = req.params;

    const report = await ExamIntegrityReport.findOne({
      where: { quizAttemptId },
    });

    if (!report) {
      return res.status(404).json({ success: false, error: 'Proctoring report not found for this attempt.' });
    }

    // Security: Only owner user or admin can view the report
    if (report.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

// Export internal cache for test mocking
module.exports.localBiometricsBaseline = localBiometricsBaseline;
