const { computeTopicMastery, detectGaps, generatePath } = require('../../services/learningAnalytics');
const { User, LearningPath, Topic, QuizAttempt, Note, PYQ } = require('../../models');

describe('learningAnalytics Service Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('computeTopicMastery classifies topics based on quiz scores', async () => {
    const mockAttempts = [
      { score: 100, weakTopics: [], strongTopics: ['t-mastered'] },
      { score: 30, weakTopics: ['t-weak'], strongTopics: [] },
    ];

    vi.spyOn(QuizAttempt, 'findAll').mockResolvedValue(mockAttempts);

    const masteryMap = await computeTopicMastery('user-100');

    expect(masteryMap.get('t-mastered')).toEqual({
      accuracy: 100,
      status: 'mastered',
      totalAttempts: 1,
    });

    expect(masteryMap.get('t-weak')).toEqual({
      accuracy: 0,
      status: 'weak',
      totalAttempts: 1,
    });
  });

  test('detectGaps ranks weak and unattempted topics by urgency', async () => {
    const mockTopics = [
      { id: 't-weak', name: 'Quantum Mechanics', weightage: 5, subjectRef: { name: 'Physics' } },
      { id: 't-unattempted', name: 'Thermodynamics', weightage: 3, subjectRef: { name: 'Physics' } },
    ];

    vi.spyOn(QuizAttempt, 'findAll').mockResolvedValue([
      { score: 20, weakTopics: ['t-weak'], strongTopics: [] },
    ]);
    vi.spyOn(Topic, 'findAll').mockResolvedValue(mockTopics);

    const gaps = await detectGaps('user-100', 'SAT Physics');

    expect(gaps.length).toBe(2);
    expect(gaps[0].topicId).toBe('t-weak');
    expect(gaps[0].masteryStatus).toBe('weak');
  });

  test('generatePath creates a new LearningPath record and links to User', async () => {
    const mockUser = { id: 'user-200', currentLearningPathId: null, save: vi.fn().mockResolvedValue({}) };
    const mockCreatedPath = {
      id: 'path-999',
      userId: 'user-200',
      goal: 'NCLEX Prep',
      pathItems: [{ itemId: 'item-1', topicName: 'Foundations' }],
      overallProgress: 0,
    };

    vi.spyOn(QuizAttempt, 'findAll').mockResolvedValue([]);
    vi.spyOn(Topic, 'findAll').mockResolvedValue([]);
    vi.spyOn(Note, 'findAll').mockResolvedValue([]);
    vi.spyOn(PYQ, 'findAll').mockResolvedValue([]);
    vi.spyOn(LearningPath, 'create').mockResolvedValue(mockCreatedPath);
    vi.spyOn(User, 'findByPk').mockResolvedValue(mockUser);

    const result = await generatePath('user-200', 'NCLEX Prep');

    expect(LearningPath.create).toHaveBeenCalled();
    expect(result.id).toBe('path-999');
    expect(mockUser.currentLearningPathId).toBe('path-999');
  });
});
