const { expect, describe, it, vi, beforeEach } = require('vitest');

/**
 * Unit tests for StudyGoalSchedulerService.
 *
 * Models are mocked via vi.mock at the top and the service is re-required
 * after the mocks are in place so every query hits the fake layer.
 */

vi.mock('../../models/Subject', () => ({ default: { findAll: vi.fn() } }));
vi.mock('../../models/Topic', () => ({
  default: {
    count: vi.fn(),
    findAll: vi.fn(),
  },
}));
vi.mock('../../models/QuizAttempt', () => ({ default: { findAll: vi.fn() } }));
vi.mock('../../models/Quiz', () => ({ default: {} }));
vi.mock('../../models/Flashcard', () => ({ default: { count: vi.fn() } }));
vi.mock('../../models/StudyPlan', () => ({ default: { findAll: vi.fn() } }));
vi.mock('../../models/FocusSession', () => ({ default: { findAll: vi.fn() } }));
vi.mock('../../models/User', () => ({ default: { findByPk: vi.fn() } }));
vi.mock('../../config/db', () => ({ sequelize: {} }));

const Subject = require('../../models/Subject').default;
const Topic = require('../../models/Topic').default;
const QuizAttempt = require('../../models/QuizAttempt').default;
const Flashcard = require('../../models/Flashcard').default;
const FocusSession = require('../../models/FocusSession').default;

const studyGoalSchedulerService = require('../../services/studyGoalSchedulerService');

// ── Helpers ────────────────────────────────────────────────────────────────

function makeDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(12, 0, 0, 0);
  return d;
}

