import OfflineDbService from './services/offlineDbService';

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-flashcard-reviews') {
    // Hold worker process awake until the async replication completes
    event.waitUntil(replayPendingOfflineReviews());
  }
});

/**
 * Replays queued reviews to the backend using Last-Write-Wins orchestration rules.
 */
async function replayPendingOfflineReviews() {
  try {
    const queuedLogs = await OfflineDbService.getQueuedReviews();
    if (queuedLogs.length === 0) return;

    const response = await fetch('/api/flashcards/sync-offline-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviews: queuedLogs })
    });

    if (response.ok) {
      const result = await response.json();
      const processedLogIds = queuedLogs.map(log => log.logId);
      
      // Flush matching local cache records securely upon confirmed server processing
      await OfflineDbService.clearLoggedBatch(processedLogIds);
      console.log('🎉 Offline flashcard synchronization cycle completed successfully.');
    }
  } catch (err) {
    console.error('⚠️ Background flashcard sync attempt failed. Retrying on next network connection:', err);
    throw err; // Throw error to let the browser know it should re-attempt later
  }
}
