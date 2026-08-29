const { updateBaseline, logProctoringEvent, getProctoringReport, localBiometricsBaseline } = require('../../controllers/proctoringController');
const { ExamIntegrityReport } = require('../../models');
const redisService = require('../../services/redisService');

vi.mock('../../models', () => ({
  ExamIntegrityReport: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
  User: {},
}));

vi.mock('../../services/redisService', () => ({
  isReady: true,
  client: {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
  },
  set: vi.fn().mockResolvedValue('OK'),
  get: vi.fn().mockResolvedValue(null),
}));

describe('Exam Proctoring Integrity Controller - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    vi.restoreAllMocks();
    localBiometricsBaseline.clear();

    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  test('updateBaseline saves student profile to cache and registry maps', async () => {
    req.user = { id: 'student-444' };
    req.body = { averageDwellMs: 110, averageFlightMs: 230 };

    await updateBaseline(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining('Biometrics baseline profile updated'),
      })
    );
    expect(localBiometricsBaseline.get('student-444')).toEqual(
      expect.objectContaining({ averageDwellMs: 110, averageFlightMs: 230 })
    );
  });

  test('logProctoringEvent constructs reports and computes trust score subtractions', async () => {
    req.user = { id: 'student-444' };
    req.body = {
      quizAttemptId: 'attempt-999',
      eventType: 'BLUR',
    };

    // First BLUR event logs
    vi.spyOn(ExamIntegrityReport, 'findOne').mockResolvedValue(null);
    vi.spyOn(ExamIntegrityReport, 'create').mockImplementation(async (data) => data);

    await logProctoringEvent(req, res, next);

    expect(ExamIntegrityReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        quizAttemptId: 'attempt-999',
        trustScore: 85, // 100 - 15 (BLUR penalty)
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
