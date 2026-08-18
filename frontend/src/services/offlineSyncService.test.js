import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Mock `./db` rather than `dexie` itself. The previous version of this file
 * mocked the Dexie constructor and never got past module load
 * ("... is not a constructor"), so none of its assertions ever ran.
 */
vi.mock('./db', () => {
  const rows = new Map();
  let nextId = 1;

  const offlineReviews = {
    add: vi.fn(async (item) => {
      const id = nextId;
      nextId += 1;
      rows.set(id, { ...item, id });
      return id;
    }),
    where: vi.fn(() => ({
      equals: vi.fn((value) => ({
        toArray: vi.fn(async () => [...rows.values()].filter((r) => r.synced === value)),
      })),
    })),
    bulkDelete: vi.fn(async (ids) => {
      ids.forEach((id) => rows.delete(id));
    }),
    // test helpers
    __rows: rows,
    __reset: () => {
      rows.clear();
      nextId = 1;
    },
  };

  return { db: { offlineReviews } };
});

vi.mock('./api', () => ({
  default: { post: vi.fn() },
}));

import { db } from './db';
import API from './api';
import { offlineSyncService } from './offlineSyncService';

/** Seed n unsynced reviews directly into the mock store. */
const seed = async (count) => {
  for (let i = 0; i < count; i += 1) {
    await db.offlineReviews.add({
      cardId: `card-${i}`,
      score: 4,
      reviewedAt: new Date(2026, 0, 1, 0, 0, i).toISOString(),
      synced: 0,
    });
  }
};

const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { response: { status } });

