import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import offlineSyncService from '../../services/offlineSyncService';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [syncCount, setSyncCount] = useState(0);

  useEffect(() => {
    let timer;
    const handleOnline = async () => {
      setIsOnline(true);
      try {
        const result = await offlineSyncService.syncOfflineReviews();
        if (result && result.synced > 0) {
          setSyncCount(result.synced);
          setShowSyncSuccess(true);
          timer = setTimeout(() => {
            setShowSyncSuccess(false);
            setSyncCount(0);
          }, 4000);
        }
      } catch (err) {
        console.error('Error during online sync:', err);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowSyncSuccess(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="assertive"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg shadow-lg font-semibold text-sm animate-bounce"
      >
        <WifiOff className="w-5 h-5" />
        <span>Working Offline (Reviews are saved locally)</span>
      </div>
    );
  }

  if (showSyncSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg shadow-lg font-semibold text-sm animate-fade-in"
      >
        <Wifi className="w-5 h-5" />
        <span>Back Online! Synced {syncCount} offline reviews successfully.</span>
      </div>
    );
  }

  return null;
};

export default OfflineIndicator;
