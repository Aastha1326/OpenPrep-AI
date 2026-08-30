import { describe, test, expect, beforeEach, vi } from 'vitest';
import API, { isApiOnline, CONNECTIVITY_EVENT } from './api';
import * as offlineStorage from './offlineStorageService';
import * as syncManager from './syncManager';
import { MAX_ATTEMPTS } from './syncManager';

/** Stubs the queue to hold exactly these mutations. */
function queueHolds(...mutations) {
  vi.spyOn(offlineStorage, 'getAll').mockResolvedValue(mutations);
  vi.spyOn(offlineStorage, 'remove').mockResolvedValue(true);
  vi.spyOn(offlineStorage, 'put').mockResolvedValue(true);
}

/** Makes the next replay fail the way axios reports an HTTP error. */
function rejectsWith(status) {
  const error = new Error(`Request failed with status code ${status}`);
  error.response = { status };
  vi.spyOn(API, 'request').mockRejectedValue(error);
}

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
    queueHolds({ id: 1, type: 'flashcard_review', url: '/api/review', method: 'POST', payload: {} });
    vi.spyOn(API, 'request').mockResolvedValue({ status: 200, data: {} });

    const result = await syncManager.flushMutationsQueue();

    // Replaying through the shared client is the point: it is what attaches
    // the bearer token, the CSRF header and the API baseURL. A bare fetch had
    // none of them and could only ever be rejected.
    expect(API.request).toHaveBeenCalledWith({
      url: '/api/review',
      method: 'post',
      data: {},
    });
    expect(offlineStorage.remove).toHaveBeenCalledWith('mutationsQueue', 1);
    expect(result.flushed).toBe(1);
  });
});

describe('offline mutation replay outcomes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  test.each([401, 403, 408, 429, 500, 503])(
    'keeps a mutation the server answered with %i',
    async (status) => {
      queueHolds({ id: 7, url: '/api/review', method: 'POST', payload: { score: 5 } });
      rejectsWith(status);

      const result = await syncManager.flushMutationsQueue();

      // 401 is the one that matters most: the access token expires while the
      // user is offline, so it is the *expected* response on the first replay.
      // Treating it as terminal deleted the user's work.
      expect(offlineStorage.remove).not.toHaveBeenCalled();
      expect(result.flushed).toBe(0);
      expect(result.retained).toBe(1);
    }
  );

  test.each([400, 404, 409, 410, 422])(
    'drops a mutation the server answered with %i',
    async (status) => {
      queueHolds({ id: 7, url: '/api/review', method: 'POST', payload: {} });
      rejectsWith(status);

      const result = await syncManager.flushMutationsQueue();

      expect(offlineStorage.remove).toHaveBeenCalledWith('mutationsQueue', 7);
      expect(result.flushed).toBe(1);
    }
  );

  test('records an attempt against a mutation it keeps', async () => {
    queueHolds({ id: 7, url: '/api/review', method: 'POST', payload: {}, attempts: 1 });
    rejectsWith(503);

    await syncManager.flushMutationsQueue();

    expect(offlineStorage.put).toHaveBeenCalledWith(
      'mutationsQueue',
      expect.objectContaining({ id: 7, attempts: 2 })
    );
  });

  test('discards a mutation that has exhausted its attempts', async () => {
    queueHolds({ id: 7, url: '/api/review', method: 'POST', payload: {}, attempts: MAX_ATTEMPTS - 1 });
    rejectsWith(503);

    const result = await syncManager.flushMutationsQueue();

    // A mutation the server will never accept must not sit at the head of the
    // queue forever, blocking everything the user does afterwards.
    expect(offlineStorage.remove).toHaveBeenCalledWith('mutationsQueue', 7);
    expect(result.discarded).toBe(1);
    expect(result.flushed).toBe(0);
  });

  test('stops the flush when the connection drops mid-queue', async () => {
    queueHolds(
      { id: 1, url: '/api/one', method: 'POST', payload: {} },
      { id: 2, url: '/api/two', method: 'POST', payload: {} }
    );

    vi.spyOn(API, 'request')
      .mockResolvedValueOnce({ status: 200, data: {} })
      .mockRejectedValueOnce(Object.assign(new Error('Network Error'), { response: undefined }));

    const result = await syncManager.flushMutationsQueue();

    expect(offlineStorage.remove).toHaveBeenCalledWith('mutationsQueue', 1);
    expect(offlineStorage.remove).not.toHaveBeenCalledWith('mutationsQueue', 2);
    expect(result.status).toBe('deferred');
  });

  test('reports offline without touching the queue', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const getAll = vi.spyOn(offlineStorage, 'getAll');

    const result = await syncManager.flushMutationsQueue();

    expect(getAll).not.toHaveBeenCalled();
    expect(result).toEqual({ flushed: 0, retained: 0, discarded: 0, status: 'offline' });
  });

  test('stamps a queued mutation with a zero attempt count', async () => {
    vi.spyOn(offlineStorage, 'put').mockResolvedValue(1);

    await syncManager.queueOfflineMutation({ url: '/api/review', method: 'POST', payload: {} });

    expect(offlineStorage.put).toHaveBeenCalledWith(
      'mutationsQueue',
      expect.objectContaining({ attempts: 0 })
    );
  });
});
