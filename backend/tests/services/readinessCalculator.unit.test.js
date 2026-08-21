const {
  calculateSubjectReadiness,
  computeSyllabusCoverage,
  computeQuizAccuracy,
  computeMemoryRetention,
  computeStudyVelocity,
  computeReadinessScore,
  DEFAULT_STUDY_VELOCITY,
} = require('../../services/readinessCalculator');

/**
 * The previous version of this suite mocked '../../models' with vi.mock, which
 * does not intercept the CommonJS require the service uses to reach them — the
 * assertions never ran against the calculator at all. Models are injected here
 * instead, and the component maths are exercised directly as pure functions.
 */

const makeDeps = ({
  topics = [],
  progresses = [],
  attempts = [],
  flashcards = [],
  studyPlan = null,
} = {}) => ({
  topicModel: { findAll: vi.fn().mockResolvedValue(topics) },
  progressModel: { findAll: vi.fn().mockResolvedValue(progresses) },
  quizModel: {},
  quizAttemptModel: { findAll: vi.fn().mockResolvedValue(attempts) },
  flashcardModel: { findAll: vi.fn().mockResolvedValue(flashcards) },
  studyPlanModel: { findOne: vi.fn().mockResolvedValue(studyPlan) },
});

describe('computeQuizAccuracy', () => {
  it('reads score as the percentage the column actually stores', () => {
    // quizController stores Math.round((earned / max) * 100), so three perfect
    // ten-question quizzes are three 100s — not three "10 correct" counts.
    expect(
      computeQuizAccuracy([
        { score: 100, totalQuestions: 10 },
        { score: 100, totalQuestions: 10 },
        { score: 100, totalQuestions: 10 },
      ])
    ).toBe(100);
  });

  it('never reports above 100 regardless of quiz length', () => {
    const lengths = [1, 5, 10, 50, 200];
    for (const totalQuestions of lengths) {
      const accuracy = computeQuizAccuracy([{ score: 100, totalQuestions }]);
      expect(accuracy).toBe(100);
    }
  });

  it('is not sensitive to how many questions a quiz had', () => {
    // The old formula reported 50% for a 100-question quiz and 1000% for a
    // 5-question quiz at the same score. Both should read 50.
    expect(computeQuizAccuracy([{ score: 50, totalQuestions: 100 }])).toBe(50);
    expect(computeQuizAccuracy([{ score: 50, totalQuestions: 5 }])).toBe(50);
  });

  it('weights each attempt by its question count', () => {
    // 100% on 10 questions and 50% on 90 questions -> (1000 + 4500) / 100 = 55
    expect(
      computeQuizAccuracy([
        { score: 100, totalQuestions: 10 },
        { score: 50, totalQuestions: 90 },
      ])
    ).toBe(55);
  });

  it('ignores attempts with no questions rather than dividing by a placeholder', () => {
    expect(
      computeQuizAccuracy([
        { score: 80, totalQuestions: 10 },
        { score: 0, totalQuestions: 0 },
      ])
    ).toBe(80);
  });

  it('returns 0 when there are no attempts', () => {
    expect(computeQuizAccuracy([])).toBe(0);
  });

  it('clamps a stored score that is out of range', () => {
    expect(computeQuizAccuracy([{ score: 250, totalQuestions: 10 }])).toBe(100);
    expect(computeQuizAccuracy([{ score: -30, totalQuestions: 10 }])).toBe(0);
  });
});

describe('computeMemoryRetention', () => {
  it('maps a default-easiness, fully-drilled card onto the documented blend', () => {
    // efactor 2.5 -> ((2.5 - 1.3) / 1.7) * 100 = 70.59; repetitions 5 -> 100
    // 70.59 * 0.6 + 100 * 0.4 = 82.35
    expect(computeMemoryRetention([{ efactor: 2.5, repetitions: 5 }])).toBe(82);
  });

  it('clamps an easiness factor that has grown past the SM-2 ceiling', () => {
    // utils/sm2.js enforces the 1.3 floor but no ceiling, so efactor keeps
    // climbing with every good recall.
    expect(computeMemoryRetention([{ efactor: 7.5, repetitions: 20 }])).toBe(100);
  });

  it('falls back to the model default when efactor is missing', () => {
    expect(computeMemoryRetention([{ efactor: null, repetitions: 5 }])).toBe(82);
    expect(computeMemoryRetention([{ repetitions: 5 }])).toBe(82);
  });

  it('never returns NaN for a card with a corrupt efactor', () => {
    const result = computeMemoryRetention([{ efactor: NaN, repetitions: 3 }]);
    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 when the user has no flashcards in the subject', () => {
    expect(computeMemoryRetention([])).toBe(0);
  });
});

