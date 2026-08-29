const revisionSchedulerService = require('../services/revisionSchedulerService');
const ActivityLog = require('../models/ActivityLog');

// ── Schedule CRUD ────────────────────────────────────────────────────────

// @desc    Generate a new revision schedule
// @route   POST /api/revision-schedules
// @access  Private
exports.createSchedule = async (req, res, next) => {
  try {
    const { examDate, dailyStudyHours } = req.body;

    if (!examDate) {
      return res.status(400).json({ success: false, error: 'examDate is required' });
    }

    const exam = new Date(examDate);
    if (isNaN(exam.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid examDate format' });
    }

    if (exam <= new Date()) {
      return res.status(400).json({ success: false, error: 'examDate must be in the future' });
    }

    const schedule = await revisionSchedulerService.generateSchedule(req.user.id, {
      examDate,
      dailyStudyHours: dailyStudyHours || 3,
    });

    await ActivityLog.create({
      user: req.user.id,
      activityType: 'revision_schedule_created',
      description: `Generated revision schedule: "${schedule.title}" (${schedule.totalSlots} slots until ${examDate})`,
    });

    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    if (error.message && error.message.includes('No subjects found')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Get all revision schedules for the user
// @route   GET /api/revision-schedules
// @access  Private
exports.getSchedules = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;

    const result = await revisionSchedulerService.getUserSchedules(req.user.id, {
      status,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    res.status(200).json({
      success: true,
      count: result.schedules.length,
      ...result.pagination,
      data: result.schedules,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single schedule with all its slots
// @route   GET /api/revision-schedules/:id
// @access  Private
exports.getSchedule = async (req, res, next) => {
  try {
    const result = await revisionSchedulerService.getScheduleById(req.user.id, req.params.id);

    if (!result) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    res.status(200).json({
      success: true,
      data: result.schedule,
      slots: result.slots,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's revision slots
// @route   GET /api/revision-schedules/today
// @access  Private
exports.getTodaysSlots = async (req, res, next) => {
  try {
    const { scheduleId } = req.query;

    const slots = await revisionSchedulerService.getTodaysSlots(req.user.id, scheduleId || null);

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get slots for a date range (calendar view)
// @route   GET /api/revision-schedules/calendar
// @access  Private
exports.getCalendarSlots = async (req, res, next) => {
  try {
    const { startDate, endDate, scheduleId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate query params are required',
      });
    }

    const slots = await revisionSchedulerService.getSlotsForDateRange(
      req.user.id,
      startDate,
      endDate,
      scheduleId || null
    );

    // Group slots by date for easy calendar rendering
    const groupedByDate = {};
    for (const slot of slots) {
      const date = slot.scheduledDate;
      if (!groupedByDate[date]) groupedByDate[date] = [];
      groupedByDate[date].push(slot);
    }

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
      groupedByDate,
    });
  } catch (error) {
    next(error);
  }
};

// ── Slot Actions ─────────────────────────────────────────────────────────

// @desc    Mark a revision slot as completed
// @route   POST /api/revision-schedules/slots/:slotId/complete
// @access  Private
exports.completeSlot = async (req, res, next) => {
  try {
    const { readinessAfter, notes } = req.body;

    const slot = await revisionSchedulerService.completeSlot(req.user.id, req.params.slotId, {
      readinessAfter,
      notes,
    });

    res.status(200).json({ success: true, data: slot });
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.message && error.message.includes('already completed')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Skip a revision slot
// @route   POST /api/revision-schedules/slots/:slotId/skip
// @access  Private
exports.skipSlot = async (req, res, next) => {
  try {
    const slot = await revisionSchedulerService.skipSlot(req.user.id, req.params.slotId);
    res.status(200).json({ success: true, data: slot });
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Reschedule a slot to a new date
// @route   POST /api/revision-schedules/slots/:slotId/reschedule
// @access  Private
exports.rescheduleSlot = async (req, res, next) => {
  try {
    const { newDate } = req.body;

    if (!newDate) {
      return res.status(400).json({ success: false, error: 'newDate is required' });
    }

    const slot = await revisionSchedulerService.rescheduleSlot(
      req.user.id,
      req.params.slotId,
      newDate
    );

    res.status(200).json({ success: true, data: slot });
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Pause or resume a schedule
// @route   PUT /api/revision-schedules/:id/status
// @access  Private
exports.updateScheduleStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'paused'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be "active" or "paused"' });
    }

    const RevisionSchedule = require('../models/RevisionSchedule');
    const schedule = await RevisionSchedule.findOne({
      where: { id: req.params.id, user: req.user.id },
    });

    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    schedule.status = status;
    await schedule.save();

    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a schedule and its slots
// @route   DELETE /api/revision-schedules/:id
// @access  Private
exports.deleteSchedule = async (req, res, next) => {
  try {
    const RevisionSchedule = require('../models/RevisionSchedule');
    const RevisionSlot = require('../models/RevisionSlot');

    const schedule = await RevisionSchedule.findOne({
      where: { id: req.params.id, user: req.user.id },
    });

    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    await RevisionSlot.destroy({ where: { scheduleId: schedule.id } });
    await schedule.destroy();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
