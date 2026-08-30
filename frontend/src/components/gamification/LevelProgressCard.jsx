import React from 'react';
import { Flame, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const LevelProgressCard = ({ level = 1, currentXP = 0, levelXPProgress = 0, levelXPRequired = 100, streakCount = 0, streakFreezes = 0, onOpenFreezeModal }) => {
  const pct = Math.min(100, Math.round((levelXPProgress / Math.max(1, levelXPRequired)) * 100));

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-400 flex items-center justify-center font-black text-gray-950 text-xl shadow-lg shadow-yellow-500/20">
            {level}
          </div>
          <div>
            <h4 className="font-extrabold text-white text-lg">Scholar Level {level}</h4>
            <p className="text-xs text-gray-400">{currentXP} Total XP Earned</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-bold">
            <Flame size={18} />
            <span>{streakCount}d</span>
          </div>

          <button
            onClick={onOpenFreezeModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-sm font-bold transition-all"
            title="Manage Streak Freezes"
          >
            <Shield size={18} />
            <span>{streakFreezes}</span>
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-gray-400">
          <span>Progress to Level {level + 1}</span>
          <span>{levelXPProgress} / {levelXPRequired} XP ({pct}%)</span>
        </div>

        <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden p-0.5 border border-gray-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default LevelProgressCard;
