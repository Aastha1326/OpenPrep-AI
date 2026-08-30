import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  urlBase64ToUint8Array,
  unregisterLegacyServiceWorker,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getActiveRegistration,
  isPushSupported,
  LEGACY_CACHE_NAME,
  LEGACY_SERVICE_WORKER_PATH,
} from './pushNotifications';

const makeRegistration = (scriptURL) => ({
  active: { scriptURL },
  unregister: vi.fn().mockResolvedValue(true),
});

describe('urlBase64ToUint8Array', () => {
  it('decodes a base64url VAPID key into bytes', () => {
    // 'Hello!' -> base64 'SGVsbG8h'
    const result = urlBase64ToUint8Array('SGVsbG8h');
    expect(Array.from(result)).toEqual([72, 101, 108, 108, 111, 33]);
  });

  it('restores padding that base64url strips', () => {
    // 'Hi' -> 'SGk=' unpadded is 'SGk'
    expect(Array.from(urlBase64ToUint8Array('SGk'))).toEqual([72, 105]);
  });

  it('translates the base64url alphabet back to standard base64', () => {
    // Bytes 0xFB 0xFF decode from '-_8' in base64url / '+/8' in base64.
    const fromUrlSafe = urlBase64ToUint8Array('-_8');
    const fromStandard = urlBase64ToUint8Array('+/8');
    expect(Array.from(fromUrlSafe)).toEqual(Array.from(fromStandard));
  });

  it('refuses an empty key rather than producing a zero-length array', () => {
    expect(() => urlBase64ToUint8Array('')).toThrow(/VAPID public key/);
    expect(() => urlBase64ToUint8Array(undefined)).toThrow(/VAPID public key/);
  });
});

describe('unregisterLegacyServiceWorker', () => {
  let originalServiceWorker;
  let originalCaches;

  beforeEach(() => {
    originalServiceWorker = navigator.serviceWorker;
    originalCaches = globalThis.caches;
  });

  afterEach(() => {
    if (originalServiceWorker === undefined) {
      delete navigator.serviceWorker;
    } else {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        configurable: true,
      });
    }
    globalThis.caches = originalCaches;
  });

  const stubServiceWorker = (registrations) => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { getRegistrations: vi.fn().mockResolvedValue(registrations) },
      configurable: true,
    });
  };

  it('unregisters the retired worker and drops its cache', async () => {
    const legacy = makeRegistration(`https://app.test${LEGACY_SERVICE_WORKER_PATH}`);
    stubServiceWorker([legacy]);
    globalThis.caches = { delete: vi.fn().mockResolvedValue(true) };

    const removed = await unregisterLegacyServiceWorker();

    expect(removed).toBe(true);
    expect(legacy.unregister).toHaveBeenCalled();
    expect(globalThis.caches.delete).toHaveBeenCalledWith(LEGACY_CACHE_NAME);
  });

  it('leaves the generated PWA worker alone', async () => {
    const current = makeRegistration('https://app.test/sw.js');
    stubServiceWorker([current]);
    globalThis.caches = { delete: vi.fn().mockResolvedValue(true) };

    const removed = await unregisterLegacyServiceWorker();

    expect(removed).toBe(false);
    expect(current.unregister).not.toHaveBeenCalled();
  });

  it('swallows failures so startup is never blocked', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { getRegistrations: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(unregisterLegacyServiceWorker()).resolves.toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('push subscription', () => {
  let originalServiceWorker;
  let pushManager;

  beforeEach(() => {
    originalServiceWorker = navigator.serviceWorker;
    pushManager = {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn().mockResolvedValue({ endpoint: 'https://push.test/abc' }),
    };
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({ pushManager }),
        register: vi.fn(),
      },
      configurable: true,
    });
    globalThis.PushManager = function PushManagerStub() {};
  });

  afterEach(() => {
    if (originalServiceWorker === undefined) {
      delete navigator.serviceWorker;
    } else {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        configurable: true,
      });
    }
    delete globalThis.PushManager;
  });

  it('reports push as supported when the browser has the APIs', () => {
    expect(isPushSupported()).toBe(true);
  });

  it('uses the active registration instead of registering another worker', async () => {
    await subscribeToPushNotifications('SGVsbG8h');

    expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
    expect(pushManager.subscribe).toHaveBeenCalledTimes(1);
  });

  it('subscribes with the decoded VAPID key and userVisibleOnly', async () => {
    await subscribeToPushNotifications('SGVsbG8h');

    const options = pushManager.subscribe.mock.calls[0][0];
    expect(options.userVisibleOnly).toBe(true);
    expect(Array.from(options.applicationServerKey)).toEqual([72, 101, 108, 108, 111, 33]);
  });

  it('reuses an existing subscription rather than creating a second one', async () => {
    const existing = { endpoint: 'https://push.test/existing' };
    pushManager.getSubscription.mockResolvedValue(existing);

    const result = await subscribeToPushNotifications('SGVsbG8h');

    expect(result).toBe(existing);
    expect(pushManager.subscribe).not.toHaveBeenCalled();
  });

  it('unsubscribes an existing subscription', async () => {
    const unsubscribe = vi.fn().mockResolvedValue(true);
    pushManager.getSubscription.mockResolvedValue({ unsubscribe });

    await expect(unsubscribeFromPushNotifications()).resolves.toBe(true);
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('reports when there was nothing to unsubscribe', async () => {
    pushManager.getSubscription.mockResolvedValue(null);
    await expect(unsubscribeFromPushNotifications()).resolves.toBe(false);
  });

  it('resolves the registration the browser already controls the page with', async () => {
    const registration = await getActiveRegistration();
    expect(registration.pushManager).toBe(pushManager);
  });
});
