const { getAll, put, remove } = require('./offlineStorageService');

/**
 * Queues an API mutation action when offline.
 * @param {Object} action - Action context { type, url, method, payload }
 */
async function queueOfflineMutation(action) {
  const mutation = {
    ...action,
    timestamp: Date.now(),
  };
  await put('mutationsQueue', mutation);
  
  // Trigger custom window event to notify UI
  window.dispatchEvent(new CustomEvent('offline-sync-update'));
}

/**
 * Flush all queued offline mutations to the backend once connectivity is restored.
 */
async function flushMutationsQueue() {
  if (!navigator.onLine) return { flushed: 0, status: 'offline' };

  const queuedMutations = await getAll('mutationsQueue');
  if (queuedMutations.length === 0) return { flushed: 0, status: 'empty' };

  console.log(`[SyncManager] Flashing ${queuedMutations.length} queued offline actions...`);
  let flushed = 0;

  for (const mutation of queuedMutations) {
    try {
      const response = await fetch(mutation.url, {
        method: mutation.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: mutation.payload ? JSON.stringify(mutation.payload) : undefined,
      });

      // Clear from queue if request was successfully processed or rejected as invalid (4xx)
      if (response.status < 500) {
        await remove('mutationsQueue', mutation.id);
        flushed++;
      } else {
        // Server error (5xx) - keep in queue to retry later
        console.warn(`[SyncManager] Retry deferred for action ${mutation.id}: Server error ${response.status}`);
        break;
      }
    } catch (err) {
      console.error(`[SyncManager] Sync dispatch failed for action ${mutation.id}:`, err.message);
      break; // Network failed again, defer remainder of queue
    }
  }

  // Trigger sync update event
  window.dispatchEvent(new CustomEvent('offline-sync-update'));

  return { flushed, status: 'completed' };
}

// Automatically bind online listener to flush queue
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushMutationsQueue().catch((err) => console.error('[SyncManager] Auto-flush failed:', err.message));
  });
}

module.exports = {
  queueOfflineMutation,
  flushMutationsQueue,
};
