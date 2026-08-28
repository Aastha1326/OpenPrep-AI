import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const hybridSearch = require('../../services/hybridSearchService');

const {
  tokenize,
  analyze,
  mapWithConcurrency,
  embedOrNull,
  loadIndex,
  rankByKeyword,
  rankBySemantic,
  fuse,
  cosine,
  makeSnippet,
  search,
  clearCache,
} = hybridSearch;

class GeminiRateLimitError extends Error {
  constructor(message = '429 Too Many Requests') {
    super(message);
    this.name = 'GeminiRateLimitError';
  }
}

function entry(overrides = {}) {
  return {
    id: 'r1',
    user: 'user-1',
    type: 'note',
    subject: 'Biology',
    title: 'Photosynthesis',
    text: 'Photosynthesis converts light energy into chemical energy',
    embedding: null,
    ...overrides,
  };
}

/** A searchIndex double that keeps entries in a plain array. */
function makeIndex(initial = []) {
  const records = [...initial];
  const loaded = new Set();

  return {
    records,
    loaded,
    indexRecord: vi.fn((type, record) => {
      records.push({ ...record, type, text: record.text ?? '' });
    }),
    getUserRecords: vi.fn(() => records),
    isUserLoaded: vi.fn((userId) => loaded.has(String(userId))),
    markUserLoaded: vi.fn((userId) => loaded.add(String(userId))),
  };
}

function makeModels(counts = { question: 0, flashcard: 0, note: 0 }) {
  const rows = (type, n) =>
    Array.from({ length: n }, (_, i) => ({
      id: `${type}-${i}`,
      user: 'user-1',
      title: `${type} ${i}`,
      content: `body of ${type} ${i}`,
      question: `question ${i}`,
      front: `front ${i}`,
      toJSON() {
        return { ...this };
      },
    }));

  return {
    Question: { findAll: vi.fn(async () => rows('question', counts.question)) },
    Flashcard: { findAll: vi.fn(async () => rows('flashcard', counts.flashcard)) },
    Note: { findAll: vi.fn(async () => rows('note', counts.note)) },
  };
}

beforeEach(() => {
  clearCache();
});

afterEach(() => {
  clearCache();
  vi.restoreAllMocks();
});

describe('hybridSearchService — tokenize', () => {
  it('lowercases, splits on non-alphanumerics and drops single characters', () => {
    expect(tokenize('Photosynthesis: light & CO2!')).toEqual(['photosynthesi', 'light', 'co2']);
  });

  it('stems only longer tokens', () => {
    expect(tokenize('running cats')).toEqual(['runn', 'cats']);
  });

  it('handles empty input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize(null)).toEqual([]);
  });
});

describe('hybridSearchService — analyze', () => {
  it('returns tokens, frequencies and a unique set', () => {
    const record = entry({ text: 'light light energy' });
    const { tokens, frequencies, unique } = analyze(record);

    expect(tokens).toEqual(['light', 'light', 'energy']);
    expect(frequencies.get('light')).toBe(2);
    expect(unique.has('energy')).toBe(true);
  });

  it('computes each entry at most once', () => {
    const record = entry();

    const first = analyze(record);
    const second = analyze(record);

    // Memoized against the entry object, so a repeated query does not
    // re-tokenize the corpus.
    expect(second).toBe(first);
  });

  it('re-analyses a fresh entry object for the same record', () => {
    // searchIndexService builds a new object on every re-index, which is what
    // makes the WeakMap self-invalidating when the text changes.
    const first = analyze(entry({ text: 'old text' }));
    const second = analyze(entry({ text: 'new text entirely' }));

    expect(second).not.toBe(first);
    expect(second.tokens).not.toEqual(first.tokens);
  });
});

describe('hybridSearchService — mapWithConcurrency', () => {
  it('processes every item', async () => {
    const results = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (n) => n * 2);

    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  it('never exceeds the concurrency limit', async () => {
    let inFlight = 0;
    let peak = 0;

    await mapWithConcurrency(Array.from({ length: 30 }, (_, i) => i), 4, async (n) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
      return n;
    });

    // The burst of 750 concurrent embedding calls is what turned a first
    // search into a 500.
    expect(peak).toBeLessThanOrEqual(4);
  });

  it('turns a rejection into null and keeps going', async () => {
    const results = await mapWithConcurrency([1, 2, 3], 2, async (n) => {
      if (n === 2) throw new GeminiRateLimitError();
      return n;
    });

    // Promise.all abandoned the other 749 records on the first rejection.
    expect(results).toEqual([1, null, 3]);
  });

  it('handles an empty list', async () => {
    await expect(mapWithConcurrency([], 4, async () => 1)).resolves.toEqual([]);
  });
});

describe('hybridSearchService — embedOrNull', () => {
  it('returns the embedding on success', async () => {
    const ai = { generateEmbedding: vi.fn(async () => [0.1, 0.2]) };

    await expect(embedOrNull('text', ai)).resolves.toEqual([0.1, 0.2]);
  });

  it('returns null instead of propagating a rate limit', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ai = {
      generateEmbedding: vi.fn(async () => {
        throw new GeminiRateLimitError();
      }),
    };

    await expect(embedOrNull('text', ai)).resolves.toBeNull();
  });
});

