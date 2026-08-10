self.addEventListener('push', function(event) {
  if (event.data) {
    let payload = {
      title: 'OpenPrep AI Reminder',
      body: 'Time to study!',
      icon: '/favicon.svg'
    };

    try {
      payload = event.data.json();
    } catch (e) {
      payload.body = event.data.text();
    }

    const options = {
      body: payload.body,
      icon: payload.icon || '/favicon.svg',
      badge: payload.badge || '/favicon.svg',
      vibrate: [100, 50, 100],
      data: payload.data || {
        dateOfArrival: Date.now(),
        primaryKey: '1',
        url: '/'
      },
      actions: [
        {
          action: 'explore',
          title: 'Start Studying'
        },
        {
          action: 'close',
          title: 'Close'
        },
      ]
    };

    event.waitUntil(
      self.registration.showNotification(payload.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action !== 'close') {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function(windowClients) {
        // Check if there is already a window/tab open with the target URL
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          if (client.url.indexOf(urlToOpen) >= 0 && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});
