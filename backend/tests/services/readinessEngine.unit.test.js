const { calculateReadinessProjection } = require('../../services/readinessEngine');
const { Subject, QuizAttempt, Quiz, Syllabus, SyllabusTopic, StudyPlan } = require('../../models');

describe('Readiness Engine Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('should return insufficientData when attempts count is < 3', async () => {
    vi.spyOn(Subject, 'findAll').mockResolvedValue([{ id: 'sub-1', name: 'Physics' }]);
    vi.spyOn(QuizAttempt, 'findAll').mockResolvedValue([
      { id: 'att-1', score: 8, totalQuestions: 10, createdAt: new Date() }
    ]);

    const result = await calculateReadinessProjection({ userId: 'user-123' });

    expect(result.insufficientData).toBe(true);
    expect(result.currentAttemptCount).toBe(1);
    expect(result.message).toContain('Insufficient attempt data');
  });

  test('should run least-squares linear fitting and return forecast data', async () => {
    vi.spyOn(Subject, 'findAll').mockResolvedValue([
      { id: 'sub-1', name: 'Physics' }
    ]);

    const baseTime = new Date('2026-08-20T12:00:00.000Z');
    
    // 3 attempts showing a clear linear improvement:
    // Day 0: 60%, Day 2: 70%, Day 4: 80%
    const attempts = [
      {
        id: 'att-1',
        score: 6,
        totalQuestions: 10,
        createdAt: new Date(baseTime.getTime()), // Day 0
        quizRef: { subject: 'sub-1' }
      },
      {
        id: 'att-2',
        score: 7,
        totalQuestions: 10,
        createdAt: new Date(baseTime.getTime() + 2 * 24 * 60 * 60 * 1000), // Day 2
        quizRef: { subject: 'sub-1' }
      },
      {
        id: 'att-3',
        score: 8,
        totalQuestions: 10,
        createdAt: new Date(baseTime.getTime() + 4 * 24 * 60 * 60 * 1000), // Day 4
        quizRef: { subject: 'sub-1' }
      }
    ];

    vi.spyOn(QuizAttempt, 'findAll').mockResolvedValue(attempts);
    vi.spyOn(Syllabus, 'findAll').mockResolvedValue([{ id: 'syl-1' }]);
    vi.spyOn(SyllabusTopic, 'count').mockImplementation(async (options) => {
      if (options.where.coverageStatus === 'Covered') return 5;
      return 10;
    });
    vi.spyOn(StudyPlan, 'findOne').mockResolvedValue({
      startDate: new Date(baseTime.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      endDate: new Date(baseTime.getTime() + 14 * 24 * 60 * 60 * 1000)
    });

    const result = await calculateReadinessProjection({
      userId: 'user-123',
      targetScore: 85,
      dailyHours: 2,
    });

    expect(result.insufficientData).toBe(false);
    expect(result.overallReadiness).toBeGreaterThan(0);
    expect(result.studyVelocity).toBe(5); // 5 covered topics / 1 week = 5
    expect(result.status).toBeDefined();
    expect(result.subjects.length).toBe(1);
    expect(result.subjects[0].subjectName).toBe('Physics');
    expect(result.subjects[0].slope).toBeCloseTo(5.0); // 5% improvement per day
  });
});
