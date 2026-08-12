import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const BadgeUnlockModal = ({ title = '', description = '', isOpen = false, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      // Fire celebration confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f5a623', '#f8e71c', '#ffffff'],
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
          className="w-full max-w-sm rounded-2xl border border-amber-500/40 bg-neutral-900 p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden"
        >
          {/* Confetti ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 text-stone-400 hover:bg-neutral-800 hover:text-stone-150 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center">
            {/* Sparkles Decoration */}
            <div className="flex gap-1.5 text-amber-400 animate-bounce mb-2">
              <Sparkles className="h-5 w-5 fill-current" />
              <Sparkles className="h-5 w-5 fill-current" style={{ animationDelay: '200ms' }} />
            </div>

            <div className="rounded-full bg-amber-500/10 border-2 border-amber-500/50 p-5 text-amber-400 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Award className="h-14 w-14 fill-current" />
            </div>

            <span className="text-[10px] tracking-[0.2em] font-black uppercase text-amber-500 font-mono">
              ACHIEVEMENT UNLOCKED
            </span>
            <h3 className="text-2xl font-bold font-playfair text-stone-100 mt-2">
              {title || 'New Achievement'}
            </h3>
            <p className="text-sm text-stone-300 mt-3 leading-relaxed">
              {description || 'You met the criteria for unlocking this badge. Outstanding study habit!'}
            </p>

            <button
              onClick={onClose}
              className="mt-6 w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-extrabold rounded-xl shadow-lg hover:shadow-amber-500/10 transition-all font-sans text-sm"
            >
              Magnificent!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BadgeUnlockModal;
