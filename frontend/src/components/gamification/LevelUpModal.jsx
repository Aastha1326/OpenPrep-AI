import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpCircle, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const LevelUpModal = ({ level = 1, isOpen = false, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti burst!
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f5a623', '#ffffff'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="w-full max-w-sm rounded-2xl border border-indigo-500/40 bg-neutral-900 p-8 text-center shadow-[0_0_50px_rgba(59,130,246,0.25)] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 text-stone-400 hover:bg-neutral-800 hover:text-stone-150 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center">
            {/* Sparkles */}
            <div className="flex gap-1.5 text-indigo-400 animate-pulse mb-2">
              <Sparkles className="h-5 w-5 fill-current" />
              <Sparkles className="h-5 w-5 fill-current" style={{ animationDelay: '350ms' }} />
            </div>

            <div className="rounded-full bg-indigo-500/10 border-2 border-indigo-500/50 p-5 text-indigo-400 mb-4 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <ArrowUpCircle className="h-14 w-14 fill-current" />
            </div>

            <span className="text-[10px] tracking-[0.2em] font-black uppercase text-indigo-400 font-mono">
              LEVEL COMPLETED
            </span>
            <h3 className="text-3xl font-extrabold font-playfair text-stone-150 mt-2">
              LEVEL UP!
            </h3>
            <p className="text-lg font-semibold text-amber-500 mt-1">
              You reached Level {level}
            </p>
            <p className="text-sm text-stone-300 mt-3 leading-relaxed">
              Your dedication and daily revisions are bearing fruit. Keep aiming higher!
            </p>

            <button
              onClick={onClose}
              className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-650 text-white font-extrabold rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all font-sans text-sm"
            >
              Continue Journey
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LevelUpModal;
