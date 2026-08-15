const { calculateSubjectReadiness } = require('../../services/readinessCalculator');
const { Topic, Progress, QuizAttempt, Quiz, Flashcard, StudyPlan } = require('../../models');

jest.mock('../../models', () => ({
  Topic: { findAll: jest.fn() },
  Progress: { findAll: jest.fn() },
  QuizAttempt: { findAll: jest.fn() },
  Quiz: { findAll: jest.fn() },
  Flashcard: { findAll: jest.fn() },
  StudyPlan: { findOne: jest.fn() },
}));

describe('readinessCalculator Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates ERI readiness score correctly based on metrics weightages', async () => {
    // 1. Syllabus Coverage (30% weight) -> average of 2 topics (60% and 80%) = 70% coverage
    Topic.findAll.mockResolvedValue([
      { id: 't-1', name: 'Topic 1' },
      { id: 't-2', name: 'Topic 2' },
    ]);
    Progress.findAll.mockResolvedValue([
      { topic: 't-1', completionPercentage: 60 },
      { topic: 't-2', completionPercentage: 80 },
    ]);

    // 2. Quiz Accuracy (30% weight) -> 8 correct answers out of 10 questions = 80% accuracy
    QuizAttempt.findAll.mockResolvedValue([
      { score: 8, totalQuestions: 10 },
    ]);

    // 3. Flashcard Retention (25% weight) -> repetitions = 5 (repScore 100), efactor = 2.5 (efactorScore ~70)
    Flashcard.findAll.mockResolvedValue([
      { efactor: 2.5, repetitions: 5 },
    ]);

    // 4. Study Velocity (15% weight) -> 3 completed out of 4 daily goals = 75% velocity
    StudyPlan.findOne.mockResolvedValue({
      dailyGoals: [
        { completed: true },
        { completed: true },
        { completed: true },
        { completed: false },
      ],
    });

    const result = await calculateSubjectReadiness('u-1', 's-1');

    expect(result.syllabusCoverage).toBe(70);
    expect(result.quizAccuracy).toBe(80);
    expect(result.memoryRetention).toBe(82); // weighted sum ~82% stability
    expect(result.studyVelocity).toBe(75);

    // ERI = (70 * 0.3) + (80 * 0.3) + (82 * 0.25) + (75 * 0.15)
    // ERI = 21 + 24 + 20.5 + 11.25 = 76.75 -> Math.round -> 77%
    expect(result.readinessScore).toBe(77);
  });

  it('handles zero test attempts and empty topics list gracefully without crashing', async () => {
    Topic.findAll.mockResolvedValue([]);
    QuizAttempt.findAll.mockResolvedValue([]);
    Flashcard.findAll.mockResolvedValue([]);
    StudyPlan.findOne.mockResolvedValue(null);

    const result = await calculateSubjectReadiness('u-2', 's-2');

    expect(result.syllabusCoverage).toBe(0);
    expect(result.quizAccuracy).toBe(0);
    expect(result.memoryRetention).toBe(0);
    expect(result.studyVelocity).toBe(50); // Default velocity fallback
    expect(result.readinessScore).toBe(8); // ERI = 50 * 0.15 = 7.5 -> Math.round -> 8%
  });
});
