const { Question, Flashcard, Note } = require('../models');
const geminiService = require('./geminiService');
const searchIndex = require('./searchIndexService');

const INDEX_LIMIT = 250;
const RRF_K = 60;
const cache = new Map();

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

async function loadIndex(userId) {
  const existing = searchIndex.getUserRecords(userId);
  if (searchIndex.isUserLoaded(userId)) return existing;
  const [questions, flashcards, notes] = await Promise.all([
    Question.findAll({ where: { user: userId }, limit: INDEX_LIMIT }),
    Flashcard.findAll({ where: { user: userId }, limit: INDEX_LIMIT }),
    Note.findAll({ where: { user: userId }, limit: INDEX_LIMIT }),
  ]);
  const records = [
    ...questions.map((record) => ({ type: 'question', record })),
    ...flashcards.map((record) => ({ type: 'flashcard', record })),
    ...notes.map((record) => ({ type: 'note', record })),
  ];
  await Promise.all(records.map(async ({ type, record }) => {
    const text = type === 'question'
      ? [record.question, record.answer, ...(record.options || [])].filter(Boolean).join(' ')
      : type === 'flashcard'
        ? [record.front, record.back, ...(record.tags || [])].filter(Boolean).join(' ')
        : [record.title, record.content, ...(record.tags || [])].filter(Boolean).join(' ');
    searchIndex.indexRecord(type, { ...record.toJSON(), embedding: await geminiService.generateEmbedding(text) });
  }));
  searchIndex.markUserLoaded(userId);
  return searchIndex.getUserRecords(userId);
}

async function search({ userId, query, type = 'all', subject }) {
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) return [];
  const cacheKey = `${userId}:${type}:${subject || ''}:${normalizedQuery.toLocaleLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.results;

  const records = (await loadIndex(userId)).filter((record) => (
    (type === 'formulas' ? record.type === 'question' && /formula|[=\u2211\u221a^]/i.test(record.text) : type === 'all' || record.type === type)
    && (!subject || String(record.subject) === String(subject))
  ));
  const queryTokens = tokenize(normalizedQuery);
  const queryEmbedding = await geminiService.generateEmbedding(normalizedQuery);
  const averageDocumentLength = records.reduce((sum, record) => sum + tokenize(record.text).length, 0) / Math.max(records.length, 1);
  const documentFrequency = new Map(queryTokens.map((token) => [token, records.filter((record) => tokenize(record.text).includes(token)).length]));
  const keywordRanked = records.map((record) => {
    const tokens = tokenize(record.text);
    const lengthNormalization = 1.2 * (0.25 + 0.75 * (tokens.length / Math.max(averageDocumentLength, 1)));
    const frequency = queryTokens.reduce((total, token) => {
      const count = tokens.filter((item) => item === token || (item.length > 3 && editDistance(item, token) <= 1)).length;
      const idf = Math.log(1 + (records.length - (documentFrequency.get(token) || 0) + 0.5) / ((documentFrequency.get(token) || 0) + 0.5));
      return total + (count * (2.2 + 1) / (count + lengthNormalization)) * idf;
    }, 0);
    const phraseBonus = record.text.toLocaleLowerCase().includes(normalizedQuery.toLocaleLowerCase()) ? 2 : 0;
    return { record, score: frequency + phraseBonus };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
  const semanticRanked = records.map((record) => ({ record, score: cosine(queryEmbedding, record.embedding) }))
    .filter((item) => item.score > 0).sort((a, b) => b.score - a.score);

  const merged = new Map();
  keywordRanked.forEach(({ record }, rank) => merged.set(record.id + record.type, { record, score: (merged.get(record.id + record.type)?.score || 0) + 1 / (RRF_K + rank + 1) }));
  semanticRanked.forEach(({ record }, rank) => merged.set(record.id + record.type, { record, score: (merged.get(record.id + record.type)?.score || 0) + 1 / (RRF_K + rank + 1) }));

  const results = [...merged.values()].sort((a, b) => b.score - a.score).slice(0, 30).map(({ record, score }) => ({
    id: record.id,
    type: record.type,
    subject: record.subject,
    title: record.title,
    snippet: makeSnippet(record.text, normalizedQuery),
    relevance: Number(score.toFixed(5)),
    url: record.type === 'note' ? `/notes/${record.id}` : record.type === 'flashcard' ? `/flashcards/${record.id}` : `/questions/${record.id}`,
  }));
  cache.set(cacheKey, { results, expiresAt: Date.now() + 30000 });
  return results;
}

function clearCache() { cache.clear(); }
module.exports = { search, cosine, makeSnippet, clearCache };
