import React, { useState } from 'react';
import { Trophy, Star, Shield, Award, Flame, Clock, Lock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap = { Trophy, Star, Shield, Award, Flame, Clock, Sparkles };

const BadgeGrid = ({ badges = [], unlockedBadgeIds = [] }) => {
  const [activeCategory, setActiveCategory] = useState('ALL');

  const categories = ['ALL', 'STREAK', 'QUIZ', 'STUDY_TIME', 'MASTERY'];

  const filteredBadges = activeCategory === 'ALL'
    ? badges
    : badges.filter((b) => b.category === activeCategory);

  return (
    <div className="bg-gray-900/60 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-yellow-400" size={22} />
            Achievement Badges
          </h3>
          <p className="text-sm text-gray-400">Unlock tiers as you study and level up</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeCategory === cat
                  ? 'bg-yellow-500 text-gray-950 shadow-md'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredBadges.map((badge) => {
          const isUnlocked = unlockedBadgeIds.includes(badge.id);
          const IconComponent = iconMap[badge.icon] || Award;

          return (
            <motion.div
              key={badge.id}
              whileHover={{ y: -4 }}
              className={`relative p-4 rounded-2xl border text-center transition-all ${
                isUnlocked
                  ? 'bg-gradient-to-b from-gray-800/90 to-gray-850 border-yellow-500/30 shadow-lg shadow-yellow-500/5'
                  : 'bg-gray-850/40 border-gray-800 opacity-60'
              }`}
            >
              <div className="relative mx-auto w-14 h-14 mb-3 flex items-center justify-center rounded-2xl bg-gray-900 border border-gray-700">
                {isUnlocked ? (
                  <IconComponent size={28} className="text-yellow-400" />
                ) : (
                  <Lock size={24} className="text-gray-500" />
                )}
              </div>

              <h4 className="font-bold text-sm text-white truncate">{badge.name}</h4>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{badge.description}</p>
              <span className="inline-block mt-2 text-[11px] font-bold text-yellow-400/90 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                +{badge.xpReward} XP
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeGrid;
