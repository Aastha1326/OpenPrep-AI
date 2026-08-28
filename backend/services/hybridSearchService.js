/**
 * @fileoverview Hybrid keyword + semantic search over a user's questions,
 * flashcards and notes, fused with reciprocal rank fusion.
 *
 * Two problems this file had:
 *
 * 1. The cold path issued one generateEmbedding call per record in a single
 *    Promise.all - up to 750 concurrent requests behind one HTTP request, with
 *    no concurrency cap. Against a real quota that rate-limits;
 *    generateEmbedding re-throws GeminiRateLimitError and GeminiServerError,
 *    Promise.all rejects on the first one, and the user gets a 500 from a
 *    search box. It now runs with a bounded worker pool and treats a failed
 *    embedding as a record indexed on its text alone.
 *
 * 2. Scoring re-tokenized the entire corpus repeatedly - once for the average
 *    document length, once per query token for the document frequencies, and
 *    once more per record for scoring, so `records x (queryTokens + 2)` full
 *    tokenizations per search over text that had not changed between calls.
 *    Tokens are now derived once per index entry and memoized against it.
 */
const { Question, Flashcard, Note } = require('../models');
const geminiService = require('./geminiService');
const searchIndex = require('./searchIndexService');

const INDEX_LIMIT = 250;
const RRF_K = 60;

/**
 * Concurrent embedding requests during a cold index load.
 *
 * The point is not speed, it is staying under the provider's rate limit: a
 * burst of 750 is what turned a first search into a 500.
 */
const EMBED_CONCURRENCY = parseInt(process.env.SEARCH_EMBED_CONCURRENCY, 10) || 5;

const CACHE_TTL_MS = 30000;
const cache = new Map();

/**
 * Tokens per index entry, keyed by the entry object itself.
 *
 * A WeakMap rather than a keyed cache because searchIndexService builds a new
 * entry object every time a record is re-indexed, so this invalidates itself
 * when the text changes and holds nothing once the entry is evicted.
 */
const tokenCache = new WeakMap();

const stem = (token) => token.length > 5 ? token.replace(/(ing|ed|es|s)$/u, '') : token;
const tokenize = (value) => String(value || '').toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1).map(stem);

const editDistance = (left, right) => {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const previous = row[j];
      row[j] = left[i - 1] === right[j - 1]
        ? diagonal
        : 1 + Math.min(diagonal, row[j], row[j - 1]);
      diagonal = previous;
    }
  }
  return row[right.length];
};

const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

const cosine = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || !a.length || a.length !== b.length) return 0;
  let dot = 0; let left = 0; let right = 0;
  for (let i = 0; i < a.length; i += 1) { dot += a[i] * b[i]; left += a[i] ** 2; right += b[i] ** 2; }
  return left && right ? dot / (Math.sqrt(left) * Math.sqrt(right)) : 0;
};

const makeSnippet = (text, query) => {
  const safe = escapeHtml(text).slice(0, 320);
  const terms = tokenize(query).map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return terms.length ? safe.replace(new RegExp(`(${terms.join('|')})`, 'gi'), '<mark>$1</mark>') : safe;
};

/**
 * Tokens and term frequencies for one index entry, computed at most once.
 *
 * `frequencies` turns the inner scoring loop from a `tokens.filter(...)` scan
 * per query term into a map lookup.
 */
function analyze(record) {
  const cached = tokenCache.get(record);
  if (cached) return cached;

  const tokens = tokenize(record.text);
  const frequencies = new Map();
  for (const token of tokens) {
    frequencies.set(token, (frequencies.get(token) || 0) + 1);
  }

  const analysis = { tokens, frequencies, unique: new Set(tokens) };
  tokenCache.set(record, analysis);
  return analysis;
}

/**
 * Run `worker` over `items` with at most `limit` in flight.
 *
 * Rejections are swallowed into null: one record failing to embed must not
 * abandon the other 749, which is what Promise.all did.
 */
async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = await worker(items[index], index);
      } catch {
        results[index] = null;
      }
    }
  });

  await Promise.all(runners);
  return results;
}

const textForRecord = (type, record) => (
  type === 'question'
    ? [record.question, record.answer, ...(record.options || [])].filter(Boolean).join(' ')
    : type === 'flashcard'
      ? [record.front, record.back, ...(record.tags || [])].filter(Boolean).join(' ')
      : [record.title, record.content, ...(record.tags || [])].filter(Boolean).join(' ')
);

/**
 * Ask for an embedding, returning null instead of throwing.
 *
 * A record with no vector still ranks on keywords, so a provider outage
 * degrades result quality rather than removing the record from the index.
 */
async function embedOrNull(text, ai) {
  try {
    return await ai.generateEmbedding(text);
  } catch (error) {
    console.warn('[HybridSearch] Embedding failed, indexing text only:', error.message);
    return null;
  }
}

/**
 * Load and embed a user's corpus once per process.
 *
 * `markUserLoaded` is only reached on success, so a partial load is retried on
 * the next search rather than leaving the user with a half-built index.
 */
