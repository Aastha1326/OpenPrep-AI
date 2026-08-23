/**
 * @fileoverview Custom React hook to detect online/offline status and manage background sync queue.
 */
import { useState, useEffect, useCallback } from 'react';
import { queueSyncAction, flushSyncQueue, getAllItems, STORES } from '../utils/indexedDBManager';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const useOfflineSync = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [queueLength, setQueueLength] = useState(0);

    // Update queue length on mount and when queue changes
    useEffect(() => {
        const updateQueueLength = async () => {
            const items = await getAllItems(STORES.SYNC_QUEUE);
            setQueueLength(items.length);
        };
        updateQueueLength();
    }, [isSyncing, isOnline]);

    // Listen to online/offline events
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            triggerSync();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Queue an action for later sync
    const queueAction = useCallback(async (actionType, payload) => {
        if (isOnline) {
            // If online, you might still want to queue it or send immediately. 
            // For this pattern, we queue everything to ensure order, then flush.
        }

        await queueSyncAction({
            id: crypto.randomUUID(),
            type: actionType,
            payload,
        });

        // Trigger sync attempt immediately in case we just came back online
        triggerSync();
    }, [isOnline]);

    // Attempt to flush the queue to the backend
    const triggerSync = useCallback(async () => {
        if (!isOnline || isSyncing) return;

        const queuedActions = await flushSyncQueue();
        if (queuedActions.length === 0) return;

        setIsSyncing(true);
        try {
            const response = await axios.post(`${API_URL}/sync/batch`, {
                actions: queuedActions,
            });

            if (!response.data.success) {
                // If batch fails, re-queue the actions
                for (const action of queuedActions) {
                    await queueSyncAction(action);
                }
            }
        } catch (error) {
            console.error('Batch sync failed, re-queueing actions:', error);
            for (const action of queuedActions) {
                await queueSyncAction(action);
            }
        } finally {
            setIsSyncing(false);
        }
    }, [isOnline, isSyncing]);

    return {
        isOnline,
        isSyncing,
        queueLength,
        queueAction,
        triggerSync,
    };
};
