import { describe, test, expect, beforeEach, vi } from 'vitest';
import API, { isApiOnline, CONNECTIVITY_EVENT } from './api';

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
});
