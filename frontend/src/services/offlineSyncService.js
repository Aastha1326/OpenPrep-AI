import { db } from './db';
import API from './api';

class OfflineSyncService {
  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.syncOfflineReviews());
    }
  }

  async queueReview(cardId, score) {
    await db.offlineReviews.add({
      cardId,
      score,
      reviewedAt: new Date().toISOString(),
      synced: 0,
    });
    if (navigator.onLine) {
      await this.syncOfflineReviews();
    }
  }

  async syncOfflineReviews() {
    const reviews = await db.offlineReviews.where('synced').equals(0).toArray();
    if (reviews.length === 0) return;

    try {
      const payload = reviews.map((r) => ({
        cardId: r.cardId,
        score: r.score,
        reviewedAt: r.reviewedAt,
      }));

      const res = await API.post('/flashcards/batch-sync', { reviews: payload });
      if (res.data.success) {
        const ids = reviews.map((r) => r.id);
        await db.offlineReviews.bulkDelete(ids);
        console.log('Offline reviews synchronized successfully');
      }
    } catch (err) {
      console.error('Failed to sync offline reviews', err);
    }
  }
}

export const offlineSyncService = new OfflineSyncService();
export default offlineSyncService;