describe('hybridSearchService — loadIndex', () => {
  it('skips the load entirely for a user already loaded', async () => {
    const index = makeIndex([entry()]);
    index.loaded.add('user-1');
    const models = makeModels({ question: 5, flashcard: 5, note: 5 });

    await loadIndex('user-1', { models, index, searchIndex: index, ai: {} });

    expect(models.Question.findAll).not.toHaveBeenCalled();
  });

  it('indexes every record it loaded', async () => {
    const index = makeIndex();
    const models = makeModels({ question: 2, flashcard: 1, note: 3 });
    const ai = { generateEmbedding: vi.fn(async () => [0.1]) };

    await loadIndex('user-1', { models, searchIndex: index, ai, concurrency: 3 });

    expect(index.indexRecord).toHaveBeenCalledTimes(6);
    expect(index.markUserLoaded).toHaveBeenCalledWith('user-1');
  });

  it('keeps the concurrency cap on the embedding calls', async () => {
    const index = makeIndex();
    const models = makeModels({ question: 20, flashcard: 0, note: 0 });
    let inFlight = 0;
    let peak = 0;

    const ai = {
      generateEmbedding: vi.fn(async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 1));
        inFlight -= 1;
        return [0.1];
      }),
    };

    await loadIndex('user-1', { models, searchIndex: index, ai, concurrency: 5 });

    expect(peak).toBeLessThanOrEqual(5);
  });

  it('still indexes a record whose embedding failed', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const index = makeIndex();
    const models = makeModels({ question: 0, flashcard: 0, note: 2 });
    const ai = {
      generateEmbedding: vi.fn(async () => {
        throw new GeminiRateLimitError();
      }),
    };

    await loadIndex('user-1', { models, searchIndex: index, ai, concurrency: 2 });

    // Records stay findable by keyword; only the vector half is lost.
    expect(index.indexRecord).toHaveBeenCalledTimes(2);
    expect(index.indexRecord.mock.calls[0][1].embedding).toBeNull();
  });

  it('does not fail the whole load because one record failed', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const index = makeIndex();
    const models = makeModels({ question: 0, flashcard: 0, note: 4 });
    let call = 0;
    const ai = {
      generateEmbedding: vi.fn(async () => {
        call += 1;
        if (call === 2) throw new GeminiRateLimitError();
        return [0.1];
      }),
    };

    await expect(
      loadIndex('user-1', { models, searchIndex: index, ai, concurrency: 1 })
    ).resolves.toBeDefined();
    expect(index.indexRecord).toHaveBeenCalledTimes(4);
  });
});

describe('hybridSearchService — rankByKeyword', () => {
  const corpus = [
    entry({ id: 'a', text: 'photosynthesis light reactions thylakoid membrane' }),
    entry({ id: 'b', text: 'mitosis chromosome separation spindle' }),
    entry({ id: 'c', text: 'photosynthesis calvin cycle carbon fixation' }),
  ];

  it('ranks matching records above non-matching ones', () => {
    const ranked = rankByKeyword(corpus, tokenize('photosynthesis'), 'photosynthesis');

    expect(ranked.map((item) => item.record.id).sort()).toEqual(['a', 'c']);
  });

  it('drops records with no match at all', () => {
    const ranked = rankByKeyword(corpus, tokenize('thermodynamics'), 'thermodynamics');

    expect(ranked).toEqual([]);
  });

  it('gives a phrase match a bonus', () => {
    const ranked = rankByKeyword(corpus, tokenize('calvin cycle'), 'calvin cycle');

    expect(ranked[0].record.id).toBe('c');
  });

  it('still matches a single-character typo', () => {
    // "membrame" is edit distance 1 from "membrane".
    const ranked = rankByKeyword(corpus, tokenize('membrame'), 'membrame');

    expect(ranked.map((item) => item.record.id)).toContain('a');
  });

  it('does not fuzzy-match a word that is genuinely different', () => {
    const ranked = rankByKeyword(corpus, tokenize('elephant'), 'elephant');

    expect(ranked).toEqual([]);
  });

  it('tokenizes each record once regardless of query length', () => {
    const records = [entry({ id: 'x', text: 'alpha beta gamma delta epsilon' })];
    analyze(records[0]);
    const before = analyze(records[0]);

    rankByKeyword(records, tokenize('alpha beta gamma delta epsilon zeta'), 'alpha beta');

    // The old code re-tokenized every document once per query token, plus once
    // for the average length, plus once more for scoring.
    expect(analyze(records[0])).toBe(before);
  });
});

describe('hybridSearchService — rankBySemantic', () => {
  it('ranks by cosine similarity', () => {
    const records = [
      entry({ id: 'near', embedding: [1, 0] }),
      entry({ id: 'far', embedding: [0, 1] }),
    ];

    const ranked = rankBySemantic(records, [1, 0.1]);

    expect(ranked[0].record.id).toBe('near');
  });

  it('returns nothing when the query embedding is missing', () => {
    const records = [entry({ embedding: [1, 0] })];

    expect(rankBySemantic(records, null)).toEqual([]);
    expect(rankBySemantic(records, [])).toEqual([]);
  });

  it('skips records with no embedding', () => {
    const records = [entry({ id: 'no-vector', embedding: null })];

    expect(rankBySemantic(records, [1, 0])).toEqual([]);
  });
});

