import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Flame, Brain, BookOpen, Target, Sun, Moon, Clock, Star, Trophy, ChevronLeft, ChevronRight, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import API from '../../services/api';

const ICON_MAP = {
  Flame,
  Brain,
  Book: BookOpen,
  Target,
  Sun,
  Moon,
  Clock,
  Star,
  Trophy,
  Award,
};

const BadgeCarousel = ({ userId }) => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newlyUnlockedId, setNewlyUnlockedId] = useState(null);
  const [selectedBadgeModal, setSelectedBadgeModal] = useState(null);
  const carouselRef = useRef(null);

  const fetchBadges = async () => {
    try {
      const res = await API.get('/user/badges');
      if (res.data?.success) {
        setBadges(res.data.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch user badges:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, [userId]);

  const categories = [
    { key: 'all', label: 'All Badges' },
    { key: 'streak', label: 'Streaks' },
    { key: 'quiz', label: 'Quizzes' },
    { key: 'flashcard', label: 'Flashcards' },
    { key: 'study', label: 'Study Sessions' },
  ];

  const filteredBadges = badges.filter(
    (b) => selectedCategory === 'all' || b.category === selectedCategory
  );

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const renderBadgeIcon = (iconName, svgIcon, unlocked) => {
    const IconComp = ICON_MAP[iconName] || Award;
    if (svgIcon && unlocked) {
      return (
        <div
          className="w-8 h-8 text-amber-500"
          dangerouslySetInnerHTML={{ __html: svgIcon }}
        />
      );
    }
    return <IconComp className={`w-7 h-7 ${unlocked ? 'text-amber-500 dark:text-amber-400' : 'text-neutral-400 dark:text-neutral-600'}`} />;
  };

  return (
    <div className="space-y-4 my-6" data-testid="badge-carousel-container">
      {/* Category Tabs & Carousel Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === cat.key
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition"
            aria-label="Previous badges"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition"
            aria-label="Next badges"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel Scroll Container */}
      <div
        ref={carouselRef}
        className="flex items-center gap-4 overflow-x-auto pb-4 pt-2 scrollbar-none snap-x snap-mandatory"
      >
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="min-w-[200px] h-[160px] rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 animate-pulse border border-neutral-200 dark:border-neutral-700/50"
            />
          ))
        ) : filteredBadges.length > 0 ? (
          filteredBadges.map((item) => {
            const isUnlocked = item.unlocked;
            const isJustUnlocked = newlyUnlockedId === item.id;

            return (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedBadgeModal(item)}
                className={`snap-start min-w-[210px] max-w-[210px] p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 dark:from-amber-950/40 dark:via-neutral-900 dark:to-neutral-900 border-amber-500/30 dark:border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 opacity-80'
                }`}
                data-testid={`badge-card-${item.id}`}
              >
                {/* Unlock Animation Aura */}
                {isJustUnlocked && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.8, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-amber-400/20 rounded-2xl pointer-events-none"
                  />
                )}

                <div className="flex items-start justify-between mb-2">
                  <div
                    className={`p-3 rounded-xl ${
                      isUnlocked
                        ? 'bg-amber-500/20 text-amber-500 ring-2 ring-amber-500/30'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {renderBadgeIcon(item.icon, item.svgIcon, isUnlocked)}
                  </div>
                  {isUnlocked ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Earned
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-playfair font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5">
                    {item.description}
                  </p>
                </div>

                {/* Progress bar for locked badges */}
                {!isUnlocked && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 mb-1">
                      <span>Progress</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-neutral-500 w-full">
            No badges found in this category.
          </div>
        )}
      </div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center relative"
            >
              <button
                onClick={() => setSelectedBadgeModal(null)}
                className="absolute top-3 right-3 p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>

              <div className="w-16 h-16 mx-auto mb-4 p-4 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                {renderBadgeIcon(selectedBadgeModal.icon, selectedBadgeModal.svgIcon, selectedBadgeModal.unlocked)}
              </div>

              <h3 className="text-lg font-bold font-playfair text-neutral-900 dark:text-neutral-100">
                {selectedBadgeModal.name}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {selectedBadgeModal.description}
              </p>

              <div className="mt-4 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-xs space-y-1">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Status:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {selectedBadgeModal.unlocked ? 'Unlocked 🏆' : 'Locked 🔒'}
                  </span>
                </div>
                {selectedBadgeModal.unlockedAt && (
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Earned On:</span>
                    <span>{new Date(selectedBadgeModal.unlockedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {!selectedBadgeModal.unlocked && (
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Criteria:</span>
                    <span>{selectedBadgeModal.currentValue || 0} / {selectedBadgeModal.criteriaThreshold}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BadgeCarousel;
