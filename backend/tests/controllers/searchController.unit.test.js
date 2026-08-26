const { semanticSearch } = require('../../controllers/searchController');
const { Note, Quiz } = require('../../models');
const embeddingsProcessor = require('../../services/embeddingsProcessor');
const { sequelize: db } = require('../../config/db');

describe('Search Controller - Semantic Hybrid Queries using RRF', () => {
  let req, res, next;

  beforeEach(() => {
    vi.restoreAllMocks();

    req = {
      user: { id: 'user-321' },
      query: { q: 'Calculus proofs' }
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    next = vi.fn();
  });

  test('semanticSearch calls vector generator, runs DB queries and returns RRF sorted list', async () => {
    vi.spyOn(embeddingsProcessor, 'generateVector').mockResolvedValue(Array(768).fill(0.15));

    vi.spyOn(db, 'query').mockImplementation(async (sql) => {
      if (sql.includes('"Notes"')) {
        // Return 1 match for lexical and 1 match for vector
        return [
          { id: 'note-1', title: 'Calculus Limits', content: 'Formulas' }
        ];
      }
      if (sql.includes('"Quizzes"')) {
        return [
          { id: 'quiz-1', title: 'JEE Calculus Test', questions: [{}] }
        ];
      }
      return [];
    });

    await semanticSearch(req, res, next);

    expect(embeddingsProcessor.generateVector).toHaveBeenCalledWith('Calculus proofs');
    expect(db.query).toHaveBeenCalledTimes(4); // 2 notes queries + 2 quizzes queries
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          notes: expect.arrayContaining([
            expect.objectContaining({ id: 'note-1', score: 0.032787 }) // 1/61 + 1/61 = 0.032787
          ]),
          quizzes: expect.arrayContaining([
            expect.objectContaining({ id: 'quiz-1', score: 0.032787 }) // 1/61 + 1/61 = 0.032787
          ])
        })
      })
    );
  });

  test('semanticSearch runs lexical fallback if vector generation or DB queries fail', async () => {
    vi.spyOn(embeddingsProcessor, 'generateVector').mockRejectedValue(new Error('API quota limit'));

    vi.spyOn(Note, 'findAll').mockResolvedValue([
      { id: 'note-9', title: 'Calculus Notes', content: 'Limit functions.' }
    ]);
    vi.spyOn(Quiz, 'findAll').mockResolvedValue([
      { id: 'quiz-9', title: 'Calculus Quiz', questions: [{}, {}] }
    ]);

    await semanticSearch(req, res, next);

    expect(Note.findAll).toHaveBeenCalled();
    expect(Quiz.findAll).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          notes: expect.arrayContaining([
            expect.objectContaining({ id: 'note-9', score: 0 })
          ]),
          quizzes: expect.arrayContaining([
            expect.objectContaining({ id: 'quiz-9', score: 0 })
          ])
        })
      })
    );
  });
});
