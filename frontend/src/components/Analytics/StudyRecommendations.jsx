import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  AlertTriangle,
  Clock,
  Layers,
  Timer,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Zap,
  BookOpen,
  Flame,
} from 'lucide-react';

/**
 * Icon mapping for recommendation types
 */
const ICON_MAP = {
  Target,
  AlertTriangle,
  Clock,
  Layers,
  Timer,
  TrendingUp,
};

/**
 * Priority styling
 */
const PRIORITY_STYLES = {
  high: {
    dot: 'bg-rose-500',
    border: 'border-rose-500/25',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    glow: 'shadow-rose-500/5',
  },
  medium: {
    dot: 'bg-amber-500',
    border: 'border-amber-500/20',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    glow: 'shadow-amber-500/5',
  },
  low: {
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/20',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    glow: 'shadow-emerald-500/5',
  },
};

/**
 * StudyRecommendations
 * Displays AI-powered study recommendations, peak hours,
 * and summary stats cards.
 */
export default function StudyRecommendations({ recommendations = [], summary = {} }) {
  const {
    consistency = 0,
    activeDays = 0,
  } = recommendations._meta || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-rose-500/15 border border-rose-500/25 rounded-xl">
          <Sparkles className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-stone-100 font-display">
            Study Insights & Recommendations
          </h3>
          <p className="text-xs text-stone-500 font-mono mt-0.5">
            Data-driven tips to improve your preparation
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
          <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
          <div>
            <p className="text-base font-black font-mono text-stone-200 leading-none">
              {(summary.totalStudyMinutes || 0).toLocaleString()}
            </p>
            <p className="text-[9px] text-stone-500 uppercase tracking-wider mt-0.5">
              Study Minutes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl">
          <BookOpen className="w-4 h-4 text-violet-400 shrink-0" />
          <div>
            <p className="text-base font-black font-mono text-stone-200 leading-none">
              {(summary.totalFlashcards || 0).toLocaleString()}
            </p>
            <p className="text-[9px] text-stone-500 uppercase tracking-wider mt-0.5">
              Flashcards
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <Flame className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <p className="text-base font-black font-mono text-stone-200 leading-none">
              {(summary.totalXpEarned || 0).toLocaleString()}
            </p>
            <p className="text-[9px] text-stone-500 uppercase tracking-wider mt-0.5">
              XP Earned
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      {recommendations.length > 0 ? (
        <div className="space-y-3">
          {recommendations.map((rec, idx) => {
            const IconComp = ICON_MAP[rec.icon] || Target;
            const style = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.medium;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                className={`flex items-start gap-4 p-4 rounded-xl border bg-stone-950/40 hover:bg-stone-900/60 transition-all cursor-pointer group ${style.border} shadow-lg ${style.glow}`}
              >
                {/* Icon */}
                <div className="p-2 rounded-lg bg-stone-800/60 border border-stone-700/30 shrink-0 mt-0.5">
                  <IconComp className="w-4 h-4 text-stone-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-stone-200 truncate">
                      {rec.title}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${style.badge}`}
                    >
                      <span className={`w-1 h-1 rounded-full ${style.dot}`} />
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed mb-2">
                    {rec.description}
                  </p>
                  {rec.action && (
                    <p className="text-[11px] text-indigo-400 font-semibold group-hover:text-indigo-300 transition">
                      → {rec.action}
                    </p>
                  )}
                </div>

                {/* Metric */}
                {rec.metric && (
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono font-bold text-stone-300">
                      {rec.metric}
                    </p>
                  </div>
                )}

                <ChevronRight className="w-4 h-4 text-stone-700 group-hover:text-stone-500 transition shrink-0 mt-1" />
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="w-8 h-8 text-stone-700 mx-auto mb-2" />
            <p className="text-sm text-stone-600">Keep studying — insights will appear soon!</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
