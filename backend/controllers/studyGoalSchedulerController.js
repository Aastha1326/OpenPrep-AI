const studyGoalSchedulerService = require('../services/studyGoalSchedulerService');
const cacheService = require('../services/cacheService');
const ActivityLog = require('../models/ActivityLog');
const { toDateOnlyString } = require('../utils/dateUtils');

const CACHE_TTL = 600; // 10 minutes

/**
 * @desc    Generate a weekly study schedule
 * @route   POST /api/study-scheduler/generate
 * @access  Private
 */
exports.generateSchedule = async (req, res, next) => {
  try {
    const {
      availability,
      dailyHours,
      examId,
      weekStartDate,
      blockMinutes,
    } = req.body;

    // Validate blockMinutes
    if (blockMinutes !== undefined && (blockMinutes < 15 || blockMinutes > 120)) {
      return res.status(400).json({
        success: false,
        error: 'blockMinutes must be between 15 and 120',
      });
    }

    // Validate dailyHours
    if (dailyHours !== undefined && (dailyHours < 0.5 || dailyHours > 12)) {
      return res.status(400).json({
        success: false,
        error: 'dailyHours must be between 0.5 and 12',
      });
    }

    // Validate availability structure
    if (availability !== undefined) {
      if (!Array.isArray(availability)) {
        return res.status(400).json({
          success: false,
          error: 'availability must be an array of day windows',
        });
      }
      for (const window of availability) {
        if (typeof window.dayOfWeek !== 'number' || window.dayOfWeek < 0 || window.dayOfWeek > 6) {
          return res.status(400).json({
            success: false,
            error: 'each availability entry must have dayOfWeek (0-6)',
          });
        }
        if (typeof window.startHour !== 'number' || typeof window.endHour !== 'number') {
          return res.status(400).json({
            success: false,
            error: 'each availability entry must have startHour and endHour',
          });
        }
        if (window.endHour <= window.startHour) {
          return res.status(400).json({
            success: false,
            error: `endHour must be after startHour for day ${window.dayOfWeek}`,
          });
        }
      }
    }

    const schedule = await studyGoalSchedulerService.generateWeeklySchedule(req.user.id, {
      availability,
      dailyHours,
      examId,
      weekStartDate: weekStartDate ? new Date(weekStartDate) : undefined,
      blockMinutes,
    });

    // Cache the schedule
    const cacheKey = `study_scheduler:${req.user.id}:${schedule.weekStart}`;
    await cacheService.set(cacheKey, JSON.stringify(schedule), CACHE_TTL);

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      activityType: 'schedule_generate',
      description: `Generated weekly study schedule for week of ${schedule.weekStart}`,
    });

    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the current/last generated schedule
 * @route   GET /api/study-scheduler/current
 * @access  Private
 */
