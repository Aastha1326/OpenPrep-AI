/**
 * Web Push helpers.
 *
 * The app used to register a second service worker (`/service-worker.js`) by
 * hand, alongside the one vite-plugin-pwa generates and registers. Both claimed
 * scope `/` and both called skipWaiting()/clientsClaim(), so which one answered
 * a given fetch was a race — and the hand-written one was cache-first over a
 * cache name that never changed, which stranded returning users on a stale
 * index.html after every deploy.
 *
 * There is one worker now. These helpers talk to whichever registration is
 * active rather than creating another.
 */

/** Cache name used by the retired hand-written worker. */
export const LEGACY_CACHE_NAME = 'openprep-v1';

/** Path the retired worker was registered under. */
export const LEGACY_SERVICE_WORKER_PATH = '/service-worker.js';

export const isPushSupported = () =>
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  typeof window !== 'undefined' &&
  'PushManager' in window;

/**
 * Decode a base64url VAPID key into the Uint8Array `pushManager.subscribe`
 * expects. Standard base64 decoding is not enough: the key is base64url, so
 * `-`/`_` have to be translated back and the padding restored.
 */
export const urlBase64ToUint8Array = (base64String) => {
  if (!base64String) {
    throw new Error('A VAPID public key is required to subscribe to push');
  }

  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);

  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Remove the retired worker from browsers that still have it.
 *
 * Without this, everyone who loaded the app before this change keeps a second
 * worker at scope `/` — and its stale precache — until they manually clear
 * site data. Unregistering is best-effort; a failure here must not block
 * startup, so it is logged and swallowed.
 */
export const unregisterLegacyServiceWorker = async () => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const legacy = registrations.filter((registration) => {
      const url = registration.active?.scriptURL || registration.installing?.scriptURL || '';
      return url.endsWith(LEGACY_SERVICE_WORKER_PATH);
    });

    await Promise.all(legacy.map((registration) => registration.unregister()));

    if (typeof caches !== 'undefined' && typeof caches.delete === 'function') {
      await caches.delete(LEGACY_CACHE_NAME);
    }

    return legacy.length > 0;
  } catch (err) {
    console.warn('Could not clean up the legacy service worker:', err);
    return false;
  }
};

/**
 * The active registration, without creating one.
 *
 * `navigator.serviceWorker.ready` resolves only once a worker controls the
 * page. vite-plugin-pwa registers it, so calling register() here would just
 * add a duplicate.
 */
export const getActiveRegistration = async () => {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }
  return navigator.serviceWorker.ready;
};

/**
 * Subscribe the active worker to push, reusing an existing subscription when
 * the browser already has one — subscribing twice with the same key returns
 * the original anyway, but re-sending it to the server is wasted work.
 */
export const subscribeToPushNotifications = async (vapidPublicKey) => {
  const registration = await getActiveRegistration();

  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    return existing;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
};

/** Drop the browser-side subscription. Returns whether there was one. */
export const unsubscribeFromPushNotifications = async () => {
  const registration = await getActiveRegistration();
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return false;
  }

  await subscription.unsubscribe();
  return true;
};
