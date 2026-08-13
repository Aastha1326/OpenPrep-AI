import Dexie from 'dexie';

export const db = new Dexie('openprep_offline_db');

db.version(1).stores({
  offlineReviews: '++id, cardId, score, reviewedAt, synced',
  cachedFlashcards: 'id, subjectId, topicId',
  cachedDecks: 'id, name',
});
