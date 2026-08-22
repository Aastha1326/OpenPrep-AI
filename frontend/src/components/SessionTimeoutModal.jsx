import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, RefreshCw, Save, LogOut } from 'lucide-react';
import { useSessionTimer } from '../context/SessionTimerContext';

const formatTime = (totalSeconds) => {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60);
  const secs = Math.max(0, totalSeconds) % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const SessionTimeoutModal = () => {
  const {
    remainingSeconds,
    showWarningModal,
    isExtending,
    extendSession,
    saveAndExit,
    handleLogout,
  } = useSessionTimer();

  if (!showWarningModal) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-inter"
        data-testid="session-timeout-modal"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#FFFBE9] dark:bg-[#1f150c] rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-amber-500/40 dark:border-amber-600/40 text-neutral-900 dark:text-neutral-100"
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-warning-title"
        >
          <div className="flex items-center justify-center w-14 h-14 mx-auto bg-amber-500/20 dark:bg-amber-900/40 rounded-full mb-4 ring-8 ring-amber-500/10">
            <AlertTriangle className="w-7 h-7 text-amber-700 dark:text-amber-400" />
          </div>

          <h2
            id="session-warning-title"
            className="text-2xl font-bold text-center mb-2 font-playfair text-amber-900 dark:text-amber-200"
          >
            Session Expiring Soon
          </h2>

          <p className="text-center text-sm text-neutral-600 dark:text-neutral-300 mb-5 leading-relaxed">
            Your login session will expire in 2 minutes due to inactivity. Extend your session now to keep studying or save progress before logging out.
          </p>

          {/* Formatted Countdown Badge */}
          <div className="flex items-center justify-center gap-2 mb-6 px-4 py-3 bg-amber-500/15 dark:bg-amber-950/40 border border-amber-600/30 rounded-xl">
            <Clock className="w-5 h-5 text-amber-700 dark:text-amber-400 animate-pulse" />
            <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">Time remaining:</span>
            <span className="text-lg font-mono font-bold text-amber-800 dark:text-amber-300 tracking-wider">
              {formatTime(remainingSeconds)}
            </span>
          </div>

          {/* Action Buttons: Extend vs Save & Exit */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={saveAndExit}
              className="flex-1 px-4 py-2.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save &amp; Exit
            </button>

            <button
              type="button"
              onClick={extendSession}
              disabled={isExtending}
              className="flex-1 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isExtending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Extending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" /> Extend Session
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SessionTimeoutModal;
