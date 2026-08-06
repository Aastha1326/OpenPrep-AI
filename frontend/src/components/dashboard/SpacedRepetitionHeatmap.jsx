import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, HelpCircle, AlertCircle, Info } from 'lucide-react';
import API from '../../services/api';

const SpacedRepetitionHeatmap = () => {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const res = await API.get('/flashcards/forecast');
        if (res.data?.success) {
          setForecast(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load review forecast:', err);
        setError('Failed to load review forecast');
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  const getHeatmapColorClass = (count) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700/50';
    if (count <= 5) return 'bg-amber-100 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50';
    if (count <= 15) return 'bg-amber-300 dark:bg-amber-800/40 text-amber-950 dark:text-amber-100 border-amber-400 dark:border-amber-700/50';
    if (count <= 30) return 'bg-amber-500 dark:bg-amber-600/60 text-white border-amber-600';
    return 'bg-amber-700 dark:bg-amber-500 text-white border-amber-800 dark:border-amber-400';
  };

  const getIntensityLabel = (count) => {
    if (count === 0) return 'No reviews';
    if (count <= 5) return 'Light workload';
    if (count <= 15) return 'Medium workload';
    if (count <= 30) return 'Heavy workload';
    return 'Critical workload';
  };

  const formatDate = (dateStr) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            ))}
          </div>
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

  // Align dates with week columns by prepending empty grid cells
  const today = new Date();
  const startDayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6 relative">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/60">
        <h3 className="text-lg font-bold font-inter text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-500" />
          30-Day Review Forecast
        </h3>
        <div className="flex items-center gap-1 text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
          <span>Less</span>
          <div className="w-3.5 h-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-sm"></div>
          <div className="w-3.5 h-3.5 bg-amber-100 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-sm"></div>
          <div className="w-3.5 h-3.5 bg-amber-300 dark:bg-amber-800/40 border border-amber-400 dark:border-amber-700/50 rounded-sm"></div>
          <div className="w-3.5 h-3.5 bg-amber-500 dark:bg-amber-600/60 border border-amber-600 rounded-sm"></div>
          <div className="w-3.5 h-3.5 bg-amber-700 dark:bg-amber-500 border border-amber-800 dark:border-amber-400 rounded-sm"></div>
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
        {weekdays.map((day) => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 relative">
        {/* Spacer cells */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`spacer-${i}`} className="aspect-square opacity-0 pointer-events-none" />
        ))}

        {/* Heatmap cells */}
        {forecast.map((day, idx) => {
          const isToday = idx === 0;
          return (
            <div
              key={day.date}
              className={`aspect-square rounded-lg border transition-all duration-200 flex items-center justify-center cursor-help relative ${getHeatmapColorClass(day.count)} ${
                isToday ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-800' : ''
              }`}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredDay({
                  date: day.date,
                  count: day.count,
                  x: rect.left + window.scrollX + rect.width / 2,
                  y: rect.top + window.scrollY - 10,
                });
              }}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <span className="text-[10px] font-semibold opacity-80">
                {new Date(day.date).getDate()}
              </span>
            </div>
          );
        })}
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
            className="fixed w-48 z-50 pointer-events-none bg-slate-950/90 text-white rounded-lg shadow-xl p-3 border border-slate-800/80 backdrop-blur-sm text-center flex flex-col gap-0.5"
          >
            <span className="text-[10px] font-semibold text-slate-400">
              {formatDate(hoveredDay.date)}
            </span>
            <span className="text-sm font-bold text-amber-400">
              {hoveredDay.count} {hoveredDay.count === 1 ? 'card' : 'cards'} due
            </span>
            <span className="text-[10px] text-slate-300 italic">
              {getIntensityLabel(hoveredDay.count)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-2 mt-4 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg text-xs text-neutral-500 dark:text-neutral-400 border border-slate-100 dark:border-slate-900/40">
        <Info className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
        <p>
          This heatmap forecasts your card review counts over the next 30 days based on your SM-2 spaced repetition progress. Keep daily counts low by reviewing cards regularly.
        </p>
      </div>
    </div>
  );
};

export default SpacedRepetitionHeatmap;