describe('offlineSyncService', () => {
  beforeEach(() => {
    db.offlineReviews.__reset();
    db.offlineReviews.add.mockClear();
    db.offlineReviews.where.mockClear();
    db.offlineReviews.bulkDelete.mockClear();

    // mockReset, not mockClear: clearing only wipes recorded calls, so a
    // mockImplementation set by one test (e.g. the never-resolving promise
    // used to hold a sync open) would leak into every test after it.
    API.post.mockReset();
    API.post.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    API.post.mockReset();
  });

  describe('queueReview', () => {
    it('stores the review as unsynced', async () => {
      await offlineSyncService.queueReview('card-1', 4);
      expect(db.offlineReviews.add).toHaveBeenCalledWith(
        expect.objectContaining({ cardId: 'card-1', score: 4, synced: 0 })
      );
    });

    it('stamps reviewedAt as an ISO timestamp', async () => {
      await offlineSyncService.queueReview('card-1', 4);
      const [[stored]] = db.offlineReviews.add.mock.calls;
      expect(stored.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('syncs immediately when online', async () => {
      await offlineSyncService.queueReview('card-1', 4);
      expect(API.post).toHaveBeenCalledWith('/flashcards/batch-sync', expect.any(Object));
    });
  });

  describe('syncOfflineReviews', () => {
    it('does nothing when the queue is empty', async () => {
      const result = await offlineSyncService.syncOfflineReviews();
      expect(API.post).not.toHaveBeenCalled();
      expect(result).toEqual({ synced: 0, failed: 0 });
    });

    it('posts queued reviews to the batch endpoint', async () => {
      await seed(3);
      const result = await offlineSyncService.syncOfflineReviews();

      expect(API.post).toHaveBeenCalledTimes(1);
      const [url, body] = API.post.mock.calls[0];
      expect(url).toBe('/flashcards/batch-sync');
      expect(body.reviews).toHaveLength(3);
      expect(result.synced).toBe(3);
    });

    it('sends only the fields the endpoint needs', async () => {
      await seed(1);
      await offlineSyncService.syncOfflineReviews();

      expect(API.post.mock.calls[0][1].reviews[0]).toEqual({
        cardId: 'card-0',
        score: 4,
        reviewedAt: expect.any(String),
      });
    });

    it('clears the queue on success', async () => {
      await seed(3);
      await offlineSyncService.syncOfflineReviews();
      expect(db.offlineReviews.__rows.size).toBe(0);
    });

    it('keeps the queue when the server reports failure', async () => {
      await seed(3);
      API.post.mockResolvedValue({ data: { success: false } });

      const result = await offlineSyncService.syncOfflineReviews();

      expect(db.offlineReviews.__rows.size).toBe(3);
      expect(result).toMatchObject({ synced: 0, failed: 3, reason: 'server-rejected' });
    });

    it('keeps the queue on a network error', async () => {
      await seed(3);
      API.post.mockRejectedValue(new Error('Network Error'));

      const result = await offlineSyncService.syncOfflineReviews();

      expect(db.offlineReviews.__rows.size).toBe(3);
      expect(result).toMatchObject({ synced: 0, failed: 3, reason: 'network' });
    });
  });

  /**
   * The queue used to go out as one request. At ~100 bytes per entry that
   * crossed the API's 10 KB `express.json` limit at about 103 reviews, and the
   * resulting 413 was retried unchanged forever.
   */
  describe('batching', () => {
    it('splits a large backlog across several requests', async () => {
      await seed(120);
      const result = await offlineSyncService.syncOfflineReviews();

      expect(API.post).toHaveBeenCalledTimes(3); // 50 + 50 + 20
      expect(result.synced).toBe(120);
      expect(db.offlineReviews.__rows.size).toBe(0);
    });

    it('keeps every request well under the 10kb body limit', async () => {
      await seed(200);
      await offlineSyncService.syncOfflineReviews();

      for (const [, body] of API.post.mock.calls) {
        expect(body.reviews.length).toBeLessThanOrEqual(50);
        expect(JSON.stringify(body).length).toBeLessThan(10 * 1024);
      }
    });

    it('sends every queued review exactly once across the batches', async () => {
      await seed(120);
      await offlineSyncService.syncOfflineReviews();

      const sent = API.post.mock.calls.flatMap(([, body]) => body.reviews.map((r) => r.cardId));
      expect(sent).toHaveLength(120);
      expect(new Set(sent).size).toBe(120);
    });

    it('keeps the progress made before a mid-run failure', async () => {
      await seed(120);
      API.post
        .mockResolvedValueOnce({ data: { success: true } })
        .mockRejectedValueOnce(new Error('Network Error'));

      const result = await offlineSyncService.syncOfflineReviews();

      // First batch landed and was deleted; the rest stay queued for later.
      expect(result.synced).toBe(50);
      expect(db.offlineReviews.__rows.size).toBe(70);
    });
  });

  /**
   * Two triggers exist — the `online` listener and `queueReview` — and both
   * used to read the same unsynced rows and POST them, so the server applied
   * one review twice and advanced its SM-2 state twice over.
   */
  describe('concurrency', () => {
    /**
     * Hold the next POST open. `reached` resolves once the service has
     * actually called it — the run awaits an IndexedDB read first, so
     * releasing before that would fire against an undefined resolver.
     */
    const holdNextPost = () => {
      let release;
      let signalReached;
      const reached = new Promise((resolve) => {
        signalReached = resolve;
      });

      API.post.mockImplementation(
        () =>
          new Promise((resolve) => {
            release = () => resolve({ data: { success: true } });
            signalReached();
          })
      );

      return { reached, release: () => release() };
    };

    it('coalesces overlapping calls into one run', async () => {
      await seed(10);
      const post = holdNextPost();

      const first = offlineSyncService.syncOfflineReviews();
      const second = offlineSyncService.syncOfflineReviews();

      expect(first).toBe(second);

      await post.reached;
      post.release();
      await Promise.all([first, second]);

      expect(API.post).toHaveBeenCalledTimes(1);
    });

    it('never sends a review twice when a queue and a sync overlap', async () => {
      await seed(5);
      const post = holdNextPost();

      const syncing = offlineSyncService.syncOfflineReviews();
      const queuing = offlineSyncService.queueReview('card-late', 5);

      await post.reached;
      post.release();
      await Promise.all([syncing, queuing]);

      const sent = API.post.mock.calls.flatMap(([, body]) => body.reviews.map((r) => r.cardId));
      expect(new Set(sent).size).toBe(sent.length);
    });

    it('allows a fresh sync once the previous run settles', async () => {
      await seed(1);
      await offlineSyncService.syncOfflineReviews();

      await seed(1);
      await offlineSyncService.syncOfflineReviews();

      expect(API.post).toHaveBeenCalledTimes(2);
    });

    it('releases the in-flight guard even when the run fails', async () => {
      await seed(1);
      API.post.mockRejectedValueOnce(new Error('Network Error'));
      await offlineSyncService.syncOfflineReviews();

      API.post.mockResolvedValue({ data: { success: true } });
      const result = await offlineSyncService.syncOfflineReviews();

      expect(result.synced).toBe(1);
    });
  });

  describe('permanent failures', () => {
    it.each([400, 401, 403, 404, 413, 422])(
      'drops a batch rejected with %i instead of retrying it forever',
      async (status) => {
        await seed(3);
        API.post.mockRejectedValue(httpError(status));

        const result = await offlineSyncService.syncOfflineReviews();

        expect(db.offlineReviews.__rows.size).toBe(0);
        expect(result.reason).toBe(`dropped-${status}`);
      }
    );

    it('drains the remaining batches after dropping a rejected one', async () => {
      await seed(120);
      API.post.mockRejectedValueOnce(httpError(413)).mockResolvedValue({ data: { success: true } });

      const result = await offlineSyncService.syncOfflineReviews();

      expect(API.post).toHaveBeenCalledTimes(3);
      expect(result.synced).toBe(70);
      expect(db.offlineReviews.__rows.size).toBe(0);
    });

    it('retries a 500 rather than dropping it', async () => {
      await seed(3);
      API.post.mockRejectedValue(httpError(500));

      const result = await offlineSyncService.syncOfflineReviews();

      expect(db.offlineReviews.__rows.size).toBe(3);
      expect(result.reason).toBe('network');
    });
  });
});
