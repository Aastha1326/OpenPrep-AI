const { getReadinessProjection } = require('../../controllers/readinessController');
const { QuizAttempt, Subject, Syllabus, SyllabusTopic, StudyPlan } = require('../../models');

vi.mock('../../models', () => ({
  Subject: {
    findAll: vi.fn().mockResolvedValue([{ id: 's1', name: 'Mathematics' }]),
  },
  QuizAttempt: {
    findAll: vi.fn(),
  },
  Syllabus: {
    findAll: vi.fn().mockResolvedValue([{ id: 'syl-1' }]),
  },
  SyllabusTopic: {
    count: vi.fn().mockResolvedValue(5),
  },
  StudyPlan: {
    findOne: vi.fn().mockResolvedValue({
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }),
  },
}));

describe('Readiness Projection Controller - Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should parse query params and return 200 with readiness projection payload', async () => {
    const fakeUser = { id: '11111111-1111-1111-1111-111111111111' };

    vi.spyOn(QuizAttempt, 'findAll').mockResolvedValue([
      { score: 6, totalQuestions: 10, createdAt: new Date(), quizRef: { subject: 's1' } },
      { score: 7, totalQuestions: 10, createdAt: new Date(), quizRef: { subject: 's1' } },
      { score: 8, totalQuestions: 10, createdAt: new Date(), quizRef: { subject: 's1' } },
    ]);
    vi.spyOn(Subject, 'findAll').mockResolvedValue([{ id: 's1', name: 'Mathematics' }]);

    const req = {
      user: fakeUser,
      query: { dailyHours: '3', targetScore: '85', targetExamDate: '2026-09-10' },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await getReadinessProjection(req, res, (err) => {
      if (err) throw err;
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          insufficientData: false,
          overallReadiness: expect.any(Number),
          targetScore: 85,
        })
      })
    );
  });
});
