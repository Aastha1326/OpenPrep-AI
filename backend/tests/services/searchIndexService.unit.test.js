import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const path = require('path');
const { spawnSync } = require('child_process');

const searchIndex = require('../../services/searchIndexService');

const {
  textFor,
  embedWithRetry,
  indexRecord,
  removeRecord,
  enqueueIndex,
  getUserRecords,
  clearUserIndex,
  isUserLoaded,
  markUserLoaded,
  pendingCount,
  size,
  drain,
  shutdown,
  reset,
  MAX_INDEX_ENTRIES,
} = searchIndex;

/** The two error classes geminiService re-throws instead of degrading. */
class GeminiRateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'GeminiRateLimitError';
  }
}

/** No real backoff in tests. */
const noSleep = async () => {};

function makeNote(overrides = {}) {
  return {
    id: 'note-1',
    user: 'user-1',
    title: 'Photosynthesis',
    content: 'Light reactions occur in the thylakoid membrane.',
    tags: ['biology'],
    subject: 'Biology',
    ...overrides,
  };
}

beforeEach(() => {
  reset();
});

afterEach(() => {
  reset();
  vi.restoreAllMocks();
});

describe('searchIndexService — textFor', () => {
  it('joins the searchable fields of a question', () => {
    const text = textFor('question', {
      question: 'What is 2 + 2?',
      answer: '4',
      options: ['3', '4'],
    });

    expect(text).toBe('What is 2 + 2? 4 3 4');
  });

  it('joins the searchable fields of a flashcard', () => {
    expect(textFor('flashcard', { front: 'Mitosis', back: 'Cell division', tags: ['bio'] })).toBe(
      'Mitosis Cell division bio'
    );
  });

  it('joins the searchable fields of a note', () => {
    expect(textFor('note', { title: 'A', content: 'B', tags: ['c'] })).toBe('A B c');
  });

  it('skips missing fields rather than emitting undefined', () => {
    expect(textFor('note', { title: 'Only a title' })).toBe('Only a title');
  });
});

describe('searchIndexService — embedWithRetry', () => {
  it('returns the embedding on the first success', async () => {
    const ai = { generateEmbedding: vi.fn(async () => [0.1, 0.2]) };

    await expect(embedWithRetry('some text', { ai, sleep: noSleep })).resolves.toEqual([0.1, 0.2]);
    expect(ai.generateEmbedding).toHaveBeenCalledOnce();
  });

  it('retries a transient failure and then succeeds', async () => {
    let calls = 0;
    const ai = {
      generateEmbedding: vi.fn(async () => {
        calls += 1;
        if (calls < 3) throw new GeminiRateLimitError();
        return [0.5];
      }),
    };

    await expect(embedWithRetry('text', { ai, sleep: noSleep })).resolves.toEqual([0.5]);
    expect(ai.generateEmbedding).toHaveBeenCalledTimes(3);
  });

  it('gives up with null rather than propagating the rejection', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ai = {
      generateEmbedding: vi.fn(async () => {
        throw new GeminiRateLimitError();
      }),
    };

    // Null is a usable outcome: the record is still indexed on its text.
    await expect(embedWithRetry('text', { ai, sleep: noSleep, maxAttempts: 3 })).resolves.toBeNull();
    expect(ai.generateEmbedding).toHaveBeenCalledTimes(3);
    expect(warn).toHaveBeenCalled();
  });

  it('backs off for longer on each attempt', async () => {
    const waits = [];
    const ai = {
      generateEmbedding: vi.fn(async () => {
        throw new Error('boom');
      }),
    };
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await embedWithRetry('text', {
      ai,
      maxAttempts: 3,
      sleep: async (ms) => {
        waits.push(ms);
      },
    });

    expect(waits).toHaveLength(2);
    expect(waits[1]).toBeGreaterThan(waits[0]);
  });

  it('honours a single-attempt configuration', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ai = { generateEmbedding: vi.fn(async () => { throw new Error('nope'); }) };

    await expect(embedWithRetry('t', { ai, sleep: noSleep, maxAttempts: 1 })).resolves.toBeNull();
    expect(ai.generateEmbedding).toHaveBeenCalledTimes(1);
  });
});

