// Web Push handlers for OpenPrep AI.
//
// This file is NOT registered directly. vite-plugin-pwa generates the service
// worker that actually gets registered (dist/sw.js) and pulls this file in via
// `workbox.importScripts` — see frontend/vite.config.js. It used to live at
// public/sw.js, where the generated worker overwrote it at build time and the
// push handlers below silently vanished from the deployed bundle.

self.addEventListener('push', (event) => {
  let data = {
    title: 'OpenPrep AI Study Alert',
    body: 'You have a new study notification!',
    icon: '/icon-192.png',
    data: { link: '/dashboard' },
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (err) {
    console.warn('Error parsing push payload:', err);
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: data.data || { link: '/dashboard' },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetLink = (event.notification.data && event.notification.data.link) || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetLink) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetLink);
      }
    })
  );
});
