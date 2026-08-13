import { useEffect, useState } from 'react';
import { CONNECTIVITY_EVENT, isApiOnline } from '../../services/api';

/**
 * Connectivity banner.
 *
 * Without this a request fired while offline surfaces as a generic
 * "Network Error" toast, which is indistinguishable from the server being
 * down — the user retries the same action instead of checking their
 * connection. Driven by the api client's connectivity event rather than
 * `navigator.onLine` alone, because the browser flag reports true on a
 * captive-portal wifi that cannot actually reach the API.
 */
const OfflineBanner = () => {
  const [online, setOnline] = useState(() => isApiOnline());
  // Distinguishes "was never online" from "dropped and came back", so the
  // reassuring message only shows after an actual interruption.
  const [wasOffline, setWasOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleConnectivity = (event) => {
      const next = event?.detail?.online ?? true;
      setOnline(next);
      if (!next) {
        setWasOffline(true);
        setShowRestored(false);
      }
    };

    window.addEventListener(CONNECTIVITY_EVENT, handleConnectivity);
    return () => window.removeEventListener(CONNECTIVITY_EVENT, handleConnectivity);
  }, []);

  useEffect(() => {
    if (!online || !wasOffline) return undefined;

    setShowRestored(true);
    const timer = setTimeout(() => {
      setShowRestored(false);
      setWasOffline(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [online, wasOffline]);

  if (online && !showRestored) return null;

  const offline = !online;

  return (
    <div
      // polite rather than assertive: connectivity is worth announcing but
      // should not interrupt whatever the screen reader is mid-sentence on.
      role="status"
      aria-live="polite"
      data-testid="offline-banner"
      className={`fixed top-0 inset-x-0 z-[9998] px-4 py-2 text-center text-xs font-semibold transition-colors duration-300 ${
        offline ? 'bg-yellow-600 text-neutral-950' : 'bg-emerald-600 text-white'
      }`}
    >
      {offline
        ? "You're offline. Changes will be retried automatically once your connection returns."
        : 'Back online.'}
    </div>
  );
};

export default OfflineBanner;
