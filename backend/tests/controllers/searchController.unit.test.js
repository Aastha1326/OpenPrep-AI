const { semanticSearch } = require('../../controllers/searchController');
const { Note, Quiz } = require('../../models');
const embeddingService = require('../../services/embeddingService');
const { sequelize: db } = require('../../config/db');

describe('Search Controller - Semantic Hybrid Queries', () => {
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

  test('semanticSearch calls vector generator, runs DB queries and returns sorted list', async () => {
    vi.spyOn(embeddingService, 'generateVector').mockResolvedValue(Array(768).fill(0.15));

    vi.spyOn(db, 'query').mockImplementation(async (sql) => {
      if (sql.includes('"Notes"')) {
        return [
          { id: 'note-1', title: 'Calculus Limits', similarity: 0.85, lexicalScore: 1.0 }
        ];
      }
      if (sql.includes('"Quizzes"')) {
        return [
          { id: 'quiz-1', title: 'JEE Calculus Test', questions: [{}], similarity: 0.72, lexicalScore: 0.0 }
        ];
      }
      return [];
    });

    await semanticSearch(req, res, next);

    expect(embeddingService.generateVector).toHaveBeenCalledWith('Calculus proofs');
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          notes: expect.arrayContaining([
            expect.objectContaining({ id: 'note-1', score: 0.895 }) // (0.85 * 0.7) + (1.0 * 0.3) = 0.595 + 0.3 = 0.895
          ]),
          quizzes: expect.arrayContaining([
            expect.objectContaining({ id: 'quiz-1', score: 0.504 }) // (0.72 * 0.7) + (0.0 * 0.3) = 0.504
          ])
        })
      })
    );
  });

  test('semanticSearch runs lexical fallback if vector generation or DB queries fail', async () => {
    vi.spyOn(embeddingService, 'generateVector').mockRejectedValue(new Error('API quota limit'));

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
