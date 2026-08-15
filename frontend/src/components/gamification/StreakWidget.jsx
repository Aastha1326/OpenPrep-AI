import { Flame, Shield, LockKeyhole } from 'lucide-react';
import { motion } from 'framer-motion';

const MILESTONES = [
  {
    days: 7,
    code: 'seven_day_streak',
    label: '7 Days',
  },
  {
    days: 30,
    code: 'thirty_day_streak',
    label: '30 Days',
  },
  {
    days: 100,
    code: 'hundred_day_streak',
    label: '100 Days',
  },
];

const StreakWidget = ({
  currentStreak = 0,
  longestStreak = 0,
  streakFreezesAvailable = 0,
  badges = [],
}) => {
  const unlockedBadgeCodes = new Set(
    badges.map((badge) => badge.badgeCode)
  );

  return (
    <div
      className="bg-neutral-800/80 border border-neutral-700/50 rounded-xl p-5 shadow-lg relative overflow-hidden"
      aria-label="Daily study streak"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Flame className="w-24 h-24 text-amber-500" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{
                scale: currentStreak > 0 ? [1, 1.08, 1] : 1,
              }}
              transition={{
                duration: 1.5,
                repeat: currentStreak > 0 ? Infinity : 0,
              }}
              className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 shrink-0"
            >
              <Flame className="w-8 h-8 fill-current" />
            </motion.div>

            <div>
              <span className="text-xs uppercase tracking-widest text-stone-400 font-semibold font-mono">
                DAILY STREAK
              </span>

              <h4 className="text-2xl font-black font-mono text-stone-100 flex items-baseline gap-2">
                {currentStreak} Days
              </h4>

              <span className="text-xs text-stone-400">
                Personal Best: {longestStreak} days
              </span>
            </div>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-950/40 border border-indigo-900/30 rounded-lg text-indigo-200 text-xs font-semibold"
            title="A Streak Freeze is automatically used when you miss exactly one study day."
          >
            <Shield
              className="w-4 h-4 text-indigo-400 fill-current"
              aria-hidden="true"
            />

            <span>
              {streakFreezesAvailable} Freeze
              {streakFreezesAvailable !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold mb-3">
            Streak Milestones
          </p>

          <div className="grid grid-cols-3 gap-2">
            {MILESTONES.map((milestone) => {
              const unlocked =
                unlockedBadgeCodes.has(milestone.code) ||
                currentStreak >= milestone.days;

              return (
                <div
                  key={milestone.code}
                  className={`rounded-lg border p-2 text-center ${
                    unlocked
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : 'border-neutral-700 bg-neutral-900/40'
                  }`}
                  aria-label={
                    unlocked
                      ? `${milestone.days}-day streak badge unlocked`
                      : `${milestone.days}-day streak badge locked`
                  }
                >
                  {unlocked ? (
                    <Flame
                      className="w-5 h-5 mx-auto text-amber-400"
                      aria-hidden="true"
                    />
                  ) : (
                    <LockKeyhole
                      className="w-5 h-5 mx-auto text-neutral-500"
                      aria-hidden="true"
                    />
                  )}

                  <p
                    className={`text-xs font-bold mt-1 ${
                      unlocked
                        ? 'text-amber-300'
                        : 'text-neutral-500'
                    }`}
                  >
                    {milestone.label}
                  </p>

                  {unlocked && (
                    <p className="text-[10px] text-emerald-400 mt-0.5">
                      Unlocked
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-3 text-[11px] text-stone-500">
          A Streak Freeze automatically protects your streak after one missed
          study day.
        </p>
      </div>
    </div>
  );
};

export default StreakWidget;