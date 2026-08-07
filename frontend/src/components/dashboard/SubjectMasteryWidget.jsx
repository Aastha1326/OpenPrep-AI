import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, RefreshCw, ChevronDown, ChevronRight, GraduationCap } from 'lucide-react';
import API from '../../services/api';
import VintagePaper from './VintagePaper';

// ── Mastery tier configuration ──
// Colors follow the issue spec: Red < 50% | Yellow 50-79% | Green 80%+
const TIER_CONFIG = {
  Beginner: {
    label: 'Beginner',
    ring: '#dc2626',
    badge: 'bg-red-100 text-red-800 border-red-300',
    text: 'text-red-700',
  },
  Intermediate: {
    label: 'Intermediate',
    ring: '#d97706',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    text: 'text-amber-700',
  },
  Master: {
    label: 'Master',
    ring: '#16a34a',
    badge: 'bg-green-100 text-green-800 border-green-300',
    text: 'text-green-700',
  },
};

const tierFor = (pct) => {
  if (pct >= 80) return 'Master';
  if (pct >= 50) return 'Intermediate';
  return 'Beginner';
};

// ── SVG Progress Ring ──
const ProgressRing = ({ percentage, size = 96, strokeWidth = 8, color = '#16a34a' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage || 0));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <span className="absolute font-bold font-playfair" style={{ color, fontSize: size * 0.2 }}>
        {clamped}%
      </span>
    </div>
  );
};

// ── Tier Badge ──
const TierBadge = ({ tier, size = 'md' }) => {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.Beginner;
  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-wider ${padding} ${config.badge}`}>
      <GraduationCap className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// ── Chapter Row (expandable) ──
const ChapterRow = ({ chapter }) => {
  const config = TIER_CONFIG[tierFor(chapter.masteryPercentage)] || TIER_CONFIG.Beginner;
  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-b-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.ring }} />
        <span className="text-sm text-neutral-700 font-medium truncate">{chapter.name}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-sm font-bold ${config.text}`}>{chapter.masteryPercentage}%</span>
        <TierBadge tier={tierFor(chapter.masteryPercentage)} size="sm" />
      </div>
    </div>
  );
};

// ── Subject Card ──
const SubjectCard = ({ subject }) => {
  const [expanded, setExpanded] = useState(false);
  const config = TIER_CONFIG[subject.tier] || TIER_CONFIG.Beginner;
  const hasChapters = subject.chapters && subject.chapters.length > 0;

  return (
    <div className="p-4 bg-white/60 border border-neutral-200 rounded-sm shadow-sm">
      <div className="flex items-center gap-4">
        <ProgressRing percentage={subject.masteryPercentage} color={config.ring} />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-neutral-900 font-playfair truncate">{subject.name}</h4>
          <div className="mt-1">
            <TierBadge tier={subject.tier} />
          </div>
          {hasChapters && (
            <p className="text-xs text-neutral-500 mt-1">
              {subject.chapters.length} chapter{subject.chapters.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {hasChapters && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
            aria-label={expanded ? `Collapse ${subject.name} chapters` : `Expand ${subject.name} chapters`}
          >
            {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && hasChapters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-1">
              {subject.chapters.map((chapter) => (
                <ChapterRow key={chapter.id || chapter.name} chapter={chapter} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Widget ──
const SubjectMasteryWidget = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchMastery = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/progress/mastery');
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch mastery levels:', err);
      setError('Could not load subject mastery levels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await API.get('/progress/mastery');
        if (!cancelled && res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch mastery levels:', err);
          setError('Could not load subject mastery levels');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const overallConfig = TIER_CONFIG[data?.overallTier] || TIER_CONFIG.Beginner;

  return (
    <VintagePaper className="w-full shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-400 pb-3 mb-4 gap-3">
        <h2 className="text-xl font-bold font-playfair text-neutral-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-700" /> Subject Mastery
        </h2>
        {!loading && !error && (
          <button
            onClick={fetchMastery}
            className="px-3 py-1 bg-gradient-to-r from-amber-700 to-amber-900 text-amber-50 text-xs font-bold rounded shadow hover:shadow-md transition-all flex items-center gap-1.5"
            aria-label="Refresh mastery levels"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-neutral-500 italic flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-800" /> Computing mastery levels...
        </div>
      ) : error ? (
        <div className="py-6 text-center">
          <p className="text-xs text-red-600 font-medium mb-3">{error}</p>
          <button
            onClick={fetchMastery}
            className="px-3 py-1.5 bg-neutral-800 text-amber-50 text-xs font-bold rounded shadow hover:bg-neutral-700 transition-all"
          >
            Retry
          </button>
        </div>
      ) : !data || data.subjects.length === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-500 italic">
          Add subjects and start studying to unlock mastery badges.
        </div>
      ) : (
        <>
          {/* Overall mastery ring */}
          <div className="flex items-center gap-5 mb-5 p-4 bg-amber-50/60 border border-amber-200/70 rounded-sm">
            <ProgressRing percentage={data.overallMastery} size={88} color={overallConfig.ring} />
            <div>
              <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Overall Mastery</p>
              <div className="mt-1">
                <TierBadge tier={data.overallTier} />
              </div>
              <p className="text-xs text-neutral-500 mt-1.5 italic">
                Blended from quiz accuracy &amp; flashcard retention
              </p>
            </div>
          </div>

          {/* Subject cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.subjects.map((subject) => (
              <SubjectCard key={subject.id || subject.name} subject={subject} />
            ))}
          </div>
        </>
      )}
    </VintagePaper>
  );
};

export default SubjectMasteryWidget;
