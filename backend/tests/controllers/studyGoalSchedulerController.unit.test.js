const { expect, describe, it, vi, beforeEach } = require('vitest');

/**
 * Unit tests for studyGoalSchedulerController.
 *
 * The service layer is mocked so only controller logic (parameter
 * parsing, cache hits, error handling, response formatting) is exercised.
 */

vi.mock('../../services/studyGoalSchedulerService', () => ({
  default: {
    generateWeeklySchedule: vi.fn(),
    computeSubjectPriorities: vi.fn(),
    computeFlashcardReviewLoad: vi.fn(),
    detectConflicts: vi.fn(),
    rescheduleBlock: vi.fn(),
    getScheduleAdherence: vi.fn(),
  },
}));

vi.mock('../../services/cacheService', () => ({
  default: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(),
    del: vi.fn().mockResolvedValue(),
  },
}));

vi.mock('../../models/ActivityLog', () => ({ default: { create: vi.fn() } }));
vi.mock('../../models/FocusSession', () => ({
  default: { findAll: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../../utils/dateUtils', () => ({
  toDateOnlyString: (d) => {
    if (!d) return null;
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().split('T')[0];
  },
}));

const studyGoalSchedulerService = require('../../services/studyGoalSchedulerService').default;
const cacheService = require('../../services/cacheService').default;

const {
  generateSchedule,
  getCurrentSchedule,
  rescheduleBlock,
  detectConflicts,
  getSubjectPriorities,
  getFlashcardLoad,
  getAdherence,
  getOptimalBlockDuration,
} = require('../../controllers/studyGoalSchedulerController');

// ── Helpers ────────────────────────────────────────────────────────────────

function mockReq(overrides = {}) {
  return {
    user: { id: 'user-1', name: 'Test User' },
    query: {},
    params: {},
    body: {},
    headers: {},
    ...overrides,
  };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockNext() {
  return vi.fn();
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('studyGoalSchedulerController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheService.get.mockResolvedValue(null);
  });

  describe('generateSchedule', () => {
    it('returns 400 when blockMinutes is out of range', async () => {
      const req = mockReq({ body: { blockMinutes: 5 } });
      const res = mockRes();
      const next = mockNext();

      await generateSchedule(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.stringContaining('blockMinutes') })
      );
    });

    it('returns 400 when dailyHours is out of range', async () => {
      const req = mockReq({ body: { dailyHours: 15 } });
      const res = mockRes();
      const next = mockNext();

      await generateSchedule(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.stringContaining('dailyHours') })
      );
    });

    it('returns 400 when availability is not an array', async () => {
      const req = mockReq({ body: { availability: 'invalid' } });
      const res = mockRes();
      const next = mockNext();

      await generateSchedule(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when availability has invalid dayOfWeek', async () => {
      const req = mockReq({
        body: {
          availability: [{ dayOfWeek: 8, startHour: 9, endHour: 17 }],
        },
      });
      const res = mockRes();
      const next = mockNext();

      await generateSchedule(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when endHour is before startHour', async () => {
      const req = mockReq({
        body: {
          availability: [{ dayOfWeek: 1, startHour: 17, endHour: 9 }],
        },
      });
      const res = mockRes();
      const next = mockNext();

      await generateSchedule(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('generates schedule with valid inputs', async () => {
      const scheduleData = {
        weekStart: '2026-08-31',
        summary: { totalStudyMinutes: 300 },
      };
      studyGoalSchedulerService.generateWeeklySchedule.mockResolvedValue(scheduleData);

      const req = mockReq({ body: { dailyHours: 3, blockMinutes: 45 } });
      const res = mockRes();
      const next = mockNext();

      await generateSchedule(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: scheduleData })
      );
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('passes all options to the service', async () => {
      studyGoalSchedulerService.generateWeeklySchedule.mockResolvedValue({});

      const availability = [{ dayOfWeek: 1, startHour: 8, endHour: 18 }];
      const req = mockReq({
        body: {
          availability,
          dailyHours: 4,
          examId: 'exam-1',
          weekStartDate: '2026-09-07',
          blockMinutes: 60,
        },
      });
      const res = mockRes();
      const next = mockNext();

      await generateSchedule(req, res, next);

      expect(studyGoalSchedulerService.generateWeeklySchedule).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          availability,
          dailyHours: 4,
          examId: 'exam-1',
          blockMinutes: 60,
        })
      );
    });

    it('calls next(error) on service failure', async () => {
      studyGoalSchedulerService.generateWeeklySchedule.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ body: {} });
      const res = mockRes();
      const next = mockNext();

      await generateSchedule(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getCurrentSchedule', () => {
    it('returns cached schedule when available', async () => {
      const cachedSchedule = { weekStart: '2026-08-31', schedule: {} };
      cacheService.get.mockResolvedValue(JSON.stringify(cachedSchedule));

      const req = mockReq({ query: { weekStart: '2026-08-31' } });
      const res = mockRes();
      const next = mockNext();

      await getCurrentSchedule(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: cachedSchedule, cached: true })
      );
    });

    it('generates fresh schedule when no cache', async () => {
      const freshSchedule = { weekStart: '2026-08-31' };
      studyGoalSchedulerService.generateWeeklySchedule.mockResolvedValue(freshSchedule);

      const req = mockReq({ query: {} });
      const res = mockRes();
      const next = mockNext();

      await getCurrentSchedule(req, res, next);

      expect(studyGoalSchedulerService.generateWeeklySchedule).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: freshSchedule })
      );
    });
  });

  describe('rescheduleBlock', () => {
    it('returns 400 when required fields are missing', async () => {
      const req = mockReq({ body: { blockId: 'b-1' } });
      const res = mockRes();
      const next = mockNext();

      await rescheduleBlock(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 for invalid newStartHour', async () => {
      const req = mockReq({
        body: {
          blockId: 'b-1',
          newDate: '2026-09-01',
          newStartHour: 25,
          currentSchedule: {},
        },
      });
      const res = mockRes();
      const next = mockNext();

      await rescheduleBlock(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('newStartHour') })
      );
    });

    it('successfully reschedules a block', async () => {
      studyGoalSchedulerService.rescheduleBlock.mockReturnValue({
        success: true,
        schedule: { weekStart: '2026-08-31', slots: [] },
        movedBlock: { id: 'b-1', startHour: 10 },
        conflicts: [],
      });

      const req = mockReq({
        body: {
          blockId: 'b-1',
          newDate: '2026-09-01',
          newStartHour: 10,
          currentSchedule: { weekStart: '2026-08-31', slots: [] },
        },
      });
      const res = mockRes();
      const next = mockNext();

      await rescheduleBlock(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('returns 400 when rescheduling fails', async () => {
      studyGoalSchedulerService.rescheduleBlock.mockReturnValue({
        success: false,
        error: 'Block not found',
        schedule: {},
      });

      const req = mockReq({
        body: {
          blockId: 'nonexistent',
          newDate: '2026-09-01',
          newStartHour: 10,
          currentSchedule: { slots: [] },
        },
      });
      const res = mockRes();
      const next = mockNext();

      await rescheduleBlock(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('detectConflicts', () => {
    it('returns 400 when blocks is not an array', async () => {
      const req = mockReq({ body: { blocks: 'not-an-array' } });
      const res = mockRes();
      const next = mockNext();

      await detectConflicts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns conflicts analysis', async () => {
      studyGoalSchedulerService.detectConflicts.mockReturnValue([
        { type: 'time_overlap', subjectA: 'Math', subjectB: 'Physics', overlapMinutes: 15 },
      ]);

      const req = mockReq({ body: { blocks: [{ id: 'b-1' }, { id: 'b-2' }] } });
      const res = mockRes();
      const next = mockNext();

      await detectConflicts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const data = res.json.mock.calls[0][0].data;
      expect(data.hasConflicts).toBe(true);
      expect(data.conflictCount).toBe(1);
    });
  });

  describe('getSubjectPriorities', () => {
    it('returns priorities with optional examId', async () => {
      const priorities = [
        { subjectName: 'Math', priorityScore: 0.6 },
        { subjectName: 'Physics', priorityScore: 0.4 },
      ];
      studyGoalSchedulerService.computeSubjectPriorities.mockResolvedValue(priorities);

      const req = mockReq({ query: { examId: 'exam-1' } });
      const res = mockRes();
      const next = mockNext();

      await getSubjectPriorities(req, res, next);

      expect(studyGoalSchedulerService.computeSubjectPriorities).toHaveBeenCalledWith('user-1', 'exam-1');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: priorities })
      );
    });
  });

  describe('getFlashcardLoad', () => {
    it('returns flashcard load data', async () => {
      const load = { totalReviewMinutes: 45, subjects: [] };
      studyGoalSchedulerService.computeFlashcardReviewLoad.mockResolvedValue(load);

      const req = mockReq({ query: {} });
      const res = mockRes();
      const next = mockNext();

      await getFlashcardLoad(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: load })
      );
    });
  });

  describe('getAdherence', () => {
    it('returns 400 when weekStart is missing', async () => {
      const req = mockReq({ query: {} });
      const res = mockRes();
      const next = mockNext();

      await getAdherence(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns adherence report', async () => {
      const adherence = {
        weekStart: '2026-08-31',
        overallAdherence: 75,
        dailyAdherence: [],
      };
      studyGoalSchedulerService.getScheduleAdherence.mockResolvedValue(adherence);

      const req = mockReq({ query: { weekStart: '2026-08-31' } });
      const res = mockRes();
      const next = mockNext();

      await getAdherence(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: adherence })
      );
    });
  });

  describe('getOptimalBlockDuration', () => {
    it('returns default when no focus sessions exist', async () => {
      const FocusSession = require('../../models/FocusSession').default;
      FocusSession.findAll.mockResolvedValue([]);

      const req = mockReq({ query: {} });
      const res = mockRes();
      const next = mockNext();

      await getOptimalBlockDuration(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const data = res.json.mock.calls[0][0].data;
      expect(data.recommendedMinutes).toBe(45);
      expect(data.confidence).toBe('low');
      expect(data.sessionsAnalyzed).toBe(0);
    });

    it('recommends optimal duration based on focus scores', async () => {
      const FocusSession = require('../../models/FocusSession').default;
      FocusSession.findAll.mockResolvedValue([
        { id: 's-1', activeSeconds: 2700, focusScore: 85, subject: null, createdAt: new Date() }, // 45 min
        { id: 's-2', activeSeconds: 2700, focusScore: 90, subject: null, createdAt: new Date() }, // 45 min
        { id: 's-3', activeSeconds: 5400, focusScore: 60, subject: null, createdAt: new Date() }, // 90 min
        { id: 's-4', activeSeconds: 2700, focusScore: 88, subject: null, createdAt: new Date() }, // 45 min
        { id: 's-5', activeSeconds: 1800, focusScore: 70, subject: null, createdAt: new Date() }, // 30 min
        { id: 's-6', activeSeconds: 2700, focusScore: 92, subject: null, createdAt: new Date() }, // 45 min
        { id: 's-7', activeSeconds: 2700, focusScore: 87, subject: null, createdAt: new Date() }, // 45 min
        { id: 's-8', activeSeconds: 1800, focusScore: 72, subject: null, createdAt: new Date() }, // 30 min
        { id: 's-9', activeSeconds: 5400, focusScore: 55, subject: null, createdAt: new Date() }, // 90 min
        { id: 's-10', activeSeconds: 2700, focusScore: 89, subject: null, createdAt: new Date() }, // 45 min
      ]);

      const req = mockReq({ query: {} });
      const res = mockRes();
      const next = mockNext();

      await getOptimalBlockDuration(req, res, next);

      const data = res.json.mock.calls[0][0].data;
      expect(data.recommendedMinutes).toBe(45); // Highest focus scores at 45-min bucket
      expect(data.confidence).toBe('high'); // 10 sessions >= 10
      expect(data.sessionsAnalyzed).toBe(10);
      expect(data.bucketAnalysis.length).toBeGreaterThan(0);
    });

    it('provides medium confidence for 5-9 sessions', async () => {
      const FocusSession = require('../../models/FocusSession').default;
      FocusSession.findAll.mockResolvedValue(
        Array.from({ length: 7 }, (_, i) => ({
          id: `s-${i}`,
          activeSeconds: 2700,
          focusScore: 80,
          subject: null,
          createdAt: new Date(),
        }))
      );

      const req = mockReq({ query: {} });
      const res = mockRes();
      const next = mockNext();

      await getOptimalBlockDuration(req, res, next);

      const data = res.json.mock.calls[0][0].data;
      expect(data.confidence).toBe('medium');
    });
  });
});