describe('searchIndexService — indexRecord', () => {
  it('stores a searchable projection of the record', () => {
    indexRecord('note', { ...makeNote(), embedding: [0.1] });

    const [record] = getUserRecords('user-1');
    expect(record).toMatchObject({
      id: 'note-1',
      user: 'user-1',
      type: 'note',
      subject: 'Biology',
      title: 'Photosynthesis',
      embedding: [0.1],
    });
    expect(record.text).toContain('thylakoid');
  });

  it('ignores a record with no id or no owner', () => {
    indexRecord('note', { user: 'user-1' });
    indexRecord('note', { id: 'x' });
    indexRecord('note', null);

    expect(size()).toBe(0);
  });

  it('replaces rather than duplicates on re-index', () => {
    indexRecord('note', makeNote());
    indexRecord('note', makeNote({ title: 'Photosynthesis, revised' }));

    const records = getUserRecords('user-1');
    expect(records).toHaveLength(1);
    expect(records[0].title).toBe('Photosynthesis, revised');
  });

  it('keeps entries for different users apart', () => {
    indexRecord('note', makeNote({ id: 'n1', user: 'user-1' }));
    indexRecord('note', makeNote({ id: 'n1', user: 'user-2' }));

    expect(getUserRecords('user-1')).toHaveLength(1);
    expect(getUserRecords('user-2')).toHaveLength(1);
    expect(size()).toBe(2);
  });

  it('keeps a null embedding rather than inventing one', () => {
    indexRecord('note', makeNote());

    expect(getUserRecords('user-1')[0].embedding).toBeNull();
  });
});

describe('searchIndexService — bounded growth', () => {
  it('evicts the least recently indexed entry past the cap', () => {
    // The index was unbounded: every user who searched left up to 750 records,
    // each with a full embedding vector, resident for the life of the process.
    for (let i = 0; i < MAX_INDEX_ENTRIES + 10; i += 1) {
      indexRecord('note', makeNote({ id: `note-${i}` }));
    }

    expect(size()).toBe(MAX_INDEX_ENTRIES);

    const ids = getUserRecords('user-1').map((record) => record.id);
    expect(ids).not.toContain('note-0');
    expect(ids).toContain(`note-${MAX_INDEX_ENTRIES + 9}`);
  });

  it('treats a re-index as a use, so a hot record is not evicted', () => {
    indexRecord('note', makeNote({ id: 'hot' }));

    for (let i = 0; i < MAX_INDEX_ENTRIES - 1; i += 1) {
      indexRecord('note', makeNote({ id: `filler-${i}` }));
    }

    // Touch the oldest entry, then push the index over the cap.
    indexRecord('note', makeNote({ id: 'hot' }));
    indexRecord('note', makeNote({ id: 'overflow' }));

    const ids = getUserRecords('user-1').map((record) => record.id);
    expect(ids).toContain('hot');
    expect(ids).not.toContain('filler-0');
  });
});

