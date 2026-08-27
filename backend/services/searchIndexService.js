const index = new Map();
const pending = new Map();
const loadedUsers = new Set();

const keyFor = (userId, type, id) => `${userId}:${type}:${id}`;

const textFor = (type, record) => {
  if (type === 'question') return [record.question, record.answer, ...(record.options || [])].filter(Boolean).join(' ');
  if (type === 'flashcard') return [record.front, record.back, ...(record.tags || [])].filter(Boolean).join(' ');
  return [record.title, record.content, ...(record.tags || [])].filter(Boolean).join(' ');
};

function indexRecord(type, record) {
  if (!record || !record.id || !record.user) return;
  const key = keyFor(record.user, type, record.id);
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
}

function removeRecord(type, record) {
  if (record?.user && record?.id) index.delete(keyFor(record.user, type, record.id));
}

function enqueueIndex(type, record) {
  if (!record?.id) return;
  const key = keyFor(record.user, type, record.id);
  if (pending.has(key)) return;
  pending.set(key, setTimeout(async () => {
    pending.delete(key);
    const geminiService = require('./geminiService');
    indexRecord(type, { ...(record.toJSON?.() || record), embedding: await geminiService.generateEmbedding(textFor(type, record)) });
  }, 0));
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

module.exports = { indexRecord, removeRecord, enqueueIndex, getUserRecords, clearUserIndex, isUserLoaded, markUserLoaded };
