import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const SyncContext = createContext(null);

export const useSync = () => useContext(SyncContext);

export const SyncProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load offline queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('offlineSyncQueue');
    if (savedQueue) {
      try {
        setSyncQueue(JSON.parse(savedQueue));
      } catch (e) {
        console.error("Failed to parse offline queue");
      }
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save queue to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('offlineSyncQueue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  // Try to sync when we come back online
  useEffect(() => {
    if (isOnline && syncQueue.length > 0 && !isSyncing) {
      processSyncQueue();
    }
  }, [isOnline, syncQueue.length]);

  const addToQueue = (endpoint, payload) => {
    const timestampedPayload = { ...payload, updatedAt: new Date().toISOString() };
    setSyncQueue(prev => [...prev, { endpoint, payload: timestampedPayload, id: Date.now() }]);
  };

  const processSyncQueue = async () => {
    setIsSyncing(true);
    const currentQueue = [...syncQueue];
    const failedItems = [];

    for (const item of currentQueue) {
      try {
        await api.post(item.endpoint, item.payload);
        console.log(`[CRDT Sync] Successfully synced item ${item.id}`);
      } catch (err) {
        if (err.response?.status === 409) {
          console.warn(`[CRDT Sync] Conflict for item ${item.id} - Server rejected due to older timestamp. Dropping local edit.`);
          // In a real CRDT, we'd alert the user or show a diff. For MVP, we drop the stale edit.
        } else {
          // Keep in queue if it failed for network/other reasons
          failedItems.push(item);
        }
      }
    }

    setSyncQueue(failedItems);
    setIsSyncing(false);
  };

  // Mock API wrapper that intercepts requests if offline
  const syncApi = {
    post: async (endpoint, data) => {
      if (!isOnline) {
        console.log(`[CRDT Sync] Offline. Queuing request to ${endpoint}`);
        addToQueue(endpoint, data);
        return { data: { status: 'queued' } };
      }
      return api.post(endpoint, { ...data, updatedAt: new Date().toISOString() });
    }
  };

  return (
    <SyncContext.Provider value={{ isOnline, syncQueue, isSyncing, syncApi }}>
      {children}
    </SyncContext.Provider>
  );
};
