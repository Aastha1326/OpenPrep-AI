/**
 * @fileoverview Express controller for the Study Habit Tracker & Streak
 * Calendar API endpoints.
 */
const habitTrackerService = require('../services/habitTrackerService');
const ActivityLog = require('../models/ActivityLog');

// ---------------------------------------------------------------------------
// Habit Definition Management
// ---------------------------------------------------------------------------

// @desc    Create a new trackable habit
// @route   POST /api/habits
// @access  Private
exports.createHabit = async (req, res, next) => {
  try {
    const {
      name, description, iconEmoji, color, category,
      frequency, specificDays, targetMinutes, targetCount,
      reminderTime, sortOrder, metadata,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Habit name is required' });
    }

    const habit = await habitTrackerService.createHabit(req.user.id, {
      name, description, iconEmoji, color, category,
      frequency, specificDays, targetMinutes, targetCount,
      reminderTime, sortOrder, metadata,
    });

    await ActivityLog.create({
      user: req.user.id,
      activityType: 'habit_created',
      description: `Created new habit: "${habit.name}"`,
    });

    res.status(201).json({ success: true, data: habit });
  } catch (error) {
    next(error);
  }
};

// @desc    List all habits for the current user
// @route   GET /api/habits
// @access  Private
exports.listHabits = async (req, res, next) => {
  try {
    const { category, isActive, includeArchived } = req.query;

    const habits = await habitTrackerService.listHabits(req.user.id, {
      category,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      includeArchived: includeArchived === 'true',
    });

    res.status(200).json({
      success: true,
      count: habits.length,
      data: habits,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single habit by ID
// @route   GET /api/habits/:id
// @access  Private
exports.getHabit = async (req, res, next) => {
  try {
    const habit = await habitTrackerService.getHabitById(req.user.id, req.params.id);
    if (!habit) {
      return res.status(404).json({ success: false, error: 'Habit not found' });
    }
    res.status(200).json({ success: true, data: habit });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a habit definition
// @route   PUT /api/habits/:id
// @access  Private
exports.updateHabit = async (req, res, next) => {
  try {
    const habit = await habitTrackerService.updateHabit(req.user.id, req.params.id, req.body);
    if (!habit) {
      return res.status(404).json({ success: false, error: 'Habit not found' });
    }
    res.status(200).json({ success: true, data: habit });
  } catch (error) {
    if (error.message && error.message.includes('archived')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Archive a habit (soft-delete)
// @route   DELETE /api/habits/:id
// @access  Private
exports.archiveHabit = async (req, res, next) => {
  try {
    const habit = await habitTrackerService.archiveHabit(req.user.id, req.params.id);
    if (!habit) {
      return res.status(404).json({ success: false, error: 'Habit not found' });
    }
    res.status(200).json({ success: true, data: habit });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete a habit and all its logs
// @route   DELETE /api/habits/:id/permanent
// @access  Private
exports.deleteHabit = async (req, res, next) => {
  try {
    const deleted = await habitTrackerService.deleteHabit(req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Habit not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Habit Logging
// ---------------------------------------------------------------------------

// @desc    Log a habit completion
// @route   POST /api/habits/:id/log
// @access  Private
exports.logHabit = async (req, res, next) => {
  try {
    const { date, completionCount, durationMinutes, qualityRating, note, source, sourceId } = req.body;

    const result = await habitTrackerService.logHabit(req.user.id, req.params.id, {
      date,
      completionCount,
      durationMinutes,
      qualityRating,
      note,
      source,
      sourceId,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message && (error.message.includes('not found') || error.message.includes('archived'))) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Batch log habits for multiple dates
// @route   POST /api/habits/batch-log
// @access  Private
exports.batchLogHabits = async (req, res, next) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, error: 'entries must be a non-empty array' });
    }

    const result = await habitTrackerService.batchLogHabits(req.user.id, entries);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error.message && error.message.includes('Maximum')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Get logs for a date range
// @route   GET /api/habits/logs
// @access  Private
exports.getLogs = async (req, res, next) => {
  try {
    const { startDate, endDate, habitId } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate query params are required',
      });
    }

    const logs = await habitTrackerService.getLogsForRange(req.user.id, startDate, endDate, { habitId });
    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Calendar & Analytics
// ---------------------------------------------------------------------------

// @desc    Get calendar heatmap data
// @route   GET /api/habits/calendar
// @access  Private
exports.getCalendarHeatmap = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months, 10) || 6;
    const data = await habitTrackerService.getCalendarHeatmap(req.user.id, months);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get weekly habit summary
// @route   GET /api/habits/weekly
// @access  Private
exports.getWeeklySummary = async (req, res, next) => {
  try {
    const { weekStart } = req.query;
    const summary = await habitTrackerService.getWeeklySummary(req.user.id, weekStart);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the habit tracker dashboard
// @route   GET /api/habits/dashboard
// @access  Private
exports.getDashboard = async (req, res, next) => {
  try {
    const dashboard = await habitTrackerService.getDashboard(req.user.id);
    res.status(200).json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Streak Management
// ---------------------------------------------------------------------------

// @desc    Recalculate streaks for all habits
// @route   POST /api/habits/streaks/recalculate
// @access  Private
exports.recalculateStreaks = async (req, res, next) => {
  try {
    const streaks = await habitTrackerService.recalculateAllStreaks(req.user.id);
    res.status(200).json({
      success: true,
      count: streaks.length,
      data: streaks,
    });
  } catch (error) {
    next(error);
  }
};