describe('searchIndexService — enqueueIndex', () => {
  it('indexes the record with its embedding', async () => {
    const ai = { generateEmbedding: vi.fn(async () => [0.9]) };

    await enqueueIndex('note', makeNote(), { ai, sleep: noSleep });

    expect(getUserRecords('user-1')[0].embedding).toEqual([0.9]);
  });

  it('does not reject when the embedding provider rate-limits', async () => {
    // The regression. Question, Note and Flashcard all enqueue on afterSave,
    // and an unhandled rejection here terminated the process under Node's
    // default --unhandled-rejections=throw.
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ai = {
      generateEmbedding: vi.fn(async () => {
        throw new GeminiRateLimitError();
      }),
    };

    await expect(
      enqueueIndex('note', makeNote(), { ai, sleep: noSleep })
    ).resolves.toBeUndefined();
  });

  it('leaves no unhandled rejection on the process', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rejections = [];
    const listener = (reason) => rejections.push(reason);
    process.on('unhandledRejection', listener);

    try {
      const ai = {
        generateEmbedding: vi.fn(async () => {
          throw new GeminiRateLimitError('429 Too Many Requests');
        }),
      };

      await enqueueIndex('note', makeNote(), { ai, sleep: noSleep });
      // Give the microtask queue a turn to surface anything floating.
      await new Promise((resolve) => setImmediate(resolve));

      expect(rejections).toEqual([]);
    } finally {
      process.off('unhandledRejection', listener);
    }
  });

  it('still indexes the text when the embedding cannot be generated', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ai = {
      generateEmbedding: vi.fn(async () => {
        throw new GeminiRateLimitError();
      }),
    };

    await enqueueIndex('note', makeNote(), { ai, sleep: noSleep });

    const [record] = getUserRecords('user-1');
    // Keyword ranking still works; only the vector half is missing.
    expect(record).toBeDefined();
    expect(record.embedding).toBeNull();
    expect(record.text).toContain('thylakoid');
  });

  it('snapshots the record at enqueue time', async () => {
    const ai = { generateEmbedding: vi.fn(async () => [0.1]) };
    const note = makeNote();

    const queued = enqueueIndex('note', note, { ai, sleep: noSleep });
    // Mutating the live instance after enqueue must not change what is stored.
    note.title = 'Mutated after enqueue';
    await queued;

    expect(getUserRecords('user-1')[0].title).toBe('Photosynthesis');
  });

  it('calls toJSON when the record is a model instance', async () => {
    const ai = { generateEmbedding: vi.fn(async () => [0.1]) };
    const instance = {
      id: 'note-2',
      user: 'user-1',
      toJSON: vi.fn(() => makeNote({ id: 'note-2', title: 'From toJSON' })),
    };

    await enqueueIndex('note', instance, { ai, sleep: noSleep });

    expect(instance.toJSON).toHaveBeenCalled();
    expect(getUserRecords('user-1')[0].title).toBe('From toJSON');
  });

  it('coalesces repeated enqueues of the same record', async () => {
    const ai = { generateEmbedding: vi.fn(async () => [0.1]) };
    const note = makeNote();

    const first = enqueueIndex('note', note, { ai, sleep: noSleep });
    const second = enqueueIndex('note', note, { ai, sleep: noSleep });

    expect(second).toBe(first);
    await first;
    expect(ai.generateEmbedding).toHaveBeenCalledOnce();
  });

  it('ignores a record with no id', async () => {
    const ai = { generateEmbedding: vi.fn() };

    await enqueueIndex('note', { user: 'user-1' }, { ai });

    expect(ai.generateEmbedding).not.toHaveBeenCalled();
    expect(size()).toBe(0);
  });

  it('ignores a record with no owner', async () => {
    const ai = { generateEmbedding: vi.fn() };

    await enqueueIndex('note', { id: 'note-1' }, { ai });

    expect(ai.generateEmbedding).not.toHaveBeenCalled();
    expect(size()).toBe(0);
  });
});

describe('searchIndexService — removeRecord', () => {
  it('drops a deleted record from the index', () => {
    indexRecord('note', makeNote());
    removeRecord('note', { id: 'note-1', user: 'user-1' });

    expect(getUserRecords('user-1')).toHaveLength(0);
  });

  it('is a no-op for an unknown record', () => {
    indexRecord('note', makeNote());
    removeRecord('note', { id: 'other', user: 'user-1' });
    removeRecord('note', {});

    expect(getUserRecords('user-1')).toHaveLength(1);
  });
});

describe('searchIndexService — user load state', () => {
  it('tracks which users have been fully loaded', () => {
    expect(isUserLoaded('user-1')).toBe(false);
    markUserLoaded('user-1');
    expect(isUserLoaded('user-1')).toBe(true);
  });

  it('compares ids as strings', () => {
    markUserLoaded(7);
    expect(isUserLoaded('7')).toBe(true);
  });

  it('clearUserIndex drops that user’s records and its loaded flag', () => {
    indexRecord('note', makeNote({ user: 'user-1' }));
    indexRecord('note', makeNote({ id: 'n2', user: 'user-2' }));
    markUserLoaded('user-1');

    clearUserIndex('user-1');

    expect(getUserRecords('user-1')).toHaveLength(0);
    expect(getUserRecords('user-2')).toHaveLength(1);
    expect(isUserLoaded('user-1')).toBe(false);
  });
});

