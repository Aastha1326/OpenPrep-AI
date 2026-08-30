const Question = require('../models/Question');
const Note = require('../models/Note');
const llmService = require('../utils/llmService');
const { generateQuestions } = require('../controllers/aiController');

describe('AI Controller - Question Generation (generateQuestions)', () => {
  let req, res, next;

  beforeEach(() => {
    vi.restoreAllMocks();
    req = {
      user: { id: 'user-123' },
      body: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  test('returns 400 if neither content nor noteId is provided', async () => {
    req.body = {};
    await generateQuestions(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Document content or a valid noteId is required'),
      })
    );
  });

  test('generates questions from provided text content and saves to database', async () => {
    req.body = {
      content: 'Photosynthesis is the process by which green plants use sunlight to synthesize nutrients.',
      title: 'Biology Notes',
      numQuestions: 2,
    };

    const mockGenerated = [
      {
        question: 'What is photosynthesis?',
        answer: 'Process of light energy conversion.',
        options: ['Respiration', 'Photosynthesis', 'Fermentation', 'Digestion'],
        type: 'multiple_choice',
        difficulty: 'medium',
      },
    ];

    const llmSpy = vi.spyOn(llmService, 'generateQuestionsFromContent').mockResolvedValue(mockGenerated);
    const dbSpy = vi.spyOn(Question, 'bulkCreate').mockResolvedValue([
      { id: 'q-1', ...mockGenerated[0], user: 'user-123', sourceTitle: 'Biology Notes' },
    ]);

    await generateQuestions(req, res, next);

    expect(llmSpy).toHaveBeenCalled();
    expect(dbSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          user: 'user-123',
          question: 'What is photosynthesis?',
          sourceTitle: 'Biology Notes',
        }),
      ])
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        count: 1,
      })
    );
  });

  test('fetches note content when noteId is provided and generates questions', async () => {
    req.body = { noteId: 'note-456' };

    const noteSpy = vi.spyOn(Note, 'findByPk').mockResolvedValue({
      id: 'note-456',
      title: 'Physics Optics',
      content: 'Refraction occurs when light passes from one medium to another.',
    });

    const mockGenerated = [
      {
        question: 'What is refraction?',
        answer: 'Bending of light waves.',
        options: [],
        type: 'short_answer',
        difficulty: 'easy',
      },
    ];

    vi.spyOn(llmService, 'generateQuestionsFromContent').mockResolvedValue(mockGenerated);
    vi.spyOn(Question, 'bulkCreate').mockResolvedValue([
      { id: 'q-2', ...mockGenerated[0], user: 'user-123', noteId: 'note-456' },
    ]);

    await generateQuestions(req, res, next);

    expect(noteSpy).toHaveBeenCalledWith('note-456');
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