describe('hybridSearchService — fuse', () => {
  it('rewards a record ranked by both strategies', () => {
    const a = entry({ id: 'a' });
    const b = entry({ id: 'b' });
    const c = entry({ id: 'c' });

    const fused = fuse([
      [{ record: a }, { record: b }],
      [{ record: c }, { record: a }],
    ]);

    expect(fused[0].record.id).toBe('a');
  });

  it('keys on type and id so two records cannot collide', () => {
    // `record.id + record.type` was string concatenation, which is a weaker
    // key than it looks.
    const fused = fuse([
      [{ record: entry({ id: '1', type: 'note' }) }, { record: entry({ id: '1', type: 'question' }) }],
    ]);

    expect(fused).toHaveLength(2);
  });
});

describe('hybridSearchService — cosine and makeSnippet', () => {
  it('scores identical vectors at 1', () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it('scores mismatched or empty vectors at 0', () => {
    expect(cosine([1, 2], [1, 2, 3])).toBe(0);
    expect(cosine(null, [1])).toBe(0);
    expect(cosine([], [])).toBe(0);
  });

  it('escapes the source text before highlighting', () => {
    const snippet = makeSnippet('<script>alert(1)</script> photosynthesis', 'photosynthesis');

    expect(snippet).not.toContain('<script>');
    expect(snippet).toContain('&lt;script&gt;');
    // Highlighting runs on stemmed terms, so the mark covers the stem.
    expect(snippet).toContain('<mark>photosynthesi</mark>');
  });
});

describe('hybridSearchService — search', () => {
  it('returns nothing for an empty query without touching the index', async () => {
    const index = makeIndex();

    await expect(search({ userId: 'user-1', query: '   ' }, { searchIndex: index })).resolves.toEqual([]);
    expect(index.getUserRecords).not.toHaveBeenCalled();
  });

  it('returns ranked results with a highlighted snippet', async () => {
    const index = makeIndex([
      entry({ id: 'a', text: 'photosynthesis light reactions', embedding: [1, 0] }),
      entry({ id: 'b', text: 'mitosis spindle', embedding: [0, 1] }),
    ]);
    index.loaded.add('user-1');
    const ai = { generateEmbedding: vi.fn(async () => [1, 0]) };

    const results = await search({ userId: 'user-1', query: 'photosynthesis' }, { searchIndex: index, ai });

    expect(results[0].id).toBe('a');
    expect(results[0].snippet).toContain('<mark>');
    expect(results[0].url).toBe('/notes/a');
  });

  it('still returns keyword results when the query embedding fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const index = makeIndex([entry({ id: 'a', text: 'photosynthesis light reactions' })]);
    index.loaded.add('user-1');
    const ai = {
      generateEmbedding: vi.fn(async () => {
        throw new GeminiRateLimitError();
      }),
    };

    const results = await search({ userId: 'user-1', query: 'photosynthesis' }, { searchIndex: index, ai });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a');
  });

  it('filters by type', async () => {
    const index = makeIndex([
      entry({ id: 'n', type: 'note', text: 'photosynthesis notes' }),
      entry({ id: 'q', type: 'question', text: 'photosynthesis question' }),
    ]);
    index.loaded.add('user-1');
    const ai = { generateEmbedding: vi.fn(async () => null) };

    const results = await search(
      { userId: 'user-1', query: 'photosynthesis', type: 'question' },
      { searchIndex: index, ai }
    );

    expect(results.map((item) => item.id)).toEqual(['q']);
  });

  it('filters by subject', async () => {
    const index = makeIndex([
      entry({ id: 'bio', subject: 'Biology', text: 'energy transfer' }),
      entry({ id: 'phys', subject: 'Physics', text: 'energy transfer' }),
    ]);
    index.loaded.add('user-1');
    const ai = { generateEmbedding: vi.fn(async () => null) };

    const results = await search(
      { userId: 'user-1', query: 'energy', subject: 'Physics' },
      { searchIndex: index, ai }
    );

    expect(results.map((item) => item.id)).toEqual(['phys']);
  });

  it('serves a repeated query from cache', async () => {
    const index = makeIndex([entry({ id: 'a', text: 'photosynthesis' })]);
    index.loaded.add('user-1');
    const ai = { generateEmbedding: vi.fn(async () => null) };

    await search({ userId: 'user-1', query: 'photosynthesis' }, { searchIndex: index, ai });
    await search({ userId: 'user-1', query: 'photosynthesis' }, { searchIndex: index, ai });

    expect(ai.generateEmbedding).toHaveBeenCalledOnce();
  });

  it('returns nothing when the user has no matching records', async () => {
    const index = makeIndex([]);
    index.loaded.add('user-1');

    await expect(
      search({ userId: 'user-1', query: 'anything' }, { searchIndex: index, ai: {} })
    ).resolves.toEqual([]);
  });
});
