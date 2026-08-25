import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Sun, Moon, Sunset, Sunrise } from 'lucide-react';

/**
 * Time period config for display
 */
const PERIOD_CONFIG = {
  Night: { icon: Moon, color: 'text-indigo-400', gradient: 'from-indigo-500/20 to-indigo-900/10' },
  Morning: { icon: Sunrise, color: 'text-amber-400', gradient: 'from-amber-500/20 to-amber-900/10' },
  Afternoon: { icon: Sun, color: 'text-orange-400', gradient: 'from-orange-500/20 to-orange-900/10' },
  Evening: { icon: Sunset, color: 'text-rose-400', gradient: 'from-rose-500/20 to-rose-900/10' },
};

/**
 * Intensity color scale (green = high, stone = low)
 */
const getIntensityColor = (intensity) => {
  if (intensity >= 80) return '#22c55e';
  if (intensity >= 60) return '#4ade80';
  if (intensity >= 40) return '#86efac';
  if (intensity >= 20) return '#a3a3a3';
  return '#3f3f46';
};

/**
 * ActivityHeatmapCalendar
 * Renders a 24-hour activity pattern showing peak study hours
 * and an intensity bar visualization.
 */
export default function ActivityHeatmapCalendar({ data = {} }) {
  const { pattern = [], peakHours = [] } = data;

  const periodStats = useMemo(() => {
    if (!pattern || pattern.length === 0) return {};
    const periods = { Night: 0, Morning: 0, Afternoon: 0, Evening: 0 };
    pattern.forEach((slot) => {
      periods[slot.period] = (periods[slot.period] || 0) + slot.activityCount;
    });
    return periods;
  }, [pattern]);

  const totalActivity = Object.values(periodStats).reduce((s, v) => s + v, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/15 border border-amber-500/25 rounded-xl">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-100 font-display">
              Activity Time Pattern
            </h3>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              When you study most
            </p>
          </div>
        </div>

        {peakHours.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-full">
            <Sunrise className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold font-mono text-amber-300">
              Peak: {peakHours[0]?.label || '--'}
            </span>
          </div>
        )}
      </div>

      {/* Period Summary Cards */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {Object.entries(PERIOD_CONFIG).map(([period, config]) => {
          const PeriodIcon = config.icon;
          const count = periodStats[period] || 0;
          const pct = totalActivity > 0 ? Math.round((count / totalActivity) * 100) : 0;
          return (
            <div
              key={period}
              className={`bg-gradient-to-b ${config.gradient} border border-stone-700/30 rounded-xl p-3 text-center`}
            >
              <PeriodIcon className={`w-4 h-4 mx-auto mb-1 ${config.color}`} />
              <p className="text-xs text-stone-400 font-mono">{period}</p>
              <p className="text-lg font-black font-mono text-stone-200">{pct}%</p>
            </div>
          );
        })}
      </div>

      {/* 24-Hour Heatmap Bar */}
      {pattern.length > 0 ? (
        <div>
          <p className="text-xs uppercase tracking-widest text-stone-500 font-semibold mb-3">
            Hourly Activity Intensity
          </p>
          <div className="grid grid-cols-12 gap-1">
            {pattern.map((slot) => (
              <div key={slot.hour} className="flex flex-col items-center gap-1">
                <div
                  className="w-full aspect-square rounded-md transition-all hover:scale-110 cursor-default"
                  style={{ backgroundColor: getIntensityColor(slot.intensity) }}
                  title={`${slot.label}: ${slot.activityCount} activities (${slot.intensity}%)`}
                />
                {slot.hour % 4 === 0 && (
                  <span className="text-[9px] font-mono text-stone-600">
                    {slot.label}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-1 mt-2">
            <span className="text-[9px] text-stone-600">Less</span>
            {[10, 30, 50, 70, 100].map((pct) => (
              <div
                key={pct}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: getIntensityColor(pct) }}
              />
            ))}
            <span className="text-[9px] text-stone-600">More</span>
          </div>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center">
          <div className="text-center">
            <Clock className="w-8 h-8 text-stone-700 mx-auto mb-2" />
            <p className="text-sm text-stone-600">No activity data yet.</p>
          </div>
        </div>
      )}

      {/* Peak Hours List */}
      {peakHours.length > 0 && (
        <div className="mt-4 pt-4 border-t border-stone-800">
          <p className="text-xs text-stone-500 font-mono mb-2">Top Study Hours</p>
          <div className="flex flex-wrap gap-2">
            {peakHours.map((h, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-800/60 border border-stone-700/40 rounded-lg text-xs font-mono"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: getIntensityColor(h.intensity) }}
                />
                <span className="text-stone-300 font-semibold">{h.label}</span>
                <span className="text-stone-600">({h.activityCount})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
