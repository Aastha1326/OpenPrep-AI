import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { setAiQuotaExceededUntil, setAiQuotaErrorMsg } from '../../store/slices/authSlice';

const QuotaExceededModal = () => {
  const dispatch = useDispatch();
  const { aiQuotaExceededUntil, aiQuotaErrorMsg } = useSelector((state) => state.auth);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!aiQuotaExceededUntil) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((aiQuotaExceededUntil - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        localStorage.removeItem('ai_quota_reset_time');
        localStorage.removeItem('ai_quota_error_msg');
        dispatch(setAiQuotaExceededUntil(null));
        dispatch(setAiQuotaErrorMsg(null));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [aiQuotaExceededUntil, dispatch]);

  if (!aiQuotaExceededUntil || timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleClose = () => {
    // Clear modal from local state, but keep the lock until timer finishes
    dispatch(setAiQuotaExceededUntil(null));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="w-full max-w-md rounded-xl border border-red-500/30 bg-neutral-900 p-6 text-stone-100 shadow-[0_10px_50px_rgba(239,68,68,0.2)]"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-950 p-2.5 text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold font-playfair text-red-400">AI Limit Exceeded</h3>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-1.5 text-stone-400 hover:bg-neutral-800 hover:text-stone-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mt-4 text-sm text-stone-300 leading-relaxed">
            {aiQuotaErrorMsg || 'You have triggered too many AI requests. Please wait before generating more content.'}
          </p>

          <div className="mt-6 flex items-center gap-3 rounded-lg bg-red-950/40 border border-red-900/40 p-4 text-red-200">
            <Clock className="h-5 w-5 animate-pulse text-red-400 shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-red-400">Time Until Reset</p>
              <p className="text-2xl font-mono font-bold mt-0.5">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-stone-200 rounded-lg text-sm font-semibold transition-colors border border-stone-700"
            >
              Acknowledge
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuotaExceededModal;
