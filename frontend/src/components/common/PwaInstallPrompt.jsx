import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-xl border border-neutral-200 dark:border-neutral-700 flex flex-col gap-3">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
            Install OpenPrep AI
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Install on your home screen for quick, offline-capable access.
          </p>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition text-neutral-400"
          aria-label="Dismiss prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <button
        onClick={handleInstall}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
      >
        <Download className="w-4 h-4" />
        Install App
      </button>
    </div>
  );
};

export default PwaInstallPrompt;
