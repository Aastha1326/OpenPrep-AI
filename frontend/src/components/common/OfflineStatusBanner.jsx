import React, { useState, useEffect } from 'react';
import { getAll } from '../../services/offlineStorageService';
import { flushMutationsQueue } from '../../services/syncManager';

export default function OfflineStatusBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Sync count refresher
  async function refreshPendingCount() {
    try {
      const queued = await getAll('mutationsQueue');
      setPendingCount(queued.length);
    } catch (e) {
      console.warn('Failed to read IndexedDB sync queue size:', e);
    }
  }

  useEffect(() => {
    function handleStatusChange() {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        handleSync();
      }
    }

    // Bind connection states
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    window.addEventListener('offline-sync-update', refreshPendingCount);

    refreshPendingCount();

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
      window.removeEventListener('offline-sync-update', refreshPendingCount);
    };
  }, []);

  async function handleSync() {
    if (syncing || !navigator.onLine) return;
    setSyncing(true);
    try {
      await flushMutationsQueue();
      await refreshPendingCount();
    } catch (err) {
      console.error('[OfflineStatusBanner] Manual sync failed:', err.message);
    } finally {
      setSyncing(false);
    }
  }

  // Render only if offline or if there are pending actions to sync
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md transition-all duration-300 animate-slide-down`}>
      <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border shadow-xl backdrop-blur-md ${
        !isOnline 
          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' 
          : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
      }`}>
        <div className="flex items-center gap-2.5">
          {!isOnline ? (
            <svg className="w-5 h-5 text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 4.978 4.978 0 011.414-3.536m0 0L8.464 8.464M5.636 18.364a9 9 0 010-12.728m0 0l2.829 2.829M3 21l1.757-1.757" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider block">
              {!isOnline ? 'Offline Mode Active' : 'Online Connection Restored'}
            </span>
            <span className="text-[11px] text-slate-300 block mt-0.5">
              {!isOnline 
                ? `Saved locally. ${pendingCount} pending action${pendingCount !== 1 ? 's' : ''}.` 
                : `${pendingCount} update${pendingCount !== 1 ? 's' : ''} queued for upload.`}
            </span>
          </div>
        </div>

        {isOnline && pendingCount > 0 && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition flex items-center gap-1 shadow-md"
          >
            {syncing ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : 'Sync'}
          </button>
        )}
      </div>
    </div>
  );
}
