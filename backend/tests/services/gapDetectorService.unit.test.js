vi.mock('../../models', () => ({
  SyllabusTopic: { findAll: vi.fn() },
  Note: { findOne: vi.fn() },
  Topic: { findOne: vi.fn() },
  Quiz: { findAll: vi.fn() },
  QuizAttempt: { findAll: vi.fn() },
  Syllabus: { findOne: vi.fn() },
}));

const { analyzeSyllabusGaps } = require('../../services/gapDetectorService');
const { SyllabusTopic, Note, Topic, Quiz, QuizAttempt } = require('../../models');

describe('gapDetectorService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly maps topic gaps based on notes and quiz scores', async () => {
    // 1. Syllabus Topics
    const mockSave = vi.fn();
    SyllabusTopic.findAll.mockResolvedValue([
      { id: 't-1', title: 'Linear Algebra', moduleName: 'Mod 1', subtopics: ['Matrices'], save: mockSave },
      { id: 't-2', title: 'Calculus', moduleName: 'Mod 1', subtopics: ['Limits'], save: mockSave },
      { id: 't-3', title: 'Quantum Mechanics', moduleName: 'Mod 2', subtopics: ['Spin'], save: mockSave },
    ]);

    // Topic 1: Has linked note AND average quiz score = 90% (>= 70) -> status: Covered (Green)
    // Topic 2: Has linked note BUT no quiz scores yet -> status: Partially Covered (Yellow)
    // Topic 3: No linked note AND no quiz attempts -> status: Unstudied Gap (Red)

    Note.findOne
      .mockResolvedValueOnce({ id: 'note-1', title: 'Linear Algebra notes' })
      .mockResolvedValueOnce({ id: 'note-2', title: 'Calculus details' })
      .mockResolvedValueOnce(null);

    Topic.findOne
      .mockResolvedValueOnce({ id: 'db-topic-1', name: 'Linear Algebra' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    Quiz.findAll.mockResolvedValue([{ id: 'quiz-1' }]);
    QuizAttempt.findAll.mockResolvedValue([{ score: 9, totalQuestions: 10 }]);

    const result = await analyzeSyllabusGaps('u-1', 's-1');

    expect(result.coveragePercentage).toBe(50); // ERI = (1 Covered + 0.5 * 1 Partial) / 3 * 100 = 50%
    expect(result.topics[0].coverageStatus).toBe('Covered');
    expect(result.topics[1].coverageStatus).toBe('Partially Covered');
    expect(result.topics[2].coverageStatus).toBe('Unstudied Gap');
  });
});
