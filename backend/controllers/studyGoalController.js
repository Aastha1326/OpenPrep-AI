const studyGoalService = require('../services/studyGoalService');
const ActivityLog = require('../models/ActivityLog');

// ── Goal CRUD ────────────────────────────────────────────────────────────

// @desc    Create a new study goal
// @route   POST /api/study-goals
// @access  Private
exports.createGoal = async (req, res, next) => {
  try {
    const { title, description, goalType, metricType, targetValue, unit, subject, priority, startDate, endDate, tags, reminderTime } = req.body;

    if (!title || !targetValue) {
      return res.status(400).json({ success: false, error: 'Title and target value are required' });
    }

    if (targetValue <= 0) {
      return res.status(400).json({ success: false, error: 'Target value must be greater than 0' });
    }

    const goal = await studyGoalService.createGoal(req.user.id, {
      title,
      description,
      goalType,
      metricType,
      targetValue,
      unit,
      subject,
      priority,
      startDate,
      endDate,
      tags,
      reminderTime,
    });

    await ActivityLog.create({
      user: req.user.id,
      activityType: 'goal_created',
      description: `Created study goal: "${goal.title}" (${goal.metricType} target: ${goal.targetValue} ${goal.unit || ''})`,
    });

    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all study goals for the current user
// @route   GET /api/study-goals
// @access  Private
exports.getGoals = async (req, res, next) => {
  try {
    const { status, goalType, subjectId, page, limit } = req.query;

    const result = await studyGoalService.getUserGoals(req.user.id, {
      status,
      goalType,
      subjectId,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });

    res.status(200).json({
      success: true,
      count: result.goals.length,
      ...result.pagination,
      data: result.goals,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single study goal with progress history
// @route   GET /api/study-goals/:id
// @access  Private
exports.getGoal = async (req, res, next) => {
  try {
    const result = await studyGoalService.getGoalById(req.user.id, req.params.id);

    if (!result) {
      return res.status(404).json({ success: false, error: 'Study goal not found' });
    }

    res.status(200).json({
      success: true,
      data: result.goal,
      progressEntries: result.progressEntries,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a study goal
// @route   PUT /api/study-goals/:id
// @access  Private
exports.updateGoal = async (req, res, next) => {
  try {
    const goal = await studyGoalService.updateGoal(req.user.id, req.params.id, req.body);

    if (!goal) {
      return res.status(404).json({ success: false, error: 'Study goal not found' });
    }

    res.status(200).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a study goal
// @route   DELETE /api/study-goals/:id
// @access  Private
exports.deleteGoal = async (req, res, next) => {
  try {
    const deleted = await studyGoalService.deleteGoal(req.user.id, req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Study goal not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// ── Progress ─────────────────────────────────────────────────────────────

// @desc    Record progress toward a study goal
// @route   POST /api/study-goals/:id/progress
// @access  Private
exports.recordProgress = async (req, res, next) => {
  try {
    const { value, source, sourceId, note } = req.body;

    if (value === undefined || value === null || value <= 0) {
      return res.status(400).json({ success: false, error: 'A positive progress value is required' });
    }

    const result = await studyGoalService.recordProgress(req.user.id, req.params.id, {
      value,
      source,
      sourceId,
      note,
    });

    await ActivityLog.create({
      user: req.user.id,
      activityType: 'goal_progress',
      description: `Recorded ${value} progress toward goal: "${result.goal.title}"`,
    });

    res.status(201).json({
      success: true,
      data: {
        goal: result.goal,
        progress: result.progress,
      },
    });
  } catch (error) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.message && error.message.includes('Cannot record')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Bulk record progress for multiple goals
// @route   POST /api/study-goals/bulk-progress
// @access  Private
exports.bulkRecordProgress = async (req, res, next) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, error: 'entries must be a non-empty array' });
    }

    if (entries.length > 50) {
      return res.status(400).json({ success: false, error: 'Maximum 50 entries per bulk request' });
    }

    const results = [];
    const errors = [];

    for (const entry of entries) {
      try {
        const result = await studyGoalService.recordProgress(req.user.id, entry.goalId, {
          value: entry.value,
          source: entry.source || 'manual',
          sourceId: entry.sourceId,
          note: entry.note,
        });
        results.push({ goalId: entry.goalId, status: 'success', goal: result.goal });
      } catch (err) {
        errors.push({ goalId: entry.goalId, status: 'error', error: err.message });
      }
    }

    res.status(200).json({
      success: true,
      data: { results, errors },
    });
  } catch (error) {
    next(error);
  }
};

// ── Analytics ────────────────────────────────────────────────────────────

// @desc    Get daily stats for a date range
// @route   GET /api/study-goals/stats/daily
// @access  Private
exports.getDailyStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate and endDate query params are required' });
    }

    const stats = await studyGoalService.getDailyStats(req.user.id, startDate, endDate);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subject-level analytics
// @route   GET /api/study-goals/stats/subjects
// @access  Private
exports.getSubjectAnalytics = async (req, res, next) => {
  try {
    const analytics = await studyGoalService.getSubjectAnalytics(req.user.id);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

// @desc    Get streak and consistency metrics
// @route   GET /api/study-goals/stats/streaks
// @access  Private
exports.getStreakMetrics = async (req, res, next) => {
  try {
    const metrics = await studyGoalService.getStreakMetrics(req.user.id);
    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

// ── Weekly Reports ───────────────────────────────────────────────────────

// @desc    Generate a weekly study report
// @route   POST /api/study-goals/reports/weekly
// @access  Private
exports.generateWeeklyReport = async (req, res, next) => {
  try {
    const { weekStart, weekEnd } = req.body;

    if (!weekStart || !weekEnd) {
      return res.status(400).json({ success: false, error: 'weekStart and weekEnd are required' });
    }

    const report = await studyGoalService.generateWeeklyReport(req.user.id, weekStart, weekEnd);
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all weekly reports
// @route   GET /api/study-goals/reports/weekly
// @access  Private
exports.getWeeklyReports = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const result = await studyGoalService.getWeeklyReports(req.user.id, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    res.status(200).json({
      success: true,
      count: result.reports.length,
      ...result.pagination,
      data: result.reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the most recent weekly report
// @route   GET /api/study-goals/reports/weekly/latest
// @access  Private
exports.getLatestWeeklyReport = async (req, res, next) => {
  try {
    const result = await studyGoalService.getWeeklyReports(req.user.id, { page: 1, limit: 1 });

    if (result.reports.length === 0) {
      return res.status(404).json({ success: false, error: 'No weekly reports found. Generate one first.' });
    }

    res.status(200).json({ success: true, data: result.reports[0] });
  } catch (error) {
    next(error);
  }
};

// ── Dashboard Summary ────────────────────────────────────────────────────

// @desc    Get a combined dashboard summary (goals overview + streak + recent reports)
// @route   GET /api/study-goals/dashboard
// @access  Private
exports.getDashboard = async (req, res, next) => {
  try {
    const [activeGoals, streakMetrics, dailyStats, recentReports] = await Promise.all([
      studyGoalService.getUserGoals(req.user.id, { status: 'active', limit: 10 }),
      studyGoalService.getStreakMetrics(req.user.id),
      studyGoalService.getDailyStats(
        req.user.id,
        getWeekStart(new Date()),
        getWeekEnd(new Date())
      ),
      studyGoalService.getWeeklyReports(req.user.id, { page: 1, limit: 3 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        activeGoals: activeGoals.goals,
        activeGoalCount: activeGoals.pagination.total,
        streakMetrics,
        weeklyProgress: dailyStats.summary,
        recentReports: recentReports.reports,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function getWeekEnd(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + 6;
  d.setDate(diff);
  d.setHours(23, 59, 59, 999);
  return d.toISOString().split('T')[0];
}
