const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/db');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const Flashcard = require('../models/Flashcard');
const StudyPlan = require('../models/StudyPlan');
const FocusSession = require('../models/FocusSession');
const User = require('../models/User');
const { toDateOnlyString } = require('../utils/dateUtils');

/**
 * StudyGoalSchedulerService
 *
 * Breaks down a user's weekly study goals into daily time-blocks,
 * weighted by subject priority (mastery gaps, weak areas, exam proximity),
 * respecting user availability windows, and interleaving spaced repetition
 * flashcard reviews at optimal intervals.
 *
 * The scheduler produces a structured weekly timetable that can be persisted,
 * synced to Google Calendar, or consumed by the frontend for a drag-and-drop
 * schedule view.
 */

// ── Default constants ──────────────────────────────────────────────────────

const DEFAULT_DAILY_HOURS = 3;
const DEFAULT_BLOCK_DURATION_MINUTES = 45;
const MIN_BLOCK_DURATION_MINUTES = 15;
const MAX_BLOCK_DURATION_MINUTES = 120;
const BREAK_BETWEEN_BLOCKS_MINUTES = 10;
const MAX_SUBJECTS_PER_DAY = 3;
const FLASHCARD_REVIEW_FRACTION = 0.15; // 15% of daily time reserved for flashcard review
const MIN_PRIORITY_SCORE = 0.1;
const MAX_PRIORITY_SCORE = 1.0;

