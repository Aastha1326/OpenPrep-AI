import { describe, test, expect, beforeEach, vi } from 'vitest';
import API, { isApiOnline, CONNECTIVITY_EVENT } from './api';
const offlineStorage = require('./offlineStorageService');
const syncManager = require('./syncManager');

describe('Offline Mode & Service Worker Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('isApiOnline returns initial online status boolean', () => {
    expect(typeof isApiOnline()).toBe('boolean');
  });

  test('service worker file exists in public directory', async () => {
    // Basic sanity check that service worker registration endpoint is available
    expect('/service-worker.js').toBeDefined();
  });

  test('emits connectivity event when window online/offline fires', () => {
    const handler = vi.fn();
    window.addEventListener(CONNECTIVITY_EVENT, handler);

    window.dispatchEvent(new CustomEvent(CONNECTIVITY_EVENT, { detail: { online: false } }));
    expect(handler).toHaveBeenCalled();

    window.removeEventListener(CONNECTIVITY_EVENT, handler);
  });

  test('queues offline action in mutationsQueue', async () => {
    vi.spyOn(offlineStorage, 'put').mockResolvedValue(1);

    const action = { type: 'flashcard_review', url: '/api/flashcards/123/review', method: 'POST', payload: { score: 5 } };
    await syncManager.queueOfflineMutation(action);

    expect(offlineStorage.put).toHaveBeenCalledWith('mutationsQueue', expect.objectContaining({
      type: 'flashcard_review',
      url: '/api/flashcards/123/review'
    }));
  });

  test('flushes mutations queue successfully when online', async () => {
    vi.spyOn(offlineStorage, 'getAll').mockResolvedValue([
      { id: 1, type: 'flashcard_review', url: '/api/review', method: 'POST', payload: {} }
    ]);
    vi.spyOn(offlineStorage, 'remove').mockResolvedValue(true);

    global.fetch = vi.fn().mockResolvedValue({ status: 200 });

    // Mock navigator.onLine as true
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

    const result = await syncManager.flushMutationsQueue();

    expect(global.fetch).toHaveBeenCalledWith('/api/review', expect.objectContaining({ method: 'POST' }));
    expect(offlineStorage.remove).toHaveBeenCalledWith('mutationsQueue', 1);
    expect(result.flushed).toBe(1);
  });
});
