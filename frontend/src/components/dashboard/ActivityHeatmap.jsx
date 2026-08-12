import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertCircle, Info } from 'lucide-react';
import API from '../../services/api';
import Skeleton from './Skeleton';

const HEATMAP_DAYS = 365;

const ActivityHeatmap = () => {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await API.get('/analytics/activity-heatmap');
        if (res.data?.success) {
          setActivity(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load activity heatmap:', err);
        setError('Failed to load activity heatmap');
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  const getHeatmapColorClass = (total) => {
    if (total === 0) return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700/50';
    if (total <= 5) return 'bg-green-200 dark:bg-green-900/40 border-green-300 dark:border-green-800/50';
    if (total <= 15) return 'bg-green-400 dark:bg-green-700/60 border-green-500 dark:border-green-600/50';
    return 'bg-green-600 dark:bg-green-500 border-green-700 dark:border-green-400';
  };

  const formatDate = (dateStr) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-1.5">
          {Array.from({ length: 53 * 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 w-3.5 rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-center text-slate-500">
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Build the 365-day window aligned to week columns (start on a Sunday).
  // Use UTC-based date math so cell keys match the API's UTC date strings
  // regardless of the viewer's timezone.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setUTCDate(startDate.getUTCDate() - (HEATMAP_DAYS - 1));
  const leadingSpacers = startDate.getUTCDay(); // 0 (Sun) to 6 (Sat)

  const activityByDate = new Map(activity.map((d) => [d.date, d]));

  const cells = [];
  for (let i = 0; i < HEATMAP_DAYS; i++) {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const day = activityByDate.get(dateStr) || {
      date: dateStr,
      questionsSolved: 0,
      flashcardsReviewed: 0,
      total: 0,
    };
    cells.push(day);
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6 relative">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/60">
        <h3 className="text-lg font-bold font-inter text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-600 dark:text-green-500" />
          Study Activity
        </h3>
        <div className="flex items-center gap-1 text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
          <span>Less</span>
          <div className="w-3.5 h-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-sm"></div>
          <div className="w-3.5 h-3.5 bg-green-200 dark:bg-green-900/40 border border-green-300 dark:border-green-800/50 rounded-sm"></div>
          <div className="w-3.5 h-3.5 bg-green-400 dark:bg-green-700/60 border border-green-500 dark:border-green-600/50 rounded-sm"></div>
          <div className="w-3.5 h-3.5 bg-green-600 dark:bg-green-500 border border-green-700 dark:border-green-400 rounded-sm"></div>
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
        {weekdays.map((day) => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-max">
          {/* Spacer cells to align the first week column */}
          {Array.from({ length: leadingSpacers }).map((_, i) => (
            <div key={`spacer-${i}`} className="h-3.5 w-3.5 opacity-0 pointer-events-none" />
          ))}

          {/* Heatmap cells */}
          {cells.map((day) => (
            <div
              key={day.date}
              className={`h-3.5 w-3.5 rounded-sm border cursor-help transition-colors duration-150 ${getHeatmapColorClass(day.total)}`}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredDay({
                  date: day.date,
                  questionsSolved: day.questionsSolved,
                  flashcardsReviewed: day.flashcardsReviewed,
                  total: day.total,
                  x: rect.left + window.scrollX + rect.width / 2,
                  y: rect.top + window.scrollY - 10,
                });
              }}
              onMouseLeave={() => setHoveredDay(null)}
            />
          ))}
        </div>
      </div>

      {/* Floating Tooltip */}
      <AnimatePresence>
        {hoveredDay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              left: `${hoveredDay.x - 100}px`, // center the 200px width tooltip
              top: `${hoveredDay.y - 120}px`, // offset above the box
              transform: 'translate(-50%, -50%)',
            }}
            className="fixed w-52 z-50 pointer-events-none bg-slate-950/90 text-white rounded-lg shadow-xl p-3 border border-slate-800/80 backdrop-blur-sm text-center flex flex-col gap-0.5"
          >
            <span className="text-[10px] font-semibold text-slate-400">
              {formatDate(hoveredDay.date)}
            </span>
            <span className="text-sm font-bold text-green-400">
              {hoveredDay.total === 0
                ? 'No activity'
                : `${hoveredDay.questionsSolved} question${hoveredDay.questionsSolved === 1 ? '' : 's'} solved, ${hoveredDay.flashcardsReviewed} flashcard deck${hoveredDay.flashcardsReviewed === 1 ? '' : 's'} reviewed`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-2 mt-4 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg text-xs text-neutral-500 dark:text-neutral-400 border border-slate-100 dark:border-slate-900/40">
        <Info className="w-4 h-4 shrink-0 text-green-500 mt-0.5" />
        <p>
          This heatmap shows your daily study activity over the past year — questions solved and flashcard decks reviewed. Keep your streak green by studying a little every day.
        </p>
      </div>
    </div>
  );
};

export default ActivityHeatmap;