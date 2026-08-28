const { describe, it, expect, vi, beforeEach } = require('vitest');

// ── Mocks ────────────────────────────────────────────────────────────────

const mockSequelize = {
  define: vi.fn(() => ({})),
  authenticate: vi.fn(),
};

const mockRevisionSchedule = {
  create: vi.fn(),
  findOne: vi.fn(),
  findAll: vi.fn(),
  findAndCountAll: vi.fn(),
  findByPk: vi.fn(),
  update: vi.fn(),
  destroy: vi.fn(),
};

const mockRevisionSlot = {
  create: vi.fn(),
  bulkCreate: vi.fn(),
  findOne: vi.fn(),
  findAll: vi.fn(),
  count: vi.fn(),
  update: vi.fn(),
  destroy: vi.fn(),
};

const mockSubject = { findAll: vi.fn() };
const mockTopic = { findAll: vi.fn() };
const mockQuizAttempt = { findAll: vi.fn(), count: vi.fn() };
const mockQuiz = { findAll: vi.fn() };
const mockFlashcard = { findAll: vi.fn() };
const mockProgress = { findAll: vi.fn() };

vi.mock('../config/db', () => ({ sequelize: mockSequelize }));
vi.mock('../models/RevisionSchedule', () => ({ default: mockRevisionSchedule, ...mockRevisionSchedule }));
vi.mock('../models/RevisionSlot', () => ({ default: mockRevisionSlot, ...mockRevisionSlot }));
vi.mock('../models/Subject', () => ({ default: mockSubject, ...mockSubject }));
vi.mock('../models/Topic', () => ({ default: mockTopic, ...mockTopic }));
vi.mock('../models/QuizAttempt', () => ({ default: mockQuizAttempt, ...mockQuizAttempt }));
vi.mock('../models/Quiz', () => ({ default: mockQuiz, ...mockQuiz }));
vi.mock('../models/Flashcard', () => ({ default: mockFlashcard, ...mockFlashcard }));
vi.mock('../models/Progress', () => ({ default: mockProgress, ...mockProgress }));
vi.mock('../models/StudyPlan', () => ({ default: { findOne: vi.fn() }, findOne: vi.fn() }));
vi.mock('../models/ActivityLog', () => ({ default: { create: vi.fn() } }));

// Mock readiness calculator
vi.mock('../services/readinessCalculator', () => ({
  calculateSubjectReadiness: vi.fn().mockResolvedValue({
    readinessScore: 60,
    syllabusCoverage: 70,
    quizAccuracy: 55,
    memoryRetention: 65,
    studyVelocity: 50,
  }),
}));

const revisionSchedulerService = require('../services/revisionSchedulerService');

// ── Test Data ────────────────────────────────────────────────────────────

const userId = 'user-123';

const mockSubjects = [
  { id: 'sub-1', name: 'Organic Chemistry' },
  { id: 'sub-2', name: 'Physical Chemistry' },
];

const mockTopics = [
  { id: 'topic-1', name: 'Reactions', subject: 'sub-1' },
  { id: 'topic-2', name: 'Mechanisms', subject: 'sub-1' },
  { id: 'topic-3', name: 'Thermodynamics', subject: 'sub-2' },
];

const mockProgresses = [
  { topic: 'topic-1', completionPercentage: 80 },
  { topic: 'topic-3', completionPercentage: 30 },
];

const mockSchedule = {
  id: 'schedule-789',
  user: userId,
  title: 'Revision Plan — 14 days to exam',
  examDate: '2026-09-10',
  startDate: '2026-08-27',
  dailyStudyHours: 3,
  status: 'active',
  totalSlots: 0,
  completedSlots: 0,
  overallProgress: 0,
  averageReadinessAtStart: 60,
  currentReadiness: 60,
  subjectWeights: {},
  metadata: {},
  save: vi.fn().mockResolvedValue(true),
};

// ── Tests ────────────────────────────────────────────────────────────────

