/**
 * @fileoverview UI indicator showing current connection status and sync queue state.
 */
import React from 'react';

const OfflineStatusIndicator = ({ isOnline, isSyncing, queueLength, onManualSync }) => {
    if (isOnline && queueLength === 0 && !isSyncing) {
        return (
            <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full shadow-lg border border-green-200 dark:border-green-800 text-sm font-medium">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Online & Synced
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border text-sm font-medium transition-colors ${isOnline
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                }`}>
                <span className={`relative flex h-3 w-3 ${!isOnline ? 'animate-pulse' : ''}`}>
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-blue-400' : 'bg-red-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                </span>
                {isOnline ? 'Syncing...' : 'Offline Mode'}
            </div>

            {queueLength > 0 && isOnline && (
                <button
                    onClick={onManualSync}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-lg text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {isSyncing ? (
                        <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Syncing {queueLength} items...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Sync Now ({queueLength})
                        </>
                    )}
                </button>
            )}

            {!isOnline && queueLength > 0 && (
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full shadow text-xs font-medium border border-gray-200 dark:border-gray-700">
                    {queueLength} action(s) queued for sync
                </div>
            )}
        </div>
    );
};

export default OfflineStatusIndicator;
