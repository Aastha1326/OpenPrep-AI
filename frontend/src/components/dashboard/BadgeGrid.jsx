import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Share2, X, Star, Zap, BookOpen, Trophy } from 'lucide-react';

const badges = [
  { id: 'first-quiz', icon: Star, title: 'Quiz Starter', desc: 'Completed your first quiz', unlocked: true, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { id: 'streak-7', icon: Zap, title: '7 Day Streak', desc: 'Studied 7 days in a row', unlocked: true, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'deck-10', icon: BookOpen, title: 'Deck Master', desc: 'Mastered 10 flashcard decks', unlocked: false, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'score-100', icon: Trophy, title: 'Perfect Score', desc: 'Got 100% on a practice quiz', unlocked: false, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

const BadgeGrid = () => {
  const [selectedBadge, setSelectedBadge] = useState(null);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-playfair text-xl font-bold flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-700" />
          Achievement Badges
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <motion.button
              key={badge.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => badge.unlocked && setSelectedBadge(badge)}
              className={`relative flex flex-col items-center p-4 rounded-xl border text-center transition-all ${
                badge.unlocked 
                  ? `${badge.bg} border-${badge.color.split('-')[1]}-200 hover:shadow-md cursor-pointer`
                  : 'bg-stone-50 dark:bg-slate-900/50 border-stone-200 dark:border-slate-700 opacity-60 grayscale cursor-not-allowed'
              }`}
            >
              <div className={`p-3 rounded-full mb-3 ${badge.unlocked ? badge.bg : 'bg-stone-200 dark:bg-slate-800'}`}>
                <Icon className={`w-8 h-8 ${badge.unlocked ? badge.color : 'text-stone-400 dark:text-stone-600'}`} />
              </div>
              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200 leading-tight mb-1">{badge.title}</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-tight">{badge.desc}</p>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Background flare */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-400/20 to-transparent -z-10" />
              
              <button 
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-1 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>

              <div className="mt-4 mb-6 relative inline-block">
                <div className={`p-6 rounded-full ${selectedBadge.bg}`}>
                  <selectedBadge.icon className={`w-16 h-16 ${selectedBadge.color}`} />
                </div>
                {/* Sparkles */}
                <Star className="absolute top-0 right-0 w-6 h-6 text-yellow-400 animate-pulse" />
                <Star className="absolute bottom-0 left-0 w-4 h-4 text-yellow-400 animate-pulse delay-75" />
              </div>

              <h2 className="font-playfair text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">
                {selectedBadge.title}
              </h2>
              <p className="text-stone-500 dark:text-stone-400 mb-8">
                {selectedBadge.desc}
              </p>

              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all">
                <Share2 className="w-5 h-5" />
                Share Achievement
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BadgeGrid;
