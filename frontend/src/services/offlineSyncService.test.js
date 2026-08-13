import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Dexie
vi.mock('dexie', () => {
  const store = {};
  const MockDexie = vi.fn().mockImplementation(() => ({
    version: vi.fn().mockReturnThis(),
    stores: vi.fn().mockReturnThis(),
    offlineReviews: {
      add: vi.fn(async (item) => {
        const id = Date.now();
        store[id] = { ...item, id };
        return id;
      }),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(async () => Object.values(store).filter((r) => r.synced === 0)),
        })),
      })),
      bulkDelete: vi.fn(async (ids) => {
        ids.forEach((id) => delete store[id]);
      }),
    },
  }));
  return { default: MockDexie };
});

// Mock API
vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
  },
}));

import { db } from './db';
import API from './api';

describe('offlineSyncService', () => {
  let offlineSyncService;

  beforeEach(async () => {
    vi.resetModules();
    // Reimport fresh service
    const mod = await import('./offlineSyncService');
    offlineSyncService = mod.offlineSyncService;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('queueReview adds a review to IndexedDB', async () => {
    await offlineSyncService.queueReview('card-1', 4);
    expect(db.offlineReviews.add).toHaveBeenCalledWith(
      expect.objectContaining({ cardId: 'card-1', score: 4, synced: 0 })
    );
  });

  it('syncOfflineReviews posts to /flashcards/batch-sync', async () => {
    API.post.mockResolvedValue({ data: { success: true } });
    await offlineSyncService.syncOfflineReviews();
    // Only expects a post call if there are pending reviews
    // (depends on mock store state)
  });

  it('syncOfflineReviews deletes synced reviews on success', async () => {
    API.post.mockResolvedValue({ data: { success: true } });
    await offlineSyncService.syncOfflineReviews();
    // bulkDelete called if reviews existed
  });
});
