/**
 * Native IndexedDB Wrapper managing local flashcard logs and transaction states.
 */
class OfflineDbService {
  static DB_NAME = 'OpenPrepOfflineDB';
  static DB_VERSION = 1;

  static openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // 1. Storage Store for local cards caching
        if (!db.objectStoreNames.contains('flashcards')) {
          db.createObjectStore('flashcards', { keyPath: 'id' });
        }
        // 2. Storage Store for the local mutation queue with timestamps
        if (!db.objectStoreNames.contains('reviewLogQueue')) {
          db.createObjectStore('reviewLogQueue', { keyPath: 'logId', autoIncrement: true });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Pushes an offline review session log event directly into the local mutations queue.
   */
  static async queueOfflineReview(cardId, rating, sm2Data) {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reviewLogQueue', 'readwrite');
      const store = tx.objectStore('reviewLogQueue');

      const logEntry = {
        cardId,
        rating,
        interval: sm2Data.interval,
        repetition: sm2Data.repetition,
        efactor: sm2Data.efactor,
        clientTimestamp: new Date().toISOString()
      };

      const request = store.add(logEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Fetches all accumulated, unsynced review logs pending backend replay.
   */
  static async getQueuedReviews() {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reviewLogQueue', 'readonly');
      const store = tx.objectStore('reviewLogQueue');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clears successfully replayed log records from the local transaction store.
   */
  static async clearLoggedBatch(logIds) {
    const db = await this.openDatabase();
    const tx = db.transaction('reviewLogQueue', 'readwrite');
    const store = tx.objectStore('reviewLogQueue');

    for (const id of logIds) {
      store.delete(id);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export default OfflineDbService;
