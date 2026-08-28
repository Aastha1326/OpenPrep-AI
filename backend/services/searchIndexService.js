/**
 * @fileoverview In-memory search index for a user's questions, flashcards and
 * notes, kept warm by afterSave hooks on those models.
 *
 * The previous version scheduled an async callback inside setTimeout and let
 * the promise float:
 *
 *   pending.set(key, setTimeout(async () => {
 *     indexRecord(type, { ...record, embedding: await generateEmbedding(...) });
 *   }, 0));
 *
 * geminiService.generateEmbedding degrades to a mock embedding for most
 * failures but deliberately re-throws GeminiRateLimitError and
 * GeminiServerError so callers can decide what to do. This caller decided
 * nothing: with no handler attached the rejection reached the process, and
 * Node's default --unhandled-rejections=throw terminated it. Question, Note
 * and Flashcard all enqueue on afterSave, so while Gemini was rate-limiting,
 * any user saving a note took the API down.
 *
 * Three things changed:
 *   - the callback cannot reject; a failed embedding retries with backoff and
 *     then indexes the record without a vector, so keyword search still works
 *   - queued records are snapshotted at enqueue time rather than read at fire
 *     time, so a row mutated in between is not indexed under a stale key
 *   - the index is bounded and evicts least-recently-used entries, and pending
 *     timers are drained on shutdown
 */
const index = new Map();
const pending = new Map();
const loadedUsers = new Set();

/**
 * Entries held across all users before the oldest is evicted.
 *
 * The index was previously unbounded: every user who searched left up to 750
 * records, each with a full embedding vector, resident for the lifetime of the
 * process, and nothing ever evicted them.
 */
const MAX_INDEX_ENTRIES = parseInt(process.env.SEARCH_INDEX_MAX_ENTRIES, 10) || 5000;

/** Attempts at an embedding before the record is indexed without one. */
const MAX_EMBEDDING_ATTEMPTS = parseInt(process.env.SEARCH_INDEX_MAX_ATTEMPTS, 10) || 3;

/** Base backoff between attempts, doubled each time. */
const RETRY_BASE_MS = parseInt(process.env.SEARCH_INDEX_RETRY_MS, 10) || 500;

const keyFor = (userId, type, id) => `${userId}:${type}:${id}`;

const textFor = (type, record) => {
  if (type === 'question') return [record.question, record.answer, ...(record.options || [])].filter(Boolean).join(' ');
  if (type === 'flashcard') return [record.front, record.back, ...(record.tags || [])].filter(Boolean).join(' ');
  return [record.title, record.content, ...(record.tags || [])].filter(Boolean).join(' ');
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Drop least-recently-used entries until the index is back within its cap.
 *
 * A Map iterates in insertion order, and indexRecord deletes before setting,
 * so the first key is always the least recently written.
 */
function evictIfNeeded() {
  while (index.size > MAX_INDEX_ENTRIES) {
    const oldest = index.keys().next();
    if (oldest.done) return;
    index.delete(oldest.value);
  }
}

function indexRecord(type, record) {
  if (!record || !record.id || !record.user) return;

  const key = keyFor(record.user, type, record.id);
  // Delete first so a re-index moves the entry to the back of the LRU order.
  index.delete(key);
  index.set(key, {
    id: record.id,
    user: record.user,
    type,
    subject: record.subject || null,
    title: type === 'question' ? record.question : type === 'flashcard' ? record.front : record.title,
    text: textFor(type, record),
    embedding: record.embedding || null,
    updatedAt: record.updatedAt || new Date(),
  });

  evictIfNeeded();
}

function removeRecord(type, record) {
  if (record?.user && record?.id) index.delete(keyFor(record.user, type, record.id));
}

/**
 * Ask for an embedding, giving up rather than propagating a failure.
 *
 * Returns null when every attempt fails. A null embedding is a usable
 * outcome: hybridSearchService scores a record with no vector on its keyword
 * rank alone, so the record stays findable.
 */
async function embedWithRetry(text, deps = {}) {
  const ai = deps.ai || require('./geminiService');
  const sleep = deps.sleep || delay;
  const attempts = deps.maxAttempts || MAX_EMBEDDING_ATTEMPTS;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await ai.generateEmbedding(text);
    } catch (error) {
      if (attempt === attempts) {
        console.warn(
          `[SearchIndex] Giving up on embedding after ${attempts} attempts; indexing text only:`,
          error.message
        );
        return null;
      }

      await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
    }
  }

  return null;
}

/**
 * Queue a record for indexing.
 *
 * The returned promise is for tests and for the shutdown drain; callers in
 * model hooks fire and forget, which is safe because the work below cannot
 * reject.
 */
function enqueueIndex(type, record, deps = {}) {
  if (!record?.id) return Promise.resolve();

  // Snapshot now. The old code closed over the live instance and read it when
  // the timer fired, so a row mutated in between was indexed with the later
  // values under the earlier key.
  const snapshot = { ...(record.toJSON?.() || record) };
  if (!snapshot.user) return Promise.resolve();

  const key = keyFor(snapshot.user, type, snapshot.id);
  if (pending.has(key)) return pending.get(key).promise;

  let settle;
  const promise = new Promise((resolve) => {
    settle = resolve;
  });

  const timer = setTimeout(async () => {
    pending.delete(key);

    try {
      const embedding = await embedWithRetry(textFor(type, snapshot), deps);
      indexRecord(type, { ...snapshot, embedding });
    } catch (error) {
      // Nothing above should throw, but this callback is the process boundary:
      // anything escaping it becomes an unhandled rejection and kills the API.
      console.warn('[SearchIndex] Failed to index record:', error.message);
    } finally {
      settle();
    }
  }, 0);

  // Deliberately not unref'd. An unref'd timer does not hold the event loop
  // open, so a queued index write is dropped whenever the loop would otherwise
  // go idle - and drain() would then wait on a promise that never settles.
  // The timeout is 0ms, so it fires on the next tick; shutdown() is what stops
  // it from outliving the process.
  pending.set(key, { timer, promise });
  return promise;
}

function getUserRecords(userId) {
  return [...index.values()].filter((record) => String(record.user) === String(userId));
}

function clearUserIndex(userId) {
  for (const [key, record] of index) {
    if (String(record.user) === String(userId)) index.delete(key);
  }
  loadedUsers.delete(String(userId));
}

function isUserLoaded(userId) { return loadedUsers.has(String(userId)); }
function markUserLoaded(userId) { loadedUsers.add(String(userId)); }

/** How many records are queued but not yet indexed. */
function pendingCount() { return pending.size; }

/** How many records the index currently holds. */
function size() { return index.size; }

/**
 * Wait for queued work to finish, then stop accepting more.
 *
 * Called from the graceful shutdown path so an in-flight index write does not
 * fire against a closing process.
 */
async function drain() {
  await Promise.all([...pending.values()].map((entry) => entry.promise));
}

/** Cancel queued work without running it. For shutdown and for test cleanup. */
function shutdown() {
  for (const entry of pending.values()) {
    clearTimeout(entry.timer);
  }
  pending.clear();
}

/** Drop everything. Tests only. */
function reset() {
  shutdown();
  index.clear();
  loadedUsers.clear();
}

module.exports = {
  MAX_INDEX_ENTRIES,
  MAX_EMBEDDING_ATTEMPTS,
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
};
