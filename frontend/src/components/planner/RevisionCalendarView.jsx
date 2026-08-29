import { useMemo } from 'react';
import RevisionSlotCard from './RevisionSlotCard';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function RevisionCalendarView({ slots = [], groupedByDate = {}, currentDate, onDateSelect }) {
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];

    // Empty cells before first day
    for (let i = 0; i < startOffset; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }

    // Actual days
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const dateKey = date.toISOString().split('T')[0];
      const daySlots = groupedByDate[dateKey] || [];
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today && !isToday;

      const completedCount = daySlots.filter((s) => s.status === 'completed').length;
      const pendingCount = daySlots.filter((s) => s.status === 'pending' || s.status === 'in_progress').length;
      const skippedCount = daySlots.filter((s) => s.status === 'skipped').length;

      // Priority-based color indicator
      const hasCritical = daySlots.some((s) => s.priority === 'critical');
      const hasHigh = daySlots.some((s) => s.priority === 'high');

      days.push({
        empty: false,
        key: dateKey,
        date,
        dateKey,
        dayOfMonth: d,
        isToday,
        isPast,
        slots: daySlots,
        slotCount: daySlots.length,
        completedCount,
        pendingCount,
        skippedCount,
        hasCritical,
        hasHigh,
      });
    }

    return days;
  }, [currentDate, groupedByDate]);

  const monthLabel = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          📅 {monthLabel}
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" /> Critical
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-400" /> High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Done
          </span>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          if (day.empty) {
            return <div key={day.key} className="h-20 bg-gray-50 dark:bg-gray-850 rounded-lg" />;
          }

          const hasSlots = day.slotCount > 0;

          return (
            <div
              key={day.key}
              onClick={() => hasSlots && onDateSelect?.(day.dateKey, day.slots)}
              className={`h-20 rounded-lg border p-1.5 transition-all ${
                day.isToday
                  ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : day.isPast
                  ? 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 opacity-60'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${
                  day.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {day.dayOfMonth}
                </span>
                {day.hasCritical && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                )}
                {day.hasHigh && !day.hasCritical && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                )}
              </div>

              {hasSlots && (
                <div className="space-y-0.5">
                  {/* Show up to 3 slot indicators */}
                  {day.slots.slice(0, 3).map((slot, idx) => (
                    <div
                      key={slot.id || idx}
                      className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] ${
                        slot.status === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                          : slot.priority === 'critical'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : slot.priority === 'high'
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span className="truncate">
                        {slot.status === 'completed' ? '✓' : ''} {slot.startTime || ''}
                      </span>
                    </div>
                  ))}
                  {day.slotCount > 3 && (
                    <div className="text-[9px] text-gray-400 text-center">
                      +{day.slotCount - 3} more
                    </div>
                  )}
                </div>
              )}

              {/* Completion progress mini bar */}
              {hasSlots && day.completedCount > 0 && (
                <div className="mt-1 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${(day.completedCount / day.slotCount) * 100}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Day detail panel showing slots for a selected date.
 */
export function DayDetailPanel({ date, slots, onClose }) {
  if (!date || !slots) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          📅 {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {slots.map((slot) => (
          <RevisionSlotCard key={slot.id} slot={slot} compact />
        ))}
      </div>

      {slots.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">
          No revision slots scheduled for this day
        </p>
      )}
    </div>
  );
}