describe('computeSyllabusCoverage', () => {
  it('averages completion across the subject topics', () => {
    const topics = [{ id: 't-1' }, { id: 't-2' }];
    const progresses = [
      { topic: 't-1', completionPercentage: 60 },
      { topic: 't-2', completionPercentage: 80 },
    ];
    expect(computeSyllabusCoverage(topics, progresses)).toBe(70);
  });

  it('counts a topic once even when it has several progress rows', () => {
    // Subject-level and topic-level reviews both upsert a Progress row, so a
    // topic can legitimately carry more than one.
    const topics = [{ id: 't-1' }, { id: 't-2' }];
    const progresses = [
      { topic: 't-1', completionPercentage: 100 },
      { topic: 't-1', completionPercentage: 90 },
      { topic: 't-2', completionPercentage: 100 },
    ];
    expect(computeSyllabusCoverage(topics, progresses)).toBe(100);
  });

  it('ignores progress rows for topics outside the subject', () => {
    const topics = [{ id: 't-1' }];
    const progresses = [
      { topic: 't-1', completionPercentage: 50 },
      { topic: 't-other', completionPercentage: 100 },
    ];
    expect(computeSyllabusCoverage(topics, progresses)).toBe(50);
  });

  it('returns 0 when the subject has no topics', () => {
    expect(computeSyllabusCoverage([], [])).toBe(0);
  });
});

describe('computeStudyVelocity', () => {
  it('reports the share of daily goals completed', () => {
    expect(
      computeStudyVelocity({
        dailyGoals: [
          { completed: true },
          { completed: true },
          { completed: true },
          { completed: false },
        ],
      })
    ).toBe(75);
  });

  it('falls back to the neutral default with no active plan', () => {
    expect(computeStudyVelocity(null)).toBe(DEFAULT_STUDY_VELOCITY);
    expect(computeStudyVelocity({ dailyGoals: [] })).toBe(DEFAULT_STUDY_VELOCITY);
  });
});

describe('computeReadinessScore', () => {
  it('blends the four components by their documented weights', () => {
    // 70 * 0.3 + 80 * 0.3 + 82 * 0.25 + 75 * 0.15 = 76.75 -> 77
    expect(
      computeReadinessScore({
        syllabusCoverage: 70,
        quizAccuracy: 80,
        memoryRetention: 82,
        studyVelocity: 75,
      })
    ).toBe(77);
  });

  it('cannot exceed 100 even if a component arrives out of range', () => {
    expect(
      computeReadinessScore({
        syllabusCoverage: 1000,
        quizAccuracy: 1000,
        memoryRetention: 1000,
        studyVelocity: 1000,
      })
    ).toBe(100);
  });

  it('is 100 for a fully prepared student', () => {
    expect(
      computeReadinessScore({
        syllabusCoverage: 100,
        quizAccuracy: 100,
        memoryRetention: 100,
        studyVelocity: 100,
      })
    ).toBe(100);
  });
});

describe('calculateSubjectReadiness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports every metric inside 0-100 for a strong student', async () => {
    const deps = makeDeps({
      topics: [{ id: 't-1' }, { id: 't-2' }],
      progresses: [
        { topic: 't-1', completionPercentage: 60 },
        { topic: 't-2', completionPercentage: 80 },
      ],
      attempts: [
        { score: 100, totalQuestions: 10 },
        { score: 100, totalQuestions: 10 },
        { score: 100, totalQuestions: 10 },
      ],
      flashcards: [{ efactor: 2.5, repetitions: 5 }],
      studyPlan: {
        dailyGoals: [
          { completed: true },
          { completed: true },
          { completed: true },
          { completed: false },
        ],
      },
    });

    const result = await calculateSubjectReadiness('u-1', 's-1', deps);

    expect(result.syllabusCoverage).toBe(70);
    expect(result.quizAccuracy).toBe(100); // was 1000 before the fix
    expect(result.memoryRetention).toBe(82);
    expect(result.studyVelocity).toBe(75);

    // 70 * 0.3 + 100 * 0.3 + 82 * 0.25 + 75 * 0.15 = 82.75 -> 83
    expect(result.readinessScore).toBe(83);

    for (const value of Object.values(result)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it('handles a subject with no data without crashing', async () => {
    const deps = makeDeps();

    const result = await calculateSubjectReadiness('u-2', 's-2', deps);

    expect(result.syllabusCoverage).toBe(0);
    expect(result.quizAccuracy).toBe(0);
    expect(result.memoryRetention).toBe(0);
    expect(result.studyVelocity).toBe(DEFAULT_STUDY_VELOCITY);
    expect(result.readinessScore).toBe(8); // 50 * 0.15 = 7.5 -> 8
  });

  it('skips the progress query entirely when the subject has no topics', async () => {
    const deps = makeDeps();

    await calculateSubjectReadiness('u-3', 's-3', deps);

    expect(deps.progressModel.findAll).not.toHaveBeenCalled();
  });

  it('never returns NaN when flashcard data is incomplete', async () => {
    const deps = makeDeps({
      flashcards: [{ efactor: null, repetitions: null }, { repetitions: 2 }],
    });

    const result = await calculateSubjectReadiness('u-4', 's-4', deps);

    for (const [key, value] of Object.entries(result)) {
      expect(Number.isNaN(value), `${key} was NaN`).toBe(false);
    }
  });
});
