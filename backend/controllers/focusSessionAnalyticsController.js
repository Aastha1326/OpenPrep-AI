const focusSessionService = require('../services/focusSessionAnalyticsService');
const ActivityLog = require('../models/ActivityLog');

// ── Session Lifecycle ────────────────────────────────────────────────────

// @desc    Start a new focus session
// @route   POST /api/focus-analytics/sessions
// @access  Private
exports.startSession = async (req, res, next) => {
  try {
    const { subject, subjectName, taskType, plannedMinutes, dailyGoalMinutes, tags, notes } = req.body;

    if (!taskType) {
      return res.status(400).json({ success: false, error: 'taskType is required' });
    }

    const session = await focusSessionService.startSession(req.user.id, {
      subject, subjectName, taskType, plannedMinutes, dailyGoalMinutes, tags, notes,
    });

    await ActivityLog.create({
      user: req.user.id,
      activityType: 'focus_session_start',
      description: `Started focus session: ${taskType} (${plannedMinutes || 25}min planned)`,
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) { next(error); }
};

// @desc    End a focus session
// @route   POST /api/focus-analytics/sessions/:id/end
// @access  Private
exports.endSession = async (req, res, next) => {
  try {
    const { interrupted } = req.body;
    const session = await focusSessionService.endSession(req.user.id, req.params.id, { interrupted });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    await ActivityLog.create({
      user: req.user.id,
      activityType: 'focus_session_end',
      description: `Ended focus session: ${session.actualMinutes}min, efficiency ${session.efficiencyScore}%`,
    });

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    if (error.message === 'Session is already finished') {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Pause/resume a focus session
// @route   POST /api/focus-analytics/sessions/:id/pause
// @access  Private
exports.togglePause = async (req, res, next) => {
  try {
    const session = await focusSessionService.togglePause(req.user.id, req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    if (error.message === 'Session is already finished') {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Record an interruption
// @route   POST /api/focus-analytics/sessions/:id/interruption
// @access  Private
exports.recordInterruption = async (req, res, next) => {
  try {
    const { reason, durationSeconds } = req.body;
    const session = await focusSessionService.recordInterruption(req.user.id, req.params.id, { reason, durationSeconds });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.status(200).json({ success: true, data: session });
  } catch (error) { next(error); }
};

// ── Queries ──────────────────────────────────────────────────────────────

// @desc    Get paginated session history
// @route   GET /api/focus-analytics/sessions
// @access  Private
exports.getSessions = async (req, res, next) => {
  try {
    const { status, subject, taskType, startDate, endDate, page, limit } = req.query;
    const result = await focusSessionService.getSessions(req.user.id, {
      status, subject, taskType, startDate, endDate,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });
    res.status(200).json({ success: true, count: result.sessions.length, ...result.pagination, data: result.sessions });
  } catch (error) { next(error); }
};

// @desc    Get a single session
// @route   GET /api/focus-analytics/sessions/:id
// @access  Private
exports.getSession = async (req, res, next) => {
  try {
    const session = await focusSessionService.getSessionById(req.user.id, req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.status(200).json({ success: true, data: session });
  } catch (error) { next(error); }
};

// ── Analytics ────────────────────────────────────────────────────────────

// @desc    Get weekly analytics
// @route   GET /api/focus-analytics/analytics/weekly
// @access  Private
exports.getWeeklyAnalytics = async (req, res, next) => {
  try {
    const { weekStart } = req.query;
    const analytics = await focusSessionService.getWeeklyAnalytics(req.user.id, { weekStart });
    res.status(200).json({ success: true, data: analytics });
  } catch (error) { next(error); }
};

// @desc    Get streak data
// @route   GET /api/focus-analytics/analytics/streaks
// @access  Private
exports.getStreaks = async (req, res, next) => {
  try {
    const streaks = await focusSessionService.getStreaks(req.user.id);
    res.status(200).json({ success: true, data: streaks });
  } catch (error) { next(error); }
};

// @desc    Get dashboard summary
// @route   GET /api/focus-analytics/analytics/dashboard
// @access  Private
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await focusSessionService.getDashboardSummary(req.user.id);
    res.status(200).json({ success: true, data: summary });
  } catch (error) { next(error); }
};

// @desc    Get hourly heatmap data
// @route   GET /api/focus-analytics/analytics/heatmap
// @access  Private
exports.getHourlyHeatmap = async (req, res, next) => {
  try {
    const heatmap = await focusSessionService.getHourlyHeatmap(req.user.id);
    res.status(200).json({ success: true, data: heatmap });
  } catch (error) { next(error); }
};

// @desc    Get efficiency trend
// @route   GET /api/focus-analytics/analytics/efficiency-trend
// @access  Private
exports.getEfficiencyTrend = async (req, res, next) => {
  try {
    const { days } = req.query;
    const trend = await focusSessionService.getEfficiencyTrend(req.user.id, {
      days: parseInt(days, 10) || 30,
    });
    res.status(200).json({ success: true, data: trend });
  } catch (error) { next(error); }
};
