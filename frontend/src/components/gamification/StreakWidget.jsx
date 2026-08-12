import { Flame, Shield, Award, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const StreakWidget = ({
  currentStreak = 0,
  longestStreak = 0,
  streakFreezesAvailable = 0,
  onUseStreakFreeze,
  isFreezing = false,
}) => {
  return (
    <div className="bg-neutral-800/80 border border-neutral-700/50 rounded-xl p-5 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Flame className="w-24 h-24 text-amber-500" />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 shrink-0">
            <Flame className="w-8 h-8 fill-current" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-stone-400 font-semibold font-mono">
              DAILY STREAK
            </span>
            <h4 className="text-2xl font-black font-mono text-stone-100 flex items-baseline gap-2">
              {currentStreak} Days
              <span className="text-xs font-normal text-stone-400 font-sans">
                (Personal Best: {longestStreak} days)
              </span>
            </h4>
          </div>
        </div>

        {/* Streak Freeze & Shields controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 px-3 py-1.5 bg-indigo-950/40 border border-indigo-900/30 rounded-lg text-indigo-200 text-xs font-semibold">
            <Shield className="w-4 h-4 text-indigo-400 fill-current shrink-0" />
            <span>{streakFreezesAvailable} Shield{streakFreezesAvailable !== 1 ? 's' : ''} Available</span>
          </div>

          {streakFreezesAvailable > 0 && (
            <button
              onClick={onUseStreakFreeze}
              disabled={isFreezing}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-650 text-white rounded shadow text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFreezing ? 'Activating...' : 'Use Shield'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreakWidget;
