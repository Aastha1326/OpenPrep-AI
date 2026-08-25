import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Flame,
  Brain,
  Book,
  Target,
  Sun,
  Moon,
  Clock,
  Crown,
  Sparkles,
  CheckCircle2,
  Lock,
  RefreshCw,
  Filter,
} from 'lucide-react';
import API from '../../services/api';

const ICON_MAP = {
  Flame,
  Brain,
  Award,
  Book,
  Target,
  Sun,
  Moon,
  Clock,
  Crown,
};

export function BadgeShowcase() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [unlockToast, setUnlockToast] = useState(null);

  const fetchUserBadges = async () => {
    setLoading(true);
    try {
      const res = await API.get('/badges/user');
      if (res.data?.success) {
        setBadges(res.data.data || []);
      }
    } catch (err) {
      console.warn('Failed to load user badges:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBadges();
  }, []);

  const handleEvaluateBadges = async () => {
    setEvaluating(true);
    try {
      const res = await API.post('/badges/evaluate');
      if (res.data?.success && res.data.newlyUnlockedCount > 0) {
        setUnlockToast(`🎉 Unlocked ${res.data.newlyUnlockedCount} new badge(s)!`);
        setTimeout(() => setUnlockToast(null), 5000);
      }
      await fetchUserBadges();
    } catch (err) {
      console.warn('Failed to evaluate badges:', err.message);
    } finally {
      setEvaluating(false);
    }
  };

  const categories = ['all', 'streak', 'quiz', 'interview', 'flashcard', 'study', 'achievement'];

  const filteredBadges = badges.filter(
    (b) => categoryFilter === 'all' || b.category === categoryFilter
  );

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm font-inter space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-playfair">Collectible Badges Showcase</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Unlocked: <span className="font-bold text-amber-600 dark:text-amber-400">{unlockedCount}</span> / {totalCount} Badges
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleEvaluateBadges}
          disabled={evaluating}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
          <span>{evaluating ? 'Evaluating...' : 'Check For New Badges'}</span>
        </button>
      </div>

      {/* Unlock Toast Notification */}
      <AnimatePresence>
        {unlockToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{unlockToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filters */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-neutral-400 shrink-0 mr-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition shrink-0 ${
              categoryFilter === cat
                ? 'bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 shadow'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      {loading ? (
        <div className="py-12 text-center text-neutral-400 text-xs flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading collectible badges...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => {
            const IconComp = ICON_MAP[badge.icon] || Award;
            const isUnlocked = badge.unlocked;

            return (
              <div
                key={badge.id}
                className={`relative rounded-2xl p-4 border transition-all duration-300 ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/40 shadow-sm'
                    : 'bg-neutral-50 dark:bg-neutral-950/40 border-neutral-200 dark:border-neutral-800 opacity-75'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon Medallion */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isUnlocked
                        ? 'bg-gradient-to-tr from-amber-500 to-amber-600 border-amber-400 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-400'
                    }`}
                  >
                    {badge.svgIcon ? (
                      <div
                        className="w-6 h-6"
                        dangerouslySetInnerHTML={{ __html: badge.svgIcon }}
                      />
                    ) : (
                      <IconComp className="w-6 h-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-sm font-bold truncate text-neutral-900 dark:text-neutral-100">
                        {badge.name}
                      </h3>
                      {isUnlocked ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          UNLOCKED
                        </span>
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                      {badge.description}
                    </p>

                    {/* Points & Progress Bar */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono">
                          +{badge.badge?.pointsValue || 100} PTS
                        </span>
                        <span className="text-neutral-400 font-mono">
                          {isUnlocked ? '100%' : `${badge.progress || 0}%`}
                        </span>
                      </div>

                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            isUnlocked ? 'bg-amber-500' : 'bg-neutral-400'
                          }`}
                          style={{ width: `${isUnlocked ? 100 : badge.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BadgeShowcase;