function mockSubject(id, name, exam = 'e-1') {
  return { id, name, exam, user: 'user-1' };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('StudyGoalSchedulerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('computeSubjectPriorities', () => {
    it('returns empty array when no subjects exist', async () => {
      Subject.findAll.mockResolvedValue([]);
      const result = await studyGoalSchedulerService.computeSubjectPriorities('user-1');
      expect(result).toEqual([]);
    });

    it('assigns highest priority to subject with lowest mastery', async () => {
      Subject.findAll.mockResolvedValue([
        mockSubject('s-1', 'Physics'),
        mockSubject('s-2', 'Chemistry'),
      ]);

      // Physics: 30% avg (low mastery)
      QuizAttempt.findAll
        .mockResolvedValueOnce([
          { score: 30, createdAt: makeDate(5) },
          { score: 35, createdAt: makeDate(2) },
        ])
        // Chemistry: 85% avg (high mastery)
        .mockResolvedValueOnce([
          { score: 80, createdAt: makeDate(5) },
          { score: 90, createdAt: makeDate(2) },
        ]);

      Topic.count.mockResolvedValue(5);
      Topic.findAll.mockResolvedValue([
        { id: 't-1' }, { id: 't-2' }, { id: 't-3' }, { id: 't-4' }, { id: 't-5' },
      ]);
      Flashcard.count.mockResolvedValue(3);

      // Quiz attempts for topic-level analysis
      QuizAttempt.findAll
        .mockResolvedValueOnce([
          { score: 30, createdAt: makeDate(5), quizRef: { topic: 't-1' } },
          { score: 35, createdAt: makeDate(2), quizRef: { topic: 't-2' } },
        ])
        .mockResolvedValueOnce([
          { score: 80, createdAt: makeDate(5), quizRef: { topic: 't-1' } },
          { score: 90, createdAt: makeDate(2), quizRef: { topic: 't-2' } },
        ]);

      const result = await studyGoalSchedulerService.computeSubjectPriorities('user-1');

      expect(result.length).toBe(2);
      expect(result[0].subjectName).toBe('Physics');
      expect(result[0].priorityScore).toBeGreaterThan(result[1].priorityScore);
      expect(result[0].masteryGap).toBeGreaterThan(result[1].masteryGap);
    });

    it('gives priority boost to subjects with no quiz data', async () => {
      Subject.findAll.mockResolvedValue([
        mockSubject('s-1', 'Biology'),
      ]);

      // No attempts
      QuizAttempt.findAll.mockResolvedValue([]);
      Topic.count.mockResolvedValue(5);
      Topic.findAll.mockResolvedValue([{ id: 't-1' }]);
      Flashcard.count.mockResolvedValue(0);

      const result = await studyGoalSchedulerService.computeSubjectPriorities('user-1');

      expect(result[0].hasNoData).toBe(true);
      expect(result[0].rationale).toContain('no quiz data');
    });

    it('detects declining trend correctly', async () => {
      Subject.findAll.mockResolvedValue([mockSubject('s-1', 'Math')]);

      // Recent attempts are lower than prior
      QuizAttempt.findAll
        .mockResolvedValueOnce([
          { score: 90, createdAt: makeDate(20) },
          { score: 85, createdAt: makeDate(18) },
          { score: 80, createdAt: makeDate(16) },
          { score: 60, createdAt: makeDate(3) },
          { score: 55, createdAt: makeDate(2) },
          { score: 50, createdAt: makeDate(1) },
        ]);

      Topic.count.mockResolvedValue(3);
      Topic.findAll.mockResolvedValue([{ id: 't-1' }]);
      Flashcard.count.mockResolvedValue(5);

      const result = await studyGoalSchedulerService.computeSubjectPriorities('user-1');

      expect(result[0].trend).toBe('declining');
      expect(result[0].rationale).toContain('trending down');
    });

    it('normalizes priority scores to sum to 1', async () => {
      Subject.findAll.mockResolvedValue([
        mockSubject('s-1', 'Math'),
        mockSubject('s-2', 'Physics'),
        mockSubject('s-3', 'Chemistry'),
      ]);

      QuizAttempt.findAll.mockResolvedValue([]);
      Topic.count.mockResolvedValue(3);
      Topic.findAll.mockResolvedValue([{ id: 't-1' }]);
      Flashcard.count.mockResolvedValue(0);

      const result = await studyGoalSchedulerService.computeSubjectPriorities('user-1');

      const total = result.reduce((s, p) => s + p.priorityScore, 0);
      expect(total).toBeCloseTo(1.0, 3);
    });
  });

  describe('computeFlashcardReviewLoad', () => {
    it('returns zero load when no flashcards exist', async () => {
      Subject.findAll.mockResolvedValue([mockSubject('s-1', 'Math')]);
      Flashcard.count.mockResolvedValue(0);

      const result = await studyGoalSchedulerService.computeFlashcardReviewLoad('user-1');

      expect(result.totalReviewMinutes).toBe(0);
      expect(result.subjects).toHaveLength(0);
    });

    it('computes review time for due and overdue cards', async () => {
      Subject.findAll.mockResolvedValue([mockSubject('s-1', 'Biology')]);

      // First call: due cards, second call: overdue cards
      Flashcard.count
        .mockResolvedValueOnce(20) // due
        .mockResolvedValueOnce(5);  // overdue

      const result = await studyGoalSchedulerService.computeFlashcardReviewLoad('user-1');

      expect(result.totalReviewMinutes).toBe(14); // ceil(20*0.5 + 5*0.75) = ceil(13.75) = 14
      expect(result.subjects[0].dueCards).toBe(20);
      expect(result.subjects[0].overdueCards).toBe(5);
    });
  });

  describe('buildAvailableSlots', () => {
    it('creates slots for each day with availability', () => {
      // Create a Monday-Friday of a known week
      const monday = new Date('2026-08-31T00:00:00');
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        weekDates.push(d);
      }

      const availability = [
        { dayOfWeek: 1, startHour: 9, endHour: 17 },
        { dayOfWeek: 2, startHour: 9, endHour: 17 },
        { dayOfWeek: 3, startHour: 9, endHour: 17 },
        { dayOfWeek: 4, startHour: 9, endHour: 17 },
        { dayOfWeek: 5, startHour: 9, endHour: 15 },
      ];

      const slots = studyGoalSchedulerService.buildAvailableSlots(weekDates, availability, 4);

      // Should have 5 slots (Mon-Fri)
      expect(slots.length).toBe(5);
      expect(slots[0].dayName).toBe('Monday');
      expect(slots[0].totalAvailableMinutes).toBe(240); // 4 hours
      expect(slots[4].totalAvailableMinutes).toBe(240); // Capped by dailyHours=4
    });

    it('returns empty when no availability matches', () => {
      const monday = new Date('2026-08-31T00:00:00');
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        weekDates.push(d);
      }

      const slots = studyGoalSchedulerService.buildAvailableSlots(weekDates, [], 3);
      expect(slots).toEqual([]);
    });
  });

  describe('allocateBlocks', () => {
    it('distributes blocks across days by priority', () => {
      const slots = [
        { date: '2026-08-31', dayOfWeek: 1, dayName: 'Monday', startHour: 9, endHour: 17, totalAvailableMinutes: 480, usedMinutes: 0, remainingMinutes: 480, blocks: [] },
        { date: '2026-09-01', dayOfWeek: 2, dayName: 'Tuesday', startHour: 9, endHour: 17, totalAvailableMinutes: 480, usedMinutes: 0, remainingMinutes: 480, blocks: [] },
      ];

      const priorities = [
        { subjectId: 's-1', subjectName: 'Math', priorityScore: 0.7, allocatedMinutes: 0, allocatedBlocks: 0 },
        { subjectId: 's-2', subjectName: 'Physics', priorityScore: 0.3, allocatedMinutes: 0, allocatedBlocks: 0 },
      ];

      const flashcardLoad = { totalReviewMinutes: 30, subjects: [{ subjectId: 's-1', subjectName: 'Math', dueCards: 10 }] };

      const result = studyGoalSchedulerService.allocateBlocks(slots, priorities, flashcardLoad, 45, 3);

      // Should have blocks allocated
      expect(result.slots[0].blocks.length).toBeGreaterThan(0);
      expect(result.slots[0].usedMinutes).toBeGreaterThan(0);
    });

    it('handles empty priorities gracefully', () => {
      const slots = [
        { date: '2026-08-31', startHour: 9, endHour: 17, totalAvailableMinutes: 480, usedMinutes: 0, remainingMinutes: 480, blocks: [] },
      ];

      const result = studyGoalSchedulerService.allocateBlocks(slots, [], { totalReviewMinutes: 0, subjects: [] }, 45, 3);

      expect(result.slots[0].blocks).toEqual([]);
    });

    it('includes flashcard review blocks', () => {
      const slots = [
        { date: '2026-08-31', dayOfWeek: 1, dayName: 'Monday', startHour: 9, endHour: 17, totalAvailableMinutes: 480, usedMinutes: 0, remainingMinutes: 480, blocks: [] },
      ];

      const priorities = [
        { subjectId: 's-1', subjectName: 'Math', priorityScore: 1.0, allocatedMinutes: 0, allocatedBlocks: 0 },
      ];

      const flashcardLoad = {
        totalReviewMinutes: 60,
        subjects: [{ subjectId: 's-1', subjectName: 'Math', dueCards: 20 }],
      };

      const result = studyGoalSchedulerService.allocateBlocks(slots, priorities, flashcardLoad, 45, 3);

      const reviewBlocks = result.slots[0].blocks.filter((b) => b.type === 'flashcard_review');
      expect(reviewBlocks.length).toBeGreaterThan(0);
    });
  });

  describe('detectConflicts', () => {
    it('detects overlapping blocks on the same day', () => {
      const blocks = [
        { id: 'b-1', date: '2026-08-31', startHour: 9, endHour: 9.75, subjectName: 'Math' },
        { id: 'b-2', date: '2026-08-31', startHour: 9.5, endHour: 10.25, subjectName: 'Physics' },
      ];

      const conflicts = studyGoalSchedulerService.detectConflicts(blocks);

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe('time_overlap');
      expect(conflicts[0].subjectA).toBe('Math');
      expect(conflicts[0].subjectB).toBe('Physics');
    });

    it('returns empty when no overlaps exist', () => {
      const blocks = [
        { id: 'b-1', date: '2026-08-31', startHour: 9, endHour: 9.75, subjectName: 'Math' },
        { id: 'b-2', date: '2026-08-31', startHour: 10, endHour: 10.75, subjectName: 'Physics' },
      ];

      const conflicts = studyGoalSchedulerService.detectConflicts(blocks);
      expect(conflicts).toEqual([]);
    });

    it('ignores blocks on different days', () => {
      const blocks = [
        { id: 'b-1', date: '2026-08-31', startHour: 9, endHour: 10, subjectName: 'Math' },
        { id: 'b-2', date: '2026-09-01', startHour: 9, endHour: 10, subjectName: 'Math' },
      ];

      const conflicts = studyGoalSchedulerService.detectConflicts(blocks);
      expect(conflicts).toEqual([]);
    });
  });

  describe('rescheduleBlock', () => {
    it('moves a block to a new date successfully', () => {
      const schedule = {
        weekStart: '2026-08-31',
        slots: [
          {
            date: '2026-08-31', startHour: 9, endHour: 17,
            totalAvailableMinutes: 480, usedMinutes: 45, remainingMinutes: 435,
            blocks: [
              { id: 'b-1', subjectName: 'Math', startHour: 9, endHour: 9.75, durationMinutes: 45 },
            ],
          },
          {
            date: '2026-09-01', startHour: 9, endHour: 17,
            totalAvailableMinutes: 480, usedMinutes: 0, remainingMinutes: 480,
            blocks: [],
          },
        ],
      };

      const result = studyGoalSchedulerService.rescheduleBlock(schedule, 'b-1', '2026-09-01', 10);

      expect(result.success).toBe(true);
      expect(result.movedBlock).toBeDefined();
      expect(result.movedBlock.startHour).toBe(10);
      // Source slot should be empty
      expect(schedule.slots[0].blocks).toHaveLength(0);
      // Target slot should have the block
      expect(schedule.slots[1].blocks).toHaveLength(1);
    });

    it('returns error when block not found', () => {
      const schedule = { weekStart: '2026-08-31', slots: [{ date: '2026-08-31', blocks: [] }] };
      const result = studyGoalSchedulerService.rescheduleBlock(schedule, 'nonexistent', '2026-09-01', 10);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('returns error when target slot has insufficient time', () => {
      const schedule = {
        weekStart: '2026-08-31',
        slots: [
          {
            date: '2026-08-31', startHour: 9, endHour: 17,
            totalAvailableMinutes: 480, usedMinutes: 45, remainingMinutes: 435,
            blocks: [
              { id: 'b-1', subjectName: 'Math', startHour: 9, endHour: 9.75, durationMinutes: 45 },
            ],
          },
          {
            date: '2026-09-01', startHour: 9, endHour: 17,
            totalAvailableMinutes: 480, usedMinutes: 470, remainingMinutes: 10,
            blocks: [],
          },
        ],
      };

      const result = studyGoalSchedulerService.rescheduleBlock(schedule, 'b-1', '2026-09-01', 14);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient time');
      // Block should be back in source
      expect(schedule.slots[0].blocks).toHaveLength(1);
    });

    it('detects conflicts after rescheduling', () => {
      const schedule = {
        weekStart: '2026-08-31',
        slots: [
          {
            date: '2026-08-31', startHour: 9, endHour: 17,
            totalAvailableMinutes: 480, usedMinutes: 45, remainingMinutes: 435,
            blocks: [
              { id: 'b-1', subjectName: 'Math', startHour: 9, endHour: 9.75, durationMinutes: 45 },
            ],
          },
          {
            date: '2026-09-01', startHour: 9, endHour: 17,
            totalAvailableMinutes: 480, usedMinutes: 45, remainingMinutes: 435,
            blocks: [
              { id: 'b-2', subjectName: 'Physics', startHour: 10, endHour: 10.75, durationMinutes: 45 },
            ],
          },
        ],
      };

      // Move b-1 to overlap with b-2
      const result = studyGoalSchedulerService.rescheduleBlock(schedule, 'b-1', '2026-09-01', 10.25);

      expect(result.success).toBe(true);
      expect(result.conflicts.length).toBeGreaterThan(0);
    });
  });

  describe('computeScheduleSummary', () => {
    it('computes correct totals', () => {
      const scheduleData = {
        slots: [
          {
            date: '2026-08-31',
            blocks: [
              { type: 'study', durationMinutes: 45 },
              { type: 'flashcard_review', durationMinutes: 30 },
            ],
          },
          {
            date: '2026-09-01',
            blocks: [
              { type: 'study', durationMinutes: 45 },
            ],
          },
        ],
        overflow: [{ subjectName: 'Math' }],
      };

      const priorities = [
        { subjectName: 'Math', allocatedMinutes: 90, allocatedBlocks: 2, priorityScore: 0.6 },
        { subjectName: 'Physics', allocatedMinutes: 60, allocatedBlocks: 1, priorityScore: 0.4 },
      ];

      const summary = studyGoalSchedulerService.computeScheduleSummary(scheduleData, priorities);

      expect(summary.totalStudyMinutes).toBe(90);
      expect(summary.totalFlashcardMinutes).toBe(30);
      expect(summary.totalBlocks).toBe(3);
      expect(summary.daysWithStudy).toBe(2);
      expect(summary.overflowBlockCount).toBe(1);
      expect(summary.subjectBreakdown).toHaveLength(2);
    });

    it('handles empty schedule', () => {
      const summary = studyGoalSchedulerService.computeScheduleSummary(
        { slots: [], overflow: [] },
        []
      );
      expect(summary.totalStudyMinutes).toBe(0);
      expect(summary.totalBlocks).toBe(0);
    });
  });

  describe('generateWeeklySchedule', () => {
    it('produces a full schedule object with all required fields', async () => {
      Subject.findAll.mockResolvedValue([mockSubject('s-1', 'Math')]);
      QuizAttempt.findAll.mockResolvedValue([{ score: 60, createdAt: makeDate(5) }]);
      Topic.count.mockResolvedValue(5);
      Topic.findAll.mockResolvedValue([{ id: 't-1' }]);
      Flashcard.count.mockResolvedValue(10);

      // For subject priority topic analysis
      QuizAttempt.findAll
        .mockResolvedValueOnce([{ score: 60, createdAt: makeDate(5) }])
        .mockResolvedValueOnce([{ score: 60, createdAt: makeDate(5), quizRef: { topic: 't-1' } }]);

      // For flashcard load
      Flashcard.count
        .mockResolvedValueOnce(10) // due
        .mockResolvedValueOnce(2);  // overdue

      const result = await studyGoalSchedulerService.generateWeeklySchedule('user-1', {
        weekStartDate: new Date('2026-08-31'),
        dailyHours: 2,
      });

      expect(result.userId).toBe('user-1');
      expect(result.weekStart).toBe('2026-08-31');
      expect(result.schedule).toBeDefined();
      expect(result.subjectPriorities).toBeDefined();
      expect(result.flashcardReview).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.generatedAt).toBeDefined();
    });
  });

  describe('Private helper methods', () => {
    it('_formatTime converts decimal hours to 12-hour format', () => {
      expect(studyGoalSchedulerService._formatTime(9)).toBe('9:00 AM');
      expect(studyGoalSchedulerService._formatTime(13.5)).toBe('1:30 PM');
      expect(studyGoalSchedulerService._formatTime(0)).toBe('12:00 AM');
      expect(studyGoalSchedulerService._formatTime(12)).toBe('12:00 PM');
      expect(studyGoalSchedulerService._formatTime(23.75)).toBe('11:45 PM');
    });

    it('getNextMonday returns the next Monday', () => {
      const next = studyGoalSchedulerService.getNextMonday();
      expect(next.getDay()).toBe(1); // Monday
    });

    it('getWeekDates returns 7 dates starting from Sunday', () => {
      const monday = new Date('2026-08-31T00:00:00');
      const dates = studyGoalSchedulerService.getWeekDates(monday);
      expect(dates).toHaveLength(7);
      expect(dates[0].getDay()).toBe(0); // Sunday
      expect(dates[1].getDay()).toBe(1); // Monday
      expect(dates[6].getDay()).toBe(6); // Saturday
    });

    it('_computePriorityScore weights mastery gap highest', () => {
      const highGap = studyGoalSchedulerService._computePriorityScore({
        masteryGap: 0.9, weakTopicDensity: 0.1, hasNoData: false, topicCount: 5, flashcardCount: 5,
      });
      const lowGap = studyGoalSchedulerService._computePriorityScore({
        masteryGap: 0.1, weakTopicDensity: 0.1, hasNoData: false, topicCount: 5, flashcardCount: 5,
      });
      expect(highGap).toBeGreaterThan(lowGap);
    });

    it('_generateAdherenceInsight returns appropriate messages', () => {
      expect(studyGoalSchedulerService._generateAdherenceInsight(95, [])).toContain('Excellent');
      expect(studyGoalSchedulerService._generateAdherenceInsight(75, [])).toContain('Good');
      expect(studyGoalSchedulerService._generateAdherenceInsight(30, [])).toContain('Low');
      expect(studyGoalSchedulerService._generateAdherenceInsight(0, [])).toContain('No study');
    });

    it('_generateRationale produces descriptive text', () => {
      const rationale = studyGoalSchedulerService._generateRationale({
        subjectName: 'Physics',
        masteryGap: 0.6,
        avgScore: 40,
        weakTopicDensity: 0.7,
        trend: 'declining',
        topicCount: 10,
        flashcardCount: 2,
        hasNoData: false,
      });

      expect(rationale).toContain('Physics');
      expect(rationale).toContain('Low mastery');
      expect(rationale).toContain('trending down');
    });
  });
});
