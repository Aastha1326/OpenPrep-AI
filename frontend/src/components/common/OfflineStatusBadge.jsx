import React, { useState, useEffect } from 'react';
import OfflineDbService from '../../services/offlineDbService';

export default function OfflineStatusBadge() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      refreshQueueCount();
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Periodically poll queue metrics to keep UI indicators fresh
    const counterInterval = setInterval(refreshQueueCount, 3000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(counterInterval);
    };
  }, []);

  const refreshQueueCount = async () => {
    try {
      const logs = await OfflineDbService.getQueuedReviews();
      setQueuedCount(logs.length);
    } catch (e) {
      // IndexedDB initialization safeguard
    }
  };

  if (isOnline && queuedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 font-sans shadow-2xl animate-fade-in">
      {!isOnline ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950 border border-amber-800 text-amber-400 text-[11px] font-bold rounded-full">
          <span>📡</span>
          <span>Offline Mode — {queuedCount} reviews queued local</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950 border border-emerald-800 text-emerald-400 text-[11px] font-bold rounded-full animate-pulse">
          <span>🔄</span>
          <span>Syncing reviews with cloud...</span>
        </div>
      )}
    </div>
  );
}