exports.getCurrentSchedule = async (req, res, next) => {
  try {
    const { weekStart } = req.query;

    // Try to find cached schedule
    if (weekStart) {
      const cacheKey = `study_scheduler:${req.user.id}:${weekStart}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        try {
          return res.status(200).json({ success: true, data: JSON.parse(cached), cached: true });
        } catch (_) {
          // cache corrupted
        }
      }
    }

    // No cached schedule found — generate a fresh one
    const schedule = await studyGoalSchedulerService.generateWeeklySchedule(req.user.id, {});

    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reschedule a block to a new time
 * @route   PUT /api/study-scheduler/reschedule
 * @access  Private
 */
exports.rescheduleBlock = async (req, res, next) => {
  try {
    const { blockId, newDate, newStartHour, currentSchedule } = req.body;

    if (!blockId || !newDate || newStartHour === undefined) {
      return res.status(400).json({
        success: false,
        error: 'blockId, newDate, and newStartHour are required',
      });
    }

    if (typeof newStartHour !== 'number' || newStartHour < 0 || newStartHour >= 24) {
      return res.status(400).json({
        success: false,
        error: 'newStartHour must be a number between 0 and 23',
      });
    }

    if (!currentSchedule) {
      return res.status(400).json({
        success: false,
        error: 'currentSchedule is required for rescheduling',
      });
    }

    const result = studyGoalSchedulerService.rescheduleBlock(
      currentSchedule,
      blockId,
      newDate,
      newStartHour
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    // Update cache
    const weekStart = currentSchedule.weekStart;
    if (weekStart) {
      const cacheKey = `study_scheduler:${req.user.id}:${weekStart}`;
      await cacheService.set(cacheKey, JSON.stringify(result.schedule), CACHE_TTL);
    }

    res.status(200).json({
      success: true,
      data: {
        schedule: result.schedule,
        movedBlock: result.movedBlock,
        conflicts: result.conflicts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Detect conflicts in a schedule
 * @route   POST /api/study-scheduler/detect-conflicts
 * @access  Private
 */
exports.detectConflicts = async (req, res, next) => {
  try {
    const { blocks } = req.body;

    if (!Array.isArray(blocks)) {
      return res.status(400).json({
        success: false,
        error: 'blocks must be an array',
      });
    }

    const conflicts = studyGoalSchedulerService.detectConflicts(blocks);

    res.status(200).json({
      success: true,
      data: {
        conflictCount: conflicts.length,
        conflicts,
        hasConflicts: conflicts.length > 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get subject priorities for scheduling
 * @route   GET /api/study-scheduler/priorities
 * @access  Private
 */
exports.getSubjectPriorities = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const priorities = await studyGoalSchedulerService.computeSubjectPriorities(
      req.user.id,
      examId
    );

    res.status(200).json({ success: true, data: priorities });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get flashcard review load for scheduling
 * @route   GET /api/study-scheduler/flashcard-load
 * @access  Private
 */
exports.getFlashcardLoad = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const load = await studyGoalSchedulerService.computeFlashcardReviewLoad(
      req.user.id,
      examId
    );

    res.status(200).json({ success: true, data: load });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get schedule adherence report
 * @route   GET /api/study-scheduler/adherence
 * @access  Private
 */
exports.getAdherence = async (req, res, next) => {
  try {
    const { weekStart, schedule } = req.query;

    if (!weekStart) {
      return res.status(400).json({
        success: false,
        error: 'weekStart query parameter is required (YYYY-MM-DD)',
      });
    }

    // Parse the schedule from query if provided, otherwise generate fresh
    let plannedSchedule;
    if (schedule) {
      try {
        plannedSchedule = JSON.parse(schedule);
      } catch (_) {
        // ignore parse error
      }
    }

    if (!plannedSchedule) {
      // Try cache first
      const cacheKey = `study_scheduler:${req.user.id}:${weekStart}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        try {
          plannedSchedule = JSON.parse(cached);
        } catch (_) {
          // ignore
        }
      }
    }

    if (!plannedSchedule) {
      // Generate a fresh schedule for that week
      const weekStartDate = new Date(`${weekStart}T00:00:00`);
      plannedSchedule = await studyGoalSchedulerService.generateWeeklySchedule(
        req.user.id,
        { weekStartDate }
      );
    }

    const adherence = await studyGoalSchedulerService.getScheduleAdherence(
      req.user.id,
      weekStart,
      plannedSchedule
    );

    res.status(200).json({ success: true, data: adherence });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the optimal study block duration for a subject
 * @route   GET /api/study-scheduler/optimal-block
 * @access  Private
 */
exports.getOptimalBlockDuration = async (req, res, next) => {
  try {
    const FocusSession = require('../models/FocusSession');
    const { Op } = require('sequelize');

    const { subjectId } = req.query;

    // Get recent focus sessions for this subject (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const where = {
      user: req.user.id,
      createdAt: { [Op.gte]: thirtyDaysAgo },
    };
    if (subjectId) {
      where.subject = subjectId;
    }

    const sessions = await FocusSession.findAll({
      where,
      attributes: ['id', 'activeSeconds', 'focusScore', 'subject', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    if (sessions.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          recommendedMinutes: 45,
          confidence: 'low',
          reason: 'No focus session data available — defaulting to 45 minutes',
          sessionsAnalyzed: 0,
        },
      });
    }

    // Find the session duration that correlates with highest focus scores
    const durationBuckets = {};
    for (const session of sessions) {
      const minutes = Math.round(session.activeSeconds / 60);
      const bucket = Math.floor(minutes / 15) * 15; // 15-minute buckets
      if (!durationBuckets[bucket]) {
        durationBuckets[bucket] = { totalFocus: 0, count: 0 };
      }
      durationBuckets[bucket].totalFocus += session.focusScore || 0;
      durationBuckets[bucket].count++;
    }

    // Find bucket with highest average focus score
    let bestBucket = 45;
    let bestFocusAvg = 0;

    for (const [bucket, data] of Object.entries(durationBuckets)) {
      const avg = data.totalFocus / data.count;
      if (avg > bestFocusAvg) {
        bestFocusAvg = avg;
        bestBucket = parseInt(bucket, 10);
      }
    }

    // Clamp to reasonable range
    const recommendedMinutes = Math.max(15, Math.min(120, bestBucket));

    const confidence = sessions.length >= 10 ? 'high' : sessions.length >= 5 ? 'medium' : 'low';

    return res.status(200).json({
      success: true,
      data: {
        recommendedMinutes,
        confidence,
        reason: `Based on ${sessions.length} session${sessions.length !== 1 ? 's' : ''} — ${recommendedMinutes}-minute blocks yield the highest focus scores`,
        sessionsAnalyzed: sessions.length,
        bucketAnalysis: Object.entries(durationBuckets)
          .map(([bucket, data]) => ({
            durationMinutes: parseInt(bucket, 10),
            avgFocusScore: Number((data.totalFocus / data.count).toFixed(2)),
            sessionCount: data.count,
          }))
          .sort((a, b) => a.durationMinutes - b.durationMinutes),
      },
    });
  } catch (error) {
    next(error);
  }
};
