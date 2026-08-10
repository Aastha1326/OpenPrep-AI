import { describe, it, expect, beforeEach, vi } from 'vitest';
const { searchPYQs } = require('../../controllers/pyqController');
const PYQ = require('../../models/PYQ');
const Subject = require('../../models/Subject');

describe('pyqController.searchPYQs Unit Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.restoreAllMocks();
    req = {
      user: { id: '11111111-1111-4111-8111-111111111111' },
      query: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  it('should return 400 if search query is missing or empty', async () => {
    req.query = { q: '   ' };

    await searchPYQs(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Search query is required',
      })
    );
  });

  it('should return 400 if subjectId format is invalid', async () => {
    req.query = { q: 'recursion', subjectId: 'invalid-uuid' };

    await searchPYQs(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Invalid ID format',
      })
    );
  });

  it('should return 404 if subjectId is provided but subject does not exist', async () => {
    req.query = { q: 'recursion', subjectId: '22222222-2222-4222-8222-222222222222' };
    vi.spyOn(Subject, 'findByPk').mockResolvedValue(null);

    await searchPYQs(req, res, next);

    expect(Subject.findByPk).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Course/Subject not found',
      })
    );
  });

  it('should perform full-text search with tsvector/tsquery and return results with execution time', async () => {
    req.query = { q: 'Binary Tree Recursion', page: '1', limit: '10' };

    const mockPyqs = [
      {
        id: 'pyq-1',
        title: 'Binary Tree & Recursion Question Paper',
        year: 2024,
        chapters: ['Data Structures'],
      },
    ];

    vi.spyOn(PYQ, 'findAndCountAll').mockResolvedValue({
      count: 1,
      rows: mockPyqs,
    });

    await searchPYQs(req, res, next);

    expect(PYQ.findAndCountAll).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        count: 1,
        total: 1,
        page: 1,
        totalPages: 1,
        data: mockPyqs,
        queryExecutionTimeMs: expect.any(Number),
      })
    );
  });
});