describe('searchIndexService — shutdown', () => {
  it('drain waits for queued work to finish', async () => {
    const ai = { generateEmbedding: vi.fn(async () => [0.1]) };

    enqueueIndex('note', makeNote({ id: 'a' }), { ai, sleep: noSleep });
    enqueueIndex('note', makeNote({ id: 'b' }), { ai, sleep: noSleep });
    expect(pendingCount()).toBe(2);

    await drain();

    expect(pendingCount()).toBe(0);
    expect(getUserRecords('user-1')).toHaveLength(2);
  });

  it('shutdown cancels queued work without running it', async () => {
    const ai = { generateEmbedding: vi.fn(async () => [0.1]) };

    enqueueIndex('note', makeNote(), { ai, sleep: noSleep });
    expect(pendingCount()).toBe(1);

    shutdown();

    expect(pendingCount()).toBe(0);
    await new Promise((resolve) => setImmediate(resolve));
    // The timer never fired, so nothing reached the provider or the index.
    expect(ai.generateEmbedding).not.toHaveBeenCalled();
    expect(size()).toBe(0);
  });

  it('drain is safe with nothing queued', async () => {
    await expect(drain()).resolves.toBeUndefined();
  });
});

describe('searchIndexService — in a real process', () => {
  // Vitest keeps the event loop alive for the whole run, which hides two
  // failure modes: a rejection that would terminate a bare process, and a
  // queued write that never fires because nothing is holding the loop open.
  // Both need a child process to observe.
  const BACKEND_ROOT = path.join(__dirname, '..', '..');

  function runScript(body) {
    return spawnSync(process.execPath, ['-e', body], {
      cwd: BACKEND_ROOT,
      encoding: 'utf8',
      env: { ...process.env, DATABASE_URL: 'postgres://u:p@localhost:5432/x' },
      timeout: 20000,
    });
  }

  const SCRIPT = `
    const searchIndex = require('./services/searchIndexService');
    class RateLimit extends Error {
      constructor(m) { super(m); this.name = 'GeminiRateLimitError'; }
    }
    let crashed = false;
    process.on('unhandledRejection', () => { crashed = true; });
    (async () => {
      await searchIndex.enqueueIndex(
        'note',
        { id: 'n1', user: 'u1', title: 'T', content: 'Thylakoid', tags: [] },
        {
          ai: { generateEmbedding: async () => { throw new RateLimit('429'); } },
          sleep: async () => {},
        }
      );
      await new Promise((r) => setImmediate(r));
      const records = searchIndex.getUserRecords('u1');
      console.log(JSON.stringify({
        crashed,
        indexed: records.length,
        embedding: records[0] ? records[0].embedding : 'MISSING',
      }));
      searchIndex.shutdown();
      process.exit(crashed ? 1 : 0);
    })();
  `;

  it('survives a rate-limited embedding instead of terminating', () => {
    const result = runScript(SCRIPT);
    const line = result.stdout.split('\n').find((entry) => entry.startsWith('{'));

    // Without a handler this exits non-zero on Node's default
    // --unhandled-rejections=throw.
    expect(result.status).toBe(0);
    expect(line, `no result line in stdout:\n${result.stdout}\n${result.stderr}`).toBeTruthy();

    const outcome = JSON.parse(line);
    expect(outcome.crashed).toBe(false);
    expect(outcome.indexed).toBe(1);
    expect(outcome.embedding).toBeNull();
  });

  it('does not drop queued work when the event loop is otherwise idle', () => {
    // An unref'd timer would let the process exit before the callback ran, so
    // the record would never be indexed and drain() would wait forever on a
    // promise that never settles.
    const result = runScript(SCRIPT);
    const line = result.stdout.split('\n').find((entry) => entry.startsWith('{'));

    expect(line).toBeTruthy();
    expect(JSON.parse(line).indexed).toBe(1);
  });
});
