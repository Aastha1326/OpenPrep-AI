import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * The controller destructures its collaborators at require time and calls
 * through them at request time, so replacing a method on the shared CommonJS
 * module object stands them in. Not vi.mock — CONTRIBUTING.md is right that it
 * cannot intercept a CJS require — the same objects, already shared.
 */
const models = require('../../models');
const hybridSearchService = require('../../services/hybridSearchService');
const searchController = require('../../controllers/searchController');

const ORIGINALS = {
  search: hybridSearchService.search,
  topicFindAll: models.Topic.findAll,
  deckFindAll: models.FlashcardDeck.findAll,
  quizFindAll: models.Quiz.findAll,
  planFindAll: models.StudyPlan.findAll,
};

class GeminiRateLimitError extends Error {
  constructor(message = '429 Too Many Requests') {
    super(message);
    this.name = 'GeminiRateLimitError';
  }
}

function makeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

/** Stub the four SQL searches so no database is involved. */
function stubSqlSearches() {
  models.Topic.findAll = vi.fn(async () => [{ id: 't1', name: 'Thermodynamics', subject: 'Physics' }]);
  models.FlashcardDeck.findAll = vi.fn(async () => [{ id: 'd1', name: 'Thermo deck', subject: 'Physics' }]);
  models.Quiz.findAll = vi.fn(async () => [{ id: 'q1', title: 'Thermo quiz', subject: 'Physics' }]);
  models.StudyPlan.findAll = vi.fn(async () => [
    { id: 'p1', dailyGoals: [{ title: 'Revise thermo', completed: false }] },
  ]);
}

beforeEach(() => {
  stubSqlSearches();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  hybridSearchService.search = ORIGINALS.search;
  models.Topic.findAll = ORIGINALS.topicFindAll;
  models.FlashcardDeck.findAll = ORIGINALS.deckFindAll;
  models.Quiz.findAll = ORIGINALS.quizFindAll;
  models.StudyPlan.findAll = ORIGINALS.planFindAll;
  vi.restoreAllMocks();
});

describe('globalSearch — empty query', () => {
  it('returns every empty group without querying anything', async () => {
    const res = makeRes();
    hybridSearchService.search = vi.fn();

    await searchController.globalSearch({ query: { q: '  ' }, user: { id: 'u1' } }, res, vi.fn());

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual({ results: [], topics: [], decks: [], quizzes: [], tasks: [] });
    expect(hybridSearchService.search).not.toHaveBeenCalled();
  });
});

describe('globalSearch — happy path', () => {
  it('returns the hybrid results alongside the SQL groups', async () => {
    const res = makeRes();
    hybridSearchService.search = vi.fn(async () => [{ id: 'n1', type: 'note', title: 'Thermo notes' }]);

    await searchController.globalSearch(
      { query: { q: 'thermo' }, user: { id: 'u1' } },
      res,
      vi.fn()
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.data.results).toHaveLength(1);
    expect(res.body.data.topics).toHaveLength(1);
    expect(res.body.data.decks).toHaveLength(1);
    expect(res.body.data.quizzes).toHaveLength(1);
    expect(res.body.data.tasks).toHaveLength(1);
  });

  it('passes the type and subject filters through', async () => {
    const res = makeRes();
    hybridSearchService.search = vi.fn(async () => []);

    await searchController.globalSearch(
      { query: { q: 'thermo', type: 'flashcard', subject: 'Physics' }, user: { id: 'u1' } },
      res,
      vi.fn()
    );

    expect(hybridSearchService.search).toHaveBeenCalledWith({
      userId: 'u1',
      query: 'thermo',
      type: 'flashcard',
      subject: 'Physics',
    });
  });

  it('defaults the type filter to all', async () => {
    const res = makeRes();
    hybridSearchService.search = vi.fn(async () => []);

    await searchController.globalSearch({ query: { q: 'x' }, user: { id: 'u1' } }, res, vi.fn());

    expect(hybridSearchService.search.mock.calls[0][0].type).toBe('all');
  });
});

describe('globalSearch — hybrid search is best-effort', () => {
  it('still returns the SQL groups when the engine rate-limits', async () => {
    // Before the guard, one 429 from the embedding provider failed the whole
    // endpoint, including the four groups that never needed AI at all.
    const res = makeRes();
    hybridSearchService.search = vi.fn(async () => {
      throw new GeminiRateLimitError();
    });
    const next = vi.fn();

    await searchController.globalSearch(
      { query: { q: 'thermo' }, user: { id: 'u1' } },
      res,
      next
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results).toEqual([]);
    expect(res.body.data.topics).toHaveLength(1);
    expect(res.body.data.decks).toHaveLength(1);
    expect(res.body.data.quizzes).toHaveLength(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('degrades on any engine failure, not just rate limits', async () => {
    const res = makeRes();
    hybridSearchService.search = vi.fn(async () => {
      throw new TypeError('Cannot read properties of undefined');
    });

    await searchController.globalSearch({ query: { q: 'thermo' }, user: { id: 'u1' } }, res, vi.fn());

    expect(res.statusCode).toBe(200);
    expect(res.body.data.results).toEqual([]);
  });

  it('does not swallow a genuine database failure', async () => {
    // Degrading is for the AI half only. If the SQL half breaks, that is a
    // real 500 and the error middleware should see it.
    const res = makeRes();
    hybridSearchService.search = vi.fn(async () => []);
    models.Topic.findAll = vi.fn(async () => {
      throw new Error('connect ECONNREFUSED');
    });
    const next = vi.fn();

    await searchController.globalSearch({ query: { q: 'thermo' }, user: { id: 'u1' } }, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toContain('ECONNREFUSED');
  });
});