describe('revisionSchedulerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSchedule', () => {
    it('should generate a schedule with slots', async () => {
      mockSubject.findAll.mockResolvedValue(mockSubjects);
      mockTopic.findAll.mockResolvedValue(mockTopics);
      mockProgress.findAll.mockResolvedValue(mockProgresses);
      mockRevisionSchedule.create.mockResolvedValue({ ...mockSchedule, save: vi.fn().mockResolvedValue(true) });
      mockRevisionSlot.bulkCreate.mockResolvedValue([]);

      const result = await revisionSchedulerService.generateSchedule(userId, {
        examDate: '2026-09-10',
        dailyStudyHours: 3,
      });

      expect(mockRevisionSchedule.create).toHaveBeenCalled();
      expect(mockRevisionSlot.bulkCreate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error when no subjects exist', async () => {
      mockSubject.findAll.mockResolvedValue([]);

      await expect(
        revisionSchedulerService.generateSchedule(userId, {
          examDate: '2026-09-10',
          dailyStudyHours: 3,
        })
      ).rejects.toThrow('No subjects found');
    });

    it('should compute subject weights correctly', async () => {
      mockSubject.findAll.mockResolvedValue(mockSubjects);
      mockTopic.findAll.mockResolvedValue(mockTopics);
      mockProgress.findAll.mockResolvedValue(mockProgresses);
      const scheduleInstance = { ...mockSchedule, save: vi.fn().mockResolvedValue(true) };
      mockRevisionSchedule.create.mockResolvedValue(scheduleInstance);
      mockRevisionSlot.bulkCreate.mockResolvedValue([]);

      const result = await revisionSchedulerService.generateSchedule(userId, {
        examDate: '2026-09-10',
        dailyStudyHours: 3,
      });

      expect(scheduleInstance.subjectWeights).toBeDefined();
      expect(Object.keys(scheduleInstance.subjectWeights)).toHaveLength(2);
    });
  });

  describe('completeSlot', () => {
    it('should mark a slot as completed', async () => {
      const slot = {
        id: 'slot-1',
        status: 'pending',
        scheduleId: 'schedule-789',
        save: vi.fn().mockResolvedValue(true),
      };
      mockRevisionSlot.findOne.mockResolvedValue(slot);

      const scheduleInstance = {
        id: 'schedule-789',
        totalSlots: 10,
        completedSlots: 3,
        overallProgress: 30,
        save: vi.fn().mockResolvedValue(true),
      };
      mockRevisionSchedule.findByPk.mockResolvedValue(scheduleInstance);
      mockRevisionSlot.count.mockResolvedValue(4);

      const result = await revisionSchedulerService.completeSlot(userId, 'slot-1', {
        readinessAfter: 70,
        notes: 'Reviewed flashcards',
      });

      expect(slot.status).toBe('completed');
      expect(slot.completedAt).toBeDefined();
      expect(slot.readinessAfter).toBe(70);
      expect(slot.notes).toBe('Reviewed flashcards');
      expect(slot.save).toHaveBeenCalled();
    });

    it('should throw for non-existent slot', async () => {
      mockRevisionSlot.findOne.mockResolvedValue(null);

      await expect(
        revisionSchedulerService.completeSlot(userId, 'nonexistent', {})
      ).rejects.toThrow('Revision slot not found');
    });

    it('should throw for already completed slot', async () => {
      mockRevisionSlot.findOne.mockResolvedValue({
        id: 'slot-1',
        status: 'completed',
        save: vi.fn(),
      });

      await expect(
        revisionSchedulerService.completeSlot(userId, 'slot-1', {})
      ).rejects.toThrow('already completed');
    });
  });

  describe('skipSlot', () => {
    it('should mark a slot as skipped', async () => {
      const slot = {
        id: 'slot-1',
        status: 'pending',
        save: vi.fn().mockResolvedValue(true),
      };
      mockRevisionSlot.findOne.mockResolvedValue(slot);

      const result = await revisionSchedulerService.skipSlot(userId, 'slot-1');

      expect(slot.status).toBe('skipped');
      expect(slot.save).toHaveBeenCalled();
    });
  });

  describe('rescheduleSlot', () => {
    it('should update slot date and status', async () => {
      const slot = {
        id: 'slot-1',
        status: 'pending',
        scheduledDate: '2026-08-28',
        save: vi.fn().mockResolvedValue(true),
      };
      mockRevisionSlot.findOne.mockResolvedValue(slot);

      const result = await revisionSchedulerService.rescheduleSlot(userId, 'slot-1', '2026-08-30');

      expect(slot.scheduledDate).toBe('2026-08-30');
      expect(slot.status).toBe('rescheduled');
      expect(slot.save).toHaveBeenCalled();
    });
  });

  describe('getUserSchedules', () => {
    it('should return paginated schedules', async () => {
      mockRevisionSchedule.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: [
          { id: 's1', title: 'Schedule 1' },
          { id: 's2', title: 'Schedule 2' },
        ],
      });

      const result = await revisionSchedulerService.getUserSchedules(userId, {
        page: 1,
        limit: 10,
      });

      expect(result.schedules).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });
  });

  describe('getScheduleById', () => {
    it('should return schedule with slots', async () => {
      mockRevisionSchedule.findOne.mockResolvedValue({ id: 's1', title: 'Schedule 1' });
      mockRevisionSlot.findAll.mockResolvedValue([
        { id: 'slot-1', scheduledDate: '2026-08-27' },
        { id: 'slot-2', scheduledDate: '2026-08-28' },
      ]);

      const result = await revisionSchedulerService.getScheduleById(userId, 's1');

      expect(result.schedule).toBeDefined();
      expect(result.slots).toHaveLength(2);
    });

    it('should return null for non-existent schedule', async () => {
      mockRevisionSchedule.findOne.mockResolvedValue(null);

      const result = await revisionSchedulerService.getScheduleById(userId, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getTodaysSlots', () => {
    it("should return today's pending slots", async () => {
      mockRevisionSlot.findAll.mockResolvedValue([
        { id: 'slot-1', scheduledDate: new Date().toISOString().split('T')[0], status: 'pending' },
      ]);

      const slots = await revisionSchedulerService.getTodaysSlots(userId);

      expect(slots).toHaveLength(1);
      expect(mockRevisionSlot.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: userId,
            status: { [Symbol.for('Op.in')]: ['pending', 'in_progress'] },
          }),
        })
      );
    });
  });

  describe('getSlotsForDateRange', () => {
    it('should return slots within the date range', async () => {
      mockRevisionSlot.findAll.mockResolvedValue([
        { id: 'slot-1', scheduledDate: '2026-08-27' },
        { id: 'slot-2', scheduledDate: '2026-08-28' },
      ]);

      const slots = await revisionSchedulerService.getSlotsForDateRange(
        userId,
        '2026-08-27',
        '2026-08-31'
      );

      expect(slots).toHaveLength(2);
    });
  });

  describe('expireOverdue', () => {
    it('should expire overdue slots and schedules', async () => {
      mockRevisionSlot.update.mockResolvedValue([5]);
      mockRevisionSchedule.update.mockResolvedValue([2]);

      const result = await revisionSchedulerService.expireOverdue();

      expect(result.expiredSlots).toBe(5);
      expect(result.expiredSchedules).toBe(2);
    });
  });
});