// Default availability: Mon-Sun, 9am-9pm
const DEFAULT_AVAILABILITY = [
  { dayOfWeek: 1, startHour: 9, endHour: 21 }, // Monday
  { dayOfWeek: 2, startHour: 9, endHour: 21 }, // Tuesday
  { dayOfWeek: 3, startHour: 9, endHour: 21 }, // Wednesday
  { dayOfWeek: 4, startHour: 9, endHour: 21 }, // Thursday
  { dayOfWeek: 5, startHour: 9, endHour: 21 }, // Friday
  { dayOfWeek: 6, startHour: 10, endHour: 18 }, // Saturday
  { dayOfWeek: 0, startHour: 10, endHour: 16 }, // Sunday
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── Public API ─────────────────────────────────────────────────────────────

class StudyGoalSchedulerService {
  /**
   * Generate a full weekly study schedule for a user.
   *
   * @param {string} userId
   * @param {Object} options
   * @param {Object}   [options.availability]    User's daily availability windows
   * @param {number}   [options.dailyHours]      Target daily study hours
   * @param {string}   [options.examId]          Optional exam scope
   * @param {Date}     [options.weekStartDate]   Monday of the target week (default: next Monday)
   * @param {number}   [options.blockMinutes]    Preferred block duration in minutes
   * @returns {Promise<Object>}                  Structured weekly schedule
   */
  async generateWeeklySchedule(userId, options = {}) {
    const {
      availability = DEFAULT_AVAILABILITY,
      dailyHours = DEFAULT_DAILY_HOURS,
      examId,
      weekStartDate,
      blockMinutes = DEFAULT_BLOCK_DURATION_MINUTES,
    } = options;

    // 1. Compute subject priorities
    const subjectPriorities = await this.computeSubjectPriorities(userId, examId);

    // 2. Compute flashcard review load per subject
    const flashcardLoad = await this.computeFlashcardReviewLoad(userId, examId);

    // 3. Build available time slots for the week
    const weekStart = weekStartDate || this.getNextMonday();
    const weekDates = this.getWeekDates(weekStart);
    const availableSlots = this.buildAvailableSlots(weekDates, availability, dailyHours);

    // 4. Allocate study blocks to slots
    const allocatedSchedule = this.allocateBlocks(
      availableSlots,
      subjectPriorities,
      flashcardLoad,
      blockMinutes,
      dailyHours
    );

    // 5. Compute summary statistics
    const summary = this.computeScheduleSummary(allocatedSchedule, subjectPriorities);

    return {
      userId,
      weekStart: toDateOnlyString(weekStart),
      weekEnd: toDateOnlyString(weekDates[6]),
      generatedAt: new Date().toISOString(),
      availability,
      dailyHoursTarget: dailyHours,
      blockMinutes,
      schedule: allocatedSchedule,
      subjectPriorities: subjectPriorities.map((sp) => ({
        subjectId: sp.subjectId,
        subjectName: sp.subjectName,
        priorityScore: sp.priorityScore,
        rationale: sp.rationale,
        allocatedMinutes: sp.allocatedMinutes,
        allocatedBlocks: sp.allocatedBlocks,
      })),
      flashcardReview: {
        totalReviewMinutes: flashcardLoad.totalReviewMinutes,
        subjects: flashcardLoad.subjects,
      },
      summary,
    };
  }

  /**
   * Compute priority scores for each subject based on mastery gaps,
   * quiz performance, recency, and weak-topic density.
   *
   * @param {string} userId
   * @param {string} [examId]
   * @returns {Promise<Object[]>}
   */
  async computeSubjectPriorities(userId, examId) {
    const subjectWhere = { user: userId };
    if (examId) subjectWhere.exam = examId;

    const subjects = await Subject.findAll({ where: subjectWhere });

    if (subjects.length === 0) return [];

    const priorities = [];

    for (const subject of subjects) {
      // Get topic count for this subject
      const topicCount = await Topic.count({
        where: { subject: subject.id, user: userId },
      });

      // Get quiz attempts for this subject
      const attempts = await QuizAttempt.findAll({
        where: { user: userId },
        include: [
          {
            model: Quiz,
            as: 'quizRef',
            where: { subject: subject.id },
            attributes: ['id'],
          },
        ],
        attributes: ['score', 'createdAt'],
        order: [['createdAt', 'ASC']],
      });

      // Get flashcard count
      const flashcardCount = await Flashcard.count({
        where: { subject: subject.id, user: userId },
      });

      // Calculate mastery gap (inverse of average score)
      let masteryGap = 1.0; // No data = max priority
      let trend = 'unknown';
      let avgScore = 0;

      if (attempts.length > 0) {
        const scores = attempts.map((a) => a.score || 0);
        avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;
        masteryGap = 1 - avgScore / 100;

        // Trend: last 3 vs previous 3
        const recent = attempts.slice(-3);
        const prior = attempts.slice(-6, -3);
        if (recent.length > 0 && prior.length > 0) {
          const recentAvg = recent.reduce((s, a) => s + (a.score || 0), 0) / recent.length;
          const priorAvg = prior.reduce((s, a) => s + (a.score || 0), 0) / prior.length;
          trend = recentAvg - priorAvg > 3 ? 'improving' : recentAvg - priorAvg < -3 ? 'declining' : 'stable';
        }
      }

      // Weak topic density: proportion of topics with low quiz coverage
      const topicIds = await Topic.findAll({
        where: { subject: subject.id, user: userId },
        attributes: ['id'],
      }).then((topics) => topics.map((t) => t.id));

      let weakTopicDensity = 0;
      if (topicIds.length > 0) {
        const topicAttempts = await QuizAttempt.findAll({
          where: { user: userId },
          include: [
            {
              model: Quiz,
              as: 'quizRef',
              where: { topic: { [Op.in]: topicIds } },
              attributes: ['id', 'topic'],
            },
          ],
          attributes: ['score'],
        });

        const topicScores = {};
        for (const ta of topicAttempts) {
          const tId = ta.quizRef?.topic;
          if (!tId) continue;
          if (!topicScores[tId]) topicScores[tId] = [];
          topicScores[tId].push(ta.score || 0);
        }

        let weakCount = 0;
        for (const tId of topicIds) {
          const scores = topicScores[tId] || [];
          if (scores.length === 0 || scores.reduce((s, v) => s + v, 0) / scores.length < 50) {
            weakCount++;
          }
        }
        weakTopicDensity = weakCount / topicIds.length;
      }

      // Composite priority score
      const priorityScore = this._computePriorityScore({
        masteryGap,
        weakTopicDensity,
        hasNoData: attempts.length === 0,
        topicCount,
        flashcardCount,
      });

      const rationale = this._generateRationale({
        subjectName: subject.name,
        masteryGap,
        avgScore,
        weakTopicDensity,
        trend,
        topicCount,
        flashcardCount,
        hasNoData: attempts.length === 0,
      });

      priorities.push({
        subjectId: subject.id,
        subjectName: subject.name,
        examId: subject.exam,
        priorityScore,
        masteryGap,
        avgScore: Number(avgScore.toFixed(2)),
        weakTopicDensity: Number(weakTopicDensity.toFixed(2)),
        topicCount,
        flashcardCount,
        quizAttempts: attempts.length,
        trend,
        rationale,
        allocatedMinutes: 0,
        allocatedBlocks: 0,
      });
    }

    // Normalize priority scores to sum to 1
    const totalScore = priorities.reduce((s, p) => s + p.priorityScore, 0);
    if (totalScore > 0) {
      for (const p of priorities) {
        p.priorityScore = Number((p.priorityScore / totalScore).toFixed(4));
      }
    }

    // Sort by priority score descending
    priorities.sort((a, b) => b.priorityScore - a.priorityScore);

    return priorities;
  }

  /**
   * Compute flashcard review loads per subject based on nextReviewDate.
   *
   * @param {string} userId
   * @param {string} [examId]
   * @returns {Promise<Object>}
   */
  async computeFlashcardReviewLoad(userId, examId) {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const subjectWhere = { user: userId };
    if (examId) subjectWhere.exam = examId;

    const subjects = await Subject.findAll({ where: subjectWhere });
    const subjectLoads = [];
    let totalReviewMinutes = 0;

    for (const subject of subjects) {
      // Count flashcards due for review this week
      const dueCards = await Flashcard.count({
        where: {
          subject: subject.id,
          user: userId,
          nextReviewDate: {
            [Op.and]: [{ [Op.gte]: now }, { [Op.lte]: endOfWeek }],
          },
        },
      });

      // Count overdue cards
      const overdueCards = await Flashcard.count({
        where: {
          subject: subject.id,
          user: userId,
          nextReviewDate: { [Op.lt]: now },
        },
      });

      // Estimate review time: ~30 seconds per card for due, ~45 seconds for overdue
      const estimatedMinutes = Math.ceil((dueCards * 0.5 + overdueCards * 0.75));

      if (dueCards + overdueCards > 0) {
        subjectLoads.push({
          subjectId: subject.id,
          subjectName: subject.name,
          dueCards,
          overdueCards,
          totalCards: dueCards + overdueCards,
          estimatedReviewMinutes: estimatedMinutes,
        });
        totalReviewMinutes += estimatedMinutes;
      }
    }

    return {
      totalReviewMinutes,
      subjects: subjectLoads,
    };
  }

  /**
   * Build available time slots for each day of the week.
   *
   * @param {Date[]}   weekDates      Array of 7 Date objects (Sun-Sat)
   * @param {Object[]} availability   User availability windows per dayOfWeek
   * @param {number}   dailyHours     Target daily hours
   * @returns {Object[]}              Array of available slot objects
   */
  buildAvailableSlots(weekDates, availability, dailyHours) {
    const slots = [];

    for (const date of weekDates) {
      const dayOfWeek = date.getDay();
      const dayWindow = availability.find((a) => a.dayOfWeek === dayOfWeek);

      if (!dayWindow) continue;

      const availableMinutes = (dayWindow.endHour - dayWindow.startHour) * 60;
      const targetMinutes = Math.min(availableMinutes, dailyHours * 60);

      slots.push({
        date: toDateOnlyString(date),
        dayOfWeek,
        dayName: DAY_NAMES[dayOfWeek],
        startHour: dayWindow.startHour,
        endHour: dayWindow.startHour + targetMinutes / 60,
        totalAvailableMinutes: targetMinutes,
        usedMinutes: 0,
        remainingMinutes: targetMinutes,
        blocks: [],
      });
    }

    return slots;
  }

  /**
   * Allocate study blocks across available slots, weighted by subject priority.
   *
   * @param {Object[]} slots           Available time slots
   * @param {Object[]} priorities      Subject priorities (sorted desc)
   * @param {Object}   flashcardLoad   Flashcard review load
   * @param {number}   blockMinutes    Preferred block duration
   * @param {number}   dailyHours      Daily hours target
   * @returns {Object[]}               Updated slots with allocated blocks
   */
  allocateBlocks(slots, priorities, flashcardLoad, blockMinutes, dailyHours) {
    if (priorities.length === 0) return slots;

    // Compute total weekly minutes available
    const totalWeeklyMinutes = slots.reduce((s, slot) => s + slot.totalAvailableMinutes, 0);

    // Reserve time for flashcard review
    const flashcardMinutesReserved = Math.min(
      flashcardLoad.totalReviewMinutes,
      Math.floor(totalWeeklyMinutes * FLASHCARD_REVIEW_FRACTION)
    );

    const studyMinutesAvailable = totalWeeklyMinutes - flashcardMinutesReserved;

    // Distribute study minutes to subjects by priority
    const subjectAllocations = [];
    let allocatedTotal = 0;

    for (const priority of priorities) {
      const rawMinutes = Math.floor(studyMinutesAvailable * priority.priorityScore);
      const minutes = Math.max(MIN_BLOCK_DURATION_MINUTES, rawMinutes);
      const blocks = Math.max(1, Math.round(minutes / blockMinutes));

      subjectAllocations.push({
        subjectId: priority.subjectId,
        subjectName: priority.subjectName,
        totalMinutes: minutes,
        blockMinutes: Math.min(blockMinutes, minutes),
        blocksNeeded: blocks,
        blocksAllocated: 0,
      });

      allocatedTotal += minutes;
    }

    // If over-allocated, scale down proportionally
    if (allocatedTotal > studyMinutesAvailable) {
      const scale = studyMinutesAvailable / allocatedTotal;
      for (const alloc of subjectAllocations) {
        alloc.totalMinutes = Math.floor(alloc.totalMinutes * scale);
        alloc.blocksNeeded = Math.max(1, Math.round(alloc.totalMinutes / alloc.blockMinutes));
      }
    }

    // Round-robin distribute blocks across days, respecting daily limits
    const blockQueue = [];
    for (const alloc of subjectAllocations) {
      for (let i = 0; i < alloc.blocksNeeded; i++) {
        blockQueue.push({
          subjectId: alloc.subjectId,
          subjectName: alloc.subjectName,
          durationMinutes: alloc.blockMinutes,
          type: 'study',
        });
      }
    }

    // Add flashcard review blocks
    const flashcardSubjects = flashcardLoad.subjects || [];
    const flashcardBlocksNeeded = Math.ceil(flashcardMinutesReserved / blockMinutes);
    for (let i = 0; i < flashcardBlocksNeeded; i++) {
      const subject = flashcardSubjects[i % flashcardSubjects.length] || { subjectId: null, subjectName: 'General Review' };
      blockQueue.push({
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        durationMinutes: blockMinutes,
        type: 'flashcard_review',
        cardCount: subject.dueCards || 0,
      });
    }

    // Distribute blocks across days, max subjects per day
    let blockIdx = 0;
    const maxBlocksPerDay = Math.ceil(dailyHours * 60 / blockMinutes);

    for (const slot of slots) {
      if (blockIdx >= blockQueue.length) break;
      if (slot.blocks.length >= maxBlocksPerDay) continue;

      const daySubjects = new Set(slot.blocks.map((b) => b.subjectId));
      let placedToday = 0;

      while (
        blockIdx < blockQueue.length &&
        slot.remainingMinutes >= blockMinutes &&
        placedToday < MAX_SUBJECTS_PER_DAY * 2 &&
        slot.blocks.length < maxBlocksPerDay
      ) {
        const candidate = blockQueue[blockIdx];

        // Check if this subject is already at max for the day
        const subjectDayCount = slot.blocks.filter((b) => b.subjectId === candidate.subjectId).length;
        if (subjectDayCount >= 2) {
          // Try to find next non-duplicate block
          let found = false;
          for (let look = blockIdx + 1; look < blockQueue.length; look++) {
            if (blockQueue[look].subjectId !== candidate.subjectId) {
              // Swap
              [blockQueue[blockIdx], blockQueue[look]] = [blockQueue[look], blockQueue[blockIdx]];
              found = true;
              break;
            }
          }
          if (!found) break;
          continue;
        }

        // Compute start time for this block
        const lastBlock = slot.blocks[slot.blocks.length - 1];
        let startHour;
        if (lastBlock) {
          startHour = lastBlock.endHour;
        } else {
          startHour = slot.startHour;
        }
        const endHour = startHour + candidate.durationMinutes / 60;

        if (endHour > slot.endHour) break;

        const block = {
          id: uuidv4(),
          subjectId: candidate.subjectId,
          subjectName: candidate.subjectName,
          type: candidate.type,
          startHour: Number(startHour.toFixed(2)),
          endHour: Number(endHour.toFixed(2)),
          durationMinutes: candidate.durationMinutes,
          startTime: this._formatTime(startHour),
          endTime: this._formatTime(endHour),
          completed: false,
          cardCount: candidate.cardCount || 0,
        };

        slot.blocks.push(block);
        slot.usedMinutes += candidate.durationMinutes;
        slot.remainingMinutes -= candidate.durationMinutes;
        placedToday++;
        blockIdx++;

        // Update subject allocation counters
        const alloc = subjectAllocations.find((a) => a.subjectId === candidate.subjectId);
        if (alloc) {
          alloc.blocksAllocated++;
        }
      }
    }

    // Any remaining blocks go to overflow
    const overflowBlocks = blockQueue.slice(blockIdx);

    // Update subject allocations on the priorities array
    for (const priority of priorities) {
      const alloc = subjectAllocations.find((a) => a.subjectId === priority.subjectId);
      if (alloc) {
        priority.allocatedMinutes = alloc.totalMinutes;
        priority.allocatedBlocks = alloc.blocksAllocated;
      }
    }

    return {
      slots,
      overflow: overflowBlocks,
      subjectAllocations,
    };
  }

  /**
   * Compute summary statistics for the generated schedule.
   */
  computeScheduleSummary(scheduleData, priorities) {
    const { slots, overflow = [] } = scheduleData;

    let totalStudyMinutes = 0;
    let totalFlashcardMinutes = 0;
    let totalBlocks = 0;
    let daysWithStudy = 0;

    for (const slot of (slots || [])) {
      if (slot.blocks.length > 0) {
        daysWithStudy++;
        for (const block of slot.blocks) {
          totalBlocks++;
          if (block.type === 'flashcard_review') {
            totalFlashcardMinutes += block.durationMinutes;
          } else {
            totalStudyMinutes += block.durationMinutes;
          }
        }
      }
    }

    return {
      totalStudyMinutes,
      totalStudyHours: Number((totalStudyMinutes / 60).toFixed(1)),
      totalFlashcardMinutes,
      totalFlashcardHours: Number((totalFlashcardMinutes / 60).toFixed(1)),
      totalBlocks,
      daysWithStudy,
      overflowBlockCount: overflow.length,
      subjectBreakdown: priorities.map((p) => ({
        subjectName: p.subjectName,
        allocatedMinutes: p.allocatedMinutes,
        allocatedBlocks: p.allocatedBlocks,
        priorityShare: p.priorityScore,
      })),
    };
  }

  /**
   * Detect scheduling conflicts in an existing schedule.
   *
   * @param {Object[]} blocks  Array of time blocks
   * @returns {Object[]}       Array of conflict descriptors
   */
  detectConflicts(blocks) {
    const conflicts = [];

    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const a = blocks[i];
        const b = blocks[j];

        if (a.date !== b.date) continue;

        // Check time overlap
        if (a.startHour < b.endHour && b.startHour < a.endHour) {
          conflicts.push({
            type: 'time_overlap',
            blockA: a.id,
            blockB: b.id,
            subjectA: a.subjectName,
            subjectB: b.subjectName,
            overlapMinutes: Math.round(
              (Math.min(a.endHour, b.endHour) - Math.max(a.startHour, b.startHour)) * 60
            ),
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Reschedule a specific block to a new time slot.
   *
   * @param {Object}   currentSchedule  Current schedule object
   * @param {string}   blockId          Block ID to move
   * @param {string}   newDate          New date (YYYY-MM-DD)
   * @param {number}   newStartHour     New start hour (decimal)
   * @returns {Object}                  Updated schedule + any conflicts
   */
  rescheduleBlock(currentSchedule, blockId, newDate, newStartHour) {
    const { slots } = currentSchedule;
    let movedBlock = null;
    let sourceSlot = null;

    // Find and remove from source slot
    for (const slot of slots) {
      const idx = slot.blocks.findIndex((b) => b.id === blockId);
      if (idx !== -1) {
        movedBlock = { ...slot.blocks[idx] };
        slot.blocks.splice(idx, 1);
        slot.usedMinutes -= movedBlock.durationMinutes;
        slot.remainingMinutes += movedBlock.durationMinutes;
        sourceSlot = slot;
        break;
      }
    }

    if (!movedBlock) {
      return { success: false, error: 'Block not found', schedule: currentSchedule };
    }

    // Find target slot
    const targetSlot = slots.find((s) => s.date === newDate);
    if (!targetSlot) {
      // Put it back
      if (sourceSlot) {
        sourceSlot.blocks.push(movedBlock);
        sourceSlot.usedMinutes += movedBlock.durationMinutes;
        sourceSlot.remainingMinutes -= movedBlock.durationMinutes;
      }
      return { success: false, error: 'No available slot for target date', schedule: currentSchedule };
    }

    // Check capacity
    if (targetSlot.remainingMinutes < movedBlock.durationMinutes) {
      // Put it back
      if (sourceSlot) {
        sourceSlot.blocks.push(movedBlock);
        sourceSlot.usedMinutes += movedBlock.durationMinutes;
        sourceSlot.remainingMinutes -= movedBlock.durationMinutes;
      }
      return { success: false, error: 'Insufficient time in target slot', schedule: currentSchedule };
    }

    // Place in target slot
    const endHour = newStartHour + movedBlock.durationMinutes / 60;
    movedBlock.startHour = Number(newStartHour.toFixed(2));
    movedBlock.endHour = Number(endHour.toFixed(2));
    movedBlock.startTime = this._formatTime(newStartHour);
    movedBlock.endTime = this._formatTime(endHour);

    targetSlot.blocks.push(movedBlock);
    targetSlot.blocks.sort((a, b) => a.startHour - b.startHour);
    targetSlot.usedMinutes += movedBlock.durationMinutes;
    targetSlot.remainingMinutes -= movedBlock.durationMinutes;

    // Detect any conflicts
    const allBlocks = slots.flatMap((s) => s.blocks.map((b) => ({ ...b, date: s.date })));
    const conflicts = this.detectConflicts(allBlocks);

    return {
      success: true,
      schedule: currentSchedule,
      movedBlock,
      conflicts,
    };
  }

  /**
   * Get schedule adherence report: compare planned vs actual study sessions.
   *
   * @param {string} userId
   * @param {string} weekStartStr  YYYY-MM-DD of the planned week
   * @param {Object} plannedSchedule  The generated schedule object
   * @returns {Promise<Object>}
   */
  async getScheduleAdherence(userId, weekStartStr, plannedSchedule) {
    const weekStart = new Date(`${weekStartStr}T00:00:00`);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Get actual focus sessions in the week
    const actualSessions = await FocusSession.findAll({
      where: {
        user: userId,
        createdAt: { [Op.gte]: weekStart, [Op.lt]: weekEnd },
      },
      attributes: ['id', 'subject', 'activeSeconds', 'createdAt', 'focusScore'],
    });

    // Map planned blocks by date
    const plannedByDate = {};
    for (const slot of (plannedSchedule?.slots || [])) {
      plannedByDate[slot.date] = {
        plannedMinutes: slot.usedMinutes,
        blocks: slot.blocks,
      };
    }

    // Map actual sessions by date
    const actualByDate = {};
    for (const session of actualSessions) {
      const dateStr = toDateOnlyString(session.createdAt);
      if (!actualByDate[dateStr]) {
        actualByDate[dateStr] = { totalMinutes: 0, sessions: [] };
      }
      actualByDate[dateStr].totalMinutes += Math.round(session.activeSeconds / 60);
      actualByDate[dateStr].sessions.push(session);
    }

    // Compute daily adherence
    const dailyAdherence = [];
    let totalPlannedMinutes = 0;
    let totalActualMinutes = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = toDateOnlyString(date);
      const dayName = DAY_NAMES[date.getDay()];

      const planned = plannedByDate[dateStr] || { plannedMinutes: 0, blocks: [] };
      const actual = actualByDate[dateStr] || { totalMinutes: 0, sessions: [] };

      const adherenceRate = planned.plannedMinutes > 0
        ? Math.min(100, Math.round((actual.totalMinutes / planned.plannedMinutes) * 100))
        : actual.totalMinutes > 0 ? 100 : 0;

      totalPlannedMinutes += planned.plannedMinutes;
      totalActualMinutes += actual.totalMinutes;

      dailyAdherence.push({
        date: dateStr,
        dayName,
        plannedMinutes: planned.plannedMinutes,
        actualMinutes: actual.totalMinutes,
        adherenceRate,
        blocksPlanned: planned.blocks.length,
        sessionsCompleted: actual.sessions.length,
      });
    }

    const overallAdherence = totalPlannedMinutes > 0
      ? Math.round((totalActualMinutes / totalPlannedMinutes) * 100)
      : 0;

    return {
      weekStart: weekStartStr,
      totalPlannedMinutes,
      totalActualMinutes,
      totalPlannedHours: Number((totalPlannedMinutes / 60).toFixed(1)),
      totalActualHours: Number((totalActualMinutes / 60).toFixed(1)),
      overallAdherence,
      dailyAdherence,
      insight: this._generateAdherenceInsight(overallAdherence, dailyAdherence),
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  _computePriorityScore({ masteryGap, weakTopicDensity, hasNoData, topicCount, flashcardCount }) {
    // Weight components
    const MASTERY_WEIGHT = 0.40;
    const WEAK_TOPIC_WEIGHT = 0.25;
    const NO_DATA_WEIGHT = 0.20;
    const COVERAGE_WEIGHT = 0.15;

    let score = 0;

    // Mastery gap (higher gap = higher priority)
    score += masteryGap * MASTERY_WEIGHT;

    // Weak topic density
    score += weakTopicDensity * WEAK_TOPIC_WEIGHT;

    // No data bonus: subjects with no quiz data get a boost
    if (hasNoData) {
      score += NO_DATA_WEIGHT;
    }

    // Coverage: subjects with more topics but fewer flashcards get a boost
    const coverageRatio = topicCount > 0 ? 1 - Math.min(flashcardCount / (topicCount * 2), 1) : 0.5;
    score += coverageRatio * COVERAGE_WEIGHT;

    // Clamp to [MIN_PRIORITY_SCORE, MAX_PRIORITY_SCORE]
    return Math.max(MIN_PRIORITY_SCORE, Math.min(MAX_PRIORITY_SCORE, Number(score.toFixed(4))));
  }

  _generateRationale({ subjectName, masteryGap, avgScore, weakTopicDensity, trend, topicCount, flashcardCount, hasNoData }) {
    const parts = [];

    if (hasNoData) {
      parts.push(`${subjectName} has no quiz data yet — start building a baseline`);
    } else {
      if (masteryGap > 0.5) {
        parts.push(`Low mastery (${avgScore}% avg) — needs focused review`);
      } else if (masteryGap > 0.3) {
        parts.push(`Moderate mastery (${avgScore}% avg) — room for improvement`);
      } else {
        parts.push(`Strong mastery (${avgScore}% avg) — maintain with periodic review`);
      }

      if (weakTopicDensity > 0.5) {
        parts.push(`${Math.round(weakTopicDensity * 100)}% of topics are weak`);
      }

      if (trend === 'declining') {
        parts.push('scores are trending down — intervene now');
      } else if (trend === 'improving') {
        parts.push('scores are improving — keep the momentum');
      }
    }

    if (flashcardCount === 0 && topicCount > 0) {
      parts.push('no flashcards created — consider adding them');
    }

    return parts.join('. ');
  }

  _formatTime(decimalHour) {
    const hours = Math.floor(decimalHour);
    const minutes = Math.round((decimalHour - hours) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  getNextMonday() {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 1 : 8 - day; // Days until next Monday
    const next = new Date(now);
    next.setDate(next.getDate() + diff);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  getWeekDates(startDate) {
    const dates = [];
    // Start from Sunday (day 0) to Saturday (day 6)
    const sunday = new Date(startDate);
    sunday.setDate(sunday.getDate() - sunday.getDay()); // Go back to Sunday

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  }

  _generateAdherenceInsight(overall, dailyAdherence) {
    if (overall >= 90) return 'Excellent adherence! You followed your schedule almost perfectly this week.';
    if (overall >= 70) return 'Good adherence. You completed most of your planned study time.';
    if (overall >= 50) return 'Moderate adherence. Consider reducing daily targets to improve consistency.';
    if (overall >= 20) return 'Low adherence. Your schedule may be too ambitious — try shorter blocks.';
    if (dailyAdherence.some((d) => d.actualMinutes > 0)) {
      return 'Very low adherence. You studied some days but missed most planned sessions.';
    }
    return 'No study sessions recorded this week. Start small — even 15 minutes counts.';
  }
}

module.exports = new StudyGoalSchedulerService();
