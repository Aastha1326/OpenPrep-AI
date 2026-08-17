import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowSyncSuccess(true);
      const timer = setTimeout(() => setShowSyncSuccess(false), 3000);
      return () => clearTimeout(timer);
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
        <span>Back Online! Syncing review progress...</span>
      </div>
    );
  }

  return null;
};

export default OfflineIndicator;
