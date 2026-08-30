import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Star, Shield, Award, Sparkles, Flame, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const getIcon = (iconName) => {
  switch (iconName) {
    case 'Trophy': return Trophy;
    case 'Star': return Star;
    case 'Shield': return Shield;
    case 'Flame': return Flame;
    case 'Clock': return Clock;
    case 'Sparkles': return Sparkles;
    default: return Award;
  }
};

const BadgeShowcase = ({ badge, onClose }) => {
  useEffect(() => {
    if (badge) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6'],
      });

      const audio = new Audio('/sounds/unlock.mp3');
      audio.play().catch(() => {});
    }
  }, [badge]);

  if (!badge) return null;

  const Icon = getIcon(badge.icon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative bg-gradient-to-b from-gray-900 via-gray-850 to-gray-800 p-8 rounded-3xl border border-yellow-500/40 shadow-2xl shadow-yellow-500/20 max-w-sm w-full text-center"
      >
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-60 rounded-full animate-pulse" />
            <div className="relative bg-gray-900 p-4 rounded-full border-2 border-yellow-500 shadow-xl">
              <Icon size={48} className="text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <span className="text-xs uppercase tracking-widest font-extrabold text-yellow-500">
            {badge.tier || 'Gold'} Achievement
          </span>
          <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            {badge.name}
          </h2>
          <p className="text-gray-300 text-sm">{badge.description}</p>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 rounded-full border border-yellow-500/30">
            <Sparkles size={16} className="text-yellow-400" />
            <span className="text-yellow-400 font-bold text-sm">+{badge.xpReward} XP Reward</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-950 font-black rounded-xl shadow-lg transition-all"
        >
          Claim & Continue
        </button>
      </motion.div>
    </div>
  );
};

export default BadgeShowcase;