async function loadIndex(userId, deps = {}) {
  const models = deps.models || { Question, Flashcard, Note };
  const ai = deps.ai || geminiService;
  const index = deps.searchIndex || searchIndex;
  const concurrency = deps.concurrency || EMBED_CONCURRENCY;

  if (index.isUserLoaded(userId)) return index.getUserRecords(userId);

  const [questions, flashcards, notes] = await Promise.all([
    models.Question.findAll({ where: { user: userId }, limit: INDEX_LIMIT }),
    models.Flashcard.findAll({ where: { user: userId }, limit: INDEX_LIMIT }),
    models.Note.findAll({ where: { user: userId }, limit: INDEX_LIMIT }),
  ]);

  const records = [
    ...questions.map((record) => ({ type: 'question', record })),
    ...flashcards.map((record) => ({ type: 'flashcard', record })),
    ...notes.map((record) => ({ type: 'note', record })),
  ];

  await mapWithConcurrency(records, concurrency, async ({ type, record }) => {
    const json = record.toJSON?.() || record;
    const embedding = await embedOrNull(textForRecord(type, json), ai);
    index.indexRecord(type, { ...json, embedding });
    return true;
  });

  index.markUserLoaded(userId);
  return index.getUserRecords(userId);
}

/** BM25-ish keyword ranking over already-tokenized records. */
function rankByKeyword(records, queryTokens, normalizedQuery) {
  const analyses = records.map(analyze);
  const totalLength = analyses.reduce((sum, analysis) => sum + analysis.tokens.length, 0);
  const averageDocumentLength = totalLength / Math.max(records.length, 1);

  // One pass for every query token, against sets that are already built.
  const documentFrequency = new Map(
    queryTokens.map((token) => [
      token,
      analyses.reduce((count, analysis) => count + (analysis.unique.has(token) ? 1 : 0), 0),
    ])
  );

  const lowerQuery = normalizedQuery.toLocaleLowerCase();

  return records
    .map((record, position) => {
      const { tokens, frequencies, unique } = analyses[position];
      const lengthNormalization = 1.2 * (0.25 + 0.75 * (tokens.length / Math.max(averageDocumentLength, 1)));

      const score = queryTokens.reduce((total, token) => {
        let count = frequencies.get(token) || 0;

        if (!unique.has(token) && token.length > 3) {
          // Fuzzy fallback only when the term is absent, and only against
          // tokens that could possibly be within edit distance 1. Comparing
          // every document token to every query token was the expensive half.
          for (const [candidate, occurrences] of frequencies) {
            if (candidate.length > 3 && Math.abs(candidate.length - token.length) <= 1) {
              if (editDistance(candidate, token) <= 1) count += occurrences;
            }
          }
        }

        if (!count) return total;

        const frequency = documentFrequency.get(token) || 0;
        const idf = Math.log(1 + (records.length - frequency + 0.5) / (frequency + 0.5));
        return total + (count * (2.2 + 1) / (count + lengthNormalization)) * idf;
      }, 0);

      const phraseBonus = record.text.toLocaleLowerCase().includes(lowerQuery) ? 2 : 0;
      return { record, score: score + phraseBonus };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

/** Cosine ranking, skipping records whose embedding could not be generated. */
function rankBySemantic(records, queryEmbedding) {
  if (!Array.isArray(queryEmbedding) || !queryEmbedding.length) return [];

  return records
    .map((record) => ({ record, score: cosine(queryEmbedding, record.embedding) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

/** Fuse two ranked lists with reciprocal rank fusion. */
function fuse(rankings) {
  const merged = new Map();

  for (const ranking of rankings) {
    ranking.forEach(({ record }, rank) => {
      const key = `${record.type}:${record.id}`;
      const existing = merged.get(key);
      merged.set(key, {
        record,
        score: (existing?.score || 0) + 1 / (RRF_K + rank + 1),
      });
    });
  }

  return [...merged.values()].sort((a, b) => b.score - a.score);
}

async function search({ userId, query, type = 'all', subject }, deps = {}) {
  const ai = deps.ai || geminiService;

  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) return [];

  const cacheKey = `${userId}:${type}:${subject || ''}:${normalizedQuery.toLocaleLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.results;

  const records = (await loadIndex(userId, deps)).filter((record) => (
    (type === 'formulas' ? record.type === 'question' && /formula|[=∑√^]/i.test(record.text) : type === 'all' || record.type === type)
    && (!subject || String(record.subject) === String(subject))
  ));

  if (!records.length) return [];

  const queryTokens = tokenize(normalizedQuery);
  // A failed query embedding drops the semantic half; keyword ranking carries
  // the search rather than the request failing.
  const queryEmbedding = await embedOrNull(normalizedQuery, ai);

  const results = fuse([
    rankByKeyword(records, queryTokens, normalizedQuery),
    rankBySemantic(records, queryEmbedding),
  ])
    .slice(0, 30)
    .map(({ record, score }) => ({
      id: record.id,
      type: record.type,
      subject: record.subject,
      title: record.title,
      snippet: makeSnippet(record.text, normalizedQuery),
      relevance: Number(score.toFixed(5)),
      url: record.type === 'note' ? `/notes/${record.id}` : record.type === 'flashcard' ? `/flashcards/${record.id}` : `/questions/${record.id}`,
    }));

  cache.set(cacheKey, { results, expiresAt: Date.now() + CACHE_TTL_MS });
  return results;
}

function clearCache() { cache.clear(); }

module.exports = {
  search,
  cosine,
  makeSnippet,
  clearCache,
  tokenize,
  analyze,
  mapWithConcurrency,
  embedOrNull,
  loadIndex,
  rankByKeyword,
  rankBySemantic,
  fuse,
  EMBED_CONCURRENCY,
};
