const mockTopicFindAll = vi.fn();
const mockProgressFindAll = vi.fn();
const mockStudyPlanFindOne = vi.fn();
const mockQuizAttemptFindAll = vi.fn();

vi.mock('../../models/Topic', () => ({
  findAll: mockTopicFindAll,
}));

vi.mock('../../models/Progress', () => ({
  findAll: mockProgressFindAll,
}));

vi.mock('../../models/StudyPlan', () => ({
  findOne: mockStudyPlanFindOne,
}));

vi.mock('../../models/QuizAttempt', () => ({
  findAll: mockQuizAttemptFindAll,
}));

vi.mock('../../services/geminiService', () => ({
  analyzePerformanceAndRecommend: vi.fn().mockResolvedValue({
    weakSubjects: ['Physics'],
    recommendations: [
      { subject: 'Physics', topic: 'Thermodynamics', suggestion: 'Revise laws', priority: 'High' }
    ]
  }),
}));

const weaknessAggregatorService = require('../../services/weaknessAggregatorService');

describe('weaknessAggregatorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('aggregateUserWeakness categorizes weak topics (<50%) correctly', async () => {
    const mockSave = vi.fn();
    const mockTopics = [
      { id: 't1', name: 'Thermodynamics', status: 'Medium', save: mockSave },
      { id: 't2', name: 'Optics', status: 'Medium', save: mockSave }
    ];
    mockTopicFindAll.mockResolvedValue(mockTopics);

    mockProgressFindAll.mockImplementation(({ where }) => {
      if (where.topic === 't1') {
        return Promise.resolve([
          { quizScores: [{ score: 40 }, { score: 30 }] } // avg 35% -> Weak
        ]);
      }
      return Promise.resolve([
        { quizScores: [{ score: 90 }] } // avg 90% -> Strong
      ]);
    });

    const result = await weaknessAggregatorService.aggregateUserWeakness('user-1');

    expect(result.updatedCount).toBe(2);
    expect(result.weakTopics).toHaveLength(1);
    expect(result.weakTopics[0].name).toBe('Thermodynamics');
    expect(mockTopics[0].status).toBe('Weak');
    expect(mockTopics[1].status).toBe('Strong');
  });

  test('rescheduleAdaptivePlanner boosts study hours for weak topic tasks (+50%)', async () => {
    const mockSavePlan = vi.fn();
    const mockActivePlan = {
      id: 'plan-1',
      dailyGoals: [
        {
          date: '2026-07-28',
          tasks: [
            { id: 'task-1', title: 'Study Thermodynamics', duration: 60, topic: 't1' },
            { id: 'task-2', title: 'Study Optics', duration: 60, topic: 't2' }
          ]
        }
      ],
      save: mockSavePlan
    };

    mockStudyPlanFindOne.mockResolvedValue(mockActivePlan);
    mockTopicFindAll.mockResolvedValue([
      { id: 't1', name: 'Thermodynamics', status: 'Weak' }
    ]);

    const result = await weaknessAggregatorService.rescheduleAdaptivePlanner('user-1');

    expect(result.rescheduledPlanId).toBe('plan-1');
    expect(result.boostedTasksCount).toBe(1);
    expect(mockActivePlan.dailyGoals[0].tasks[0].duration).toBe(90); // 60 * 1.5
    expect(mockActivePlan.dailyGoals[0].tasks[1].duration).toBe(60);
    expect(mockSavePlan).toHaveBeenCalled();
  });
});
