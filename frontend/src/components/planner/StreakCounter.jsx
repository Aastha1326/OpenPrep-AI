import { useEffect, useState } from 'react';

export default function StreakCounter({ currentStreak, longestStreak, consistencyScore }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 600);
    return () => clearTimeout(timer);
  }, [currentStreak]);

  const streakLevel =
    currentStreak >= 30
      ? 'legendary'
      : currentStreak >= 14
      ? 'champion'
      : currentStreak >= 7
      ? 'on-fire'
      : currentStreak >= 3
      ? 'warming-up'
      : 'starting';

  const streakColors = {
    legendary: 'from-yellow-400 to-orange-500',
    champion: 'from-orange-400 to-red-500',
    'on-fire': 'from-red-400 to-pink-500',
    'warming-up': 'from-amber-300 to-amber-500',
    starting: 'from-gray-300 to-gray-400',
  };

  const streakMessages = {
    legendary: '🏆 Legendary Streak!',
    champion: '👑 Champion Level!',
    'on-fire': '🔥 On Fire!',
    'warming-up': '⚡ Warming Up!',
    starting: '🌱 Just Getting Started',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      {/* Main Streak Display */}
      <div className="text-center mb-4">
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${streakColors[streakLevel]} ${
            animate ? 'scale-110' : 'scale-100'
          } transition-transform duration-300`}
        >
          <span className="text-3xl font-bold text-white">
            {currentStreak}
          </span>
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-2">
          {streakMessages[streakLevel]}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          consecutive study days
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {longestStreak}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Best Streak
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {consistencyScore || 0}%
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Consistency
          </p>
        </div>
      </div>

      {/* Streak Flame Visualization */}
      {currentStreak > 0 && (
        <div className="mt-3 flex items-center justify-center gap-0.5">
          {Array.from({ length: Math.min(currentStreak, 14) }).map((_, i) => (
            <div
              key={i}
              className={`text-xs ${
                i < currentStreak ? 'opacity-100' : 'opacity-20'
              }`}
              style={{
                animationDelay: `${i * 0.1}s`,
              }}
            >
              🔥
            </div>
          ))}
          {currentStreak > 14 && (
            <span className="text-xs text-gray-500 ml-1">+{currentStreak - 14}</span>
          )}
        </div>
      )}
    </div>
  );
}