describe('revisionSchedulerService - utility functions', () => {
  describe('computePriorityScore', () => {
    it('should return high score for low readiness with many weak topics', () => {
      const score = revisionSchedulerService.computePriorityScore({
        readiness: 0.2,
        weakTopicCount: 5,
        totalTopics: 6,
      });
      expect(score).toBeGreaterThan(0.7);
    });

    it('should return low score for high readiness with no weak topics', () => {
      const score = revisionSchedulerService.computePriorityScore({
        readiness: 0.9,
        weakTopicCount: 0,
        totalTopics: 5,
      });
      expect(score).toBeLessThan(0.3);
    });
  });

  describe('scoreToPriority', () => {
    it('should map scores to correct priority levels', () => {
      expect(revisionSchedulerService.scoreToPriority(0.8)).toBe('critical');
      expect(revisionSchedulerService.scoreToPriority(0.6)).toBe('high');
      expect(revisionSchedulerService.scoreToPriority(0.4)).toBe('medium');
      expect(revisionSchedulerService.scoreToPriority(0.1)).toBe('low');
    });
  });

  describe('selectActivityType', () => {
    it('should return deep_dive for critical readiness with weak topics', () => {
      const result = revisionSchedulerService.selectActivityType(0.2, true);
      expect(result).toBe('deep_dive');
    });

    it('should return a valid activity for high readiness', () => {
      const result = revisionSchedulerService.selectActivityType(0.8, false);
      expect(revisionSchedulerService.ACTIVITIES_BY_PRIORITY.low).toContain(result);
    });
  });

  describe('buildSlotTitle', () => {
    it('should create a descriptive title', () => {
      const title = revisionSchedulerService.buildSlotTitle(
        { subjectName: 'Chemistry', readiness: 0.5 },
        'practice_quiz'
      );
      expect(title).toBe('Practice Quiz: Chemistry');
    });

    it('should handle all activity types', () => {
      for (const activityType of Object.keys(revisionSchedulerService.ACTIVITIES_BY_PRIORITY)) {
        const title = revisionSchedulerService.buildSlotTitle(
          { subjectName: 'Physics' },
          revisionSchedulerService.ACTIVITIES_BY_PRIORITY[activityType][0]
        );
        expect(title).toContain('Physics');
      }
    });
  });
});

describe('revisionSchedulerController', () => {
  it('exports all handler functions', () => {
    const controller = require('../controllers/revisionSchedulerController');
    expect(typeof controller.createSchedule).toBe('function');
    expect(typeof controller.getSchedules).toBe('function');
    expect(typeof controller.getSchedule).toBe('function');
    expect(typeof controller.getTodaysSlots).toBe('function');
    expect(typeof controller.getCalendarSlots).toBe('function');
    expect(typeof controller.completeSlot).toBe('function');
    expect(typeof controller.skipSlot).toBe('function');
    expect(typeof controller.rescheduleSlot).toBe('function');
    expect(typeof controller.updateScheduleStatus).toBe('function');
    expect(typeof controller.deleteSchedule).toBe('function');
  });
});

describe('revisionSchedulerRoutes', () => {
  it('exports an Express router', () => {
    const router = require('../routes/revisionSchedulerRoutes');
    expect(router).toBeDefined();
    expect(typeof router).toBe('function');
  });
});
