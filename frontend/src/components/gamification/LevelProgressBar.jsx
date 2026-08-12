import { motion } from 'framer-motion';

const LevelProgressBar = ({ xp = 0, level = 1, nextLevelXP = 100 }) => {
  // xp needed for current level is: (level-1)^2 * 100
  const currentLevelBaseXP = Math.pow(level - 1, 2) * 100;
  const xpInCurrentLevel = Math.max(0, xp - currentLevelBaseXP);
  const xpNeededForNextLevel = nextLevelXP - currentLevelBaseXP;
  
  const percentage = Math.min(
    100,
    Math.max(0, xpNeededForNextLevel > 0 ? (xpInCurrentLevel / xpNeededForNextLevel) * 100 : 0)
  );

  return (
    <div className="bg-neutral-800/80 border border-neutral-700/50 rounded-xl p-5 shadow-inner">
      <div className="flex justify-between items-center mb-3">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold font-mono">
            STUDENT STATUS
          </span>
          <h4 className="text-xl font-bold font-playfair text-stone-100 mt-0.5">
            Level {level} <span className="text-xs font-normal text-stone-400">({xp} Total XP)</span>
          </h4>
        </div>
        <div className="text-right">
          <span className="text-xs text-stone-400 font-mono">
            {xpInCurrentLevel} / {xpNeededForNextLevel} XP to Level {level + 1}
          </span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
        />
      </div>
    </div>
  );
};

export default LevelProgressBar;
