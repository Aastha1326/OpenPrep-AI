import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, Trophy, BookOpen, Brain, ChevronRight } from 'lucide-react';

/**
 * Mastery level config
 */
const MASTERY_LEVELS = {
  Mastered: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', ring: '#22c55e' },
  Proficient: { color: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/30', ring: '#0ea5e9' },
  Developing: { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', ring: '#f59e0b' },
  'Needs Work': { color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30', ring: '#f43f5e' },
};

/**
 * Circular progress ring component
 */
function MasteryRing({ mastery, color, size = 56 }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (mastery / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#292524"
        strokeWidth={4}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
      />
    </svg>
  );
}

/**
 * SubjectMasteryGrid
 * Displays a grid of subject cards with mastery rings,
 * quiz stats, and mastery level badges.
 */
export default function SubjectMasteryGrid({ subjects = [] }) {
  const sortedSubjects = useMemo(() => {
    if (!subjects || subjects.length === 0) return [];
    return [...subjects].sort((a, b) => (b.mastery || 0) - (a.mastery || 0));
  }, [subjects]);

  const overallMastery = useMemo(() => {
    if (sortedSubjects.length === 0) return 0;
    return Math.round(
      sortedSubjects.reduce((s, sub) => s + (sub.mastery || 0), 0) / sortedSubjects.length
    );
  }, [sortedSubjects]);

  const overallConfig = MASTERY_LEVELS[
    overallMastery >= 80 ? 'Mastered' :
    overallMastery >= 50 ? 'Proficient' :
    overallMastery >= 25 ? 'Developing' : 'Needs Work'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/15 border border-violet-500/25 rounded-xl">
            <Target className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-100 font-display">
              Subject Mastery
            </h3>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              {sortedSubjects.length} subjects tracked
            </p>
          </div>
        </div>

        {/* Overall mastery badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${overallConfig.bg} ${overallConfig.border}`}>
          <Trophy className={`w-3.5 h-3.5 ${overallConfig.color}`} />
          <span className={`text-xs font-bold font-mono ${overallConfig.color}`}>
            {overallMastery}% Overall
          </span>
        </div>
      </div>

      {/* Subject Grid */}
      {sortedSubjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sortedSubjects.map((subject, idx) => {
            const config = MASTERY_LEVELS[subject.masteryLabel] || MASTERY_LEVELS['Needs Work'];
            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`relative flex items-center gap-4 p-4 rounded-xl border bg-stone-950/40 hover:bg-stone-900/60 transition-all cursor-pointer group ${config.border}`}
              >
                {/* Mastery Ring */}
                <div className="relative shrink-0">
                  <MasteryRing mastery={subject.mastery} color={config.ring} />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-black font-mono text-stone-200">
                    {subject.mastery}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: subject.color }}
                    />
                    <h4 className="text-sm font-bold text-stone-200 truncate">
                      {subject.name}
                    </h4>
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.bg} ${config.color} border ${config.border}`}>
                    {subject.masteryLabel}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      {subject.totalAttempts} quizzes
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {subject.flashcardCount} cards
                    </span>
                  </div>
                </div>

                {/* Hover arrow */}
                <ChevronRight className="w-4 h-4 text-stone-700 group-hover:text-stone-400 transition shrink-0" />
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center">
          <div className="text-center">
            <Target className="w-10 h-10 text-stone-700 mx-auto mb-2" />
            <p className="text-sm text-stone-600">No subjects tracked yet.</p>
            <p className="text-xs text-stone-700 mt-1">Take quizzes to build your mastery profile.</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
