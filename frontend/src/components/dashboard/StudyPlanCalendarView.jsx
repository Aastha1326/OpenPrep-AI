import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../../services/api';
import { toDateOnlyString } from '../../utils/dateUtils';

const dayDiffInMs = 24 * 60 * 60 * 1000;

const getUrgencyColor = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  const diffDays = Math.round((target - today) / dayDiffInMs);

  if (diffDays <= 2) return 'bg-red-100 text-red-800 border-red-200';
  if (diffDays <= 5) return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-emerald-100 text-emerald-800 border-emerald-200';
};

export default function StudyPlanCalendarView({ activePlan, onPlanUpdate }) {
  const [currentDate, setCurrentDate] = useState(() => {
    // Start at plan's start date or today
    return activePlan?.startDate ? new Date(activePlan.startDate) : new Date();
  });
  const [viewType, setViewType] = useState('month'); // 'month' | 'week' | 'day'

  // Map tasks from dailyGoals for easy retrieval
  const tasksMap = useMemo(() => {
    const map = {};
    (activePlan?.dailyGoals || []).forEach((goal) => {
      const dateStr = toDateOnlyString(goal.date);
      if (!map[dateStr]) map[dateStr] = [];
      (goal.tasks || []).forEach((task) => {
        map[dateStr].push(task);
      });
    });
    return map;
  }, [activePlan]);

  const handleDrop = async (taskId, targetDateStr) => {
    if (!taskId || !activePlan?.id) return;
    try {
      await API.put(`/study-plans/${activePlan.id}/tasks/${taskId}/date`, {
        newDate: targetDateStr,
      });
      onPlanUpdate?.();
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  };

  // --- MONTH VIEW LOGIC ---
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Day of the week of first day (0 = Sun, ..., 6 = Sat)
    const startOffset = firstDay.getDay();

    // Total days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Prev month padding days
    const prevMonthEnd = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthEnd - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding days to fill 42 cells (6 rows * 7 days)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // --- WEEK VIEW LOGIC ---
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    // Find the Sunday of this week
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // --- NAVIGATION ---
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const newD = new Date(prev);
      if (viewType === 'month') {
        newD.setMonth(prev.getMonth() - 1);
      } else if (viewType === 'week') {
        newD.setDate(prev.getDate() - 7);
      } else {
        newD.setDate(prev.getDate() - 1);
      }
      return newD;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const newD = new Date(prev);
      if (viewType === 'month') {
        newD.setMonth(prev.getMonth() + 1);
      } else if (viewType === 'week') {
        newD.setDate(prev.getDate() + 7);
      } else {
        newD.setDate(prev.getDate() + 1);
      }
      return newD;
    });
  };

  const formattedHeaderLabel = useMemo(() => {
    if (viewType === 'month') {
      return currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    } else if (viewType === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      const startStr = start.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      const endStr = end.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startStr} – ${endStr}`;
    } else {
      return currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  }, [currentDate, viewType, weekDays]);

  const weekHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white/80 dark:bg-neutral-900 border border-[#8B4513]/20 rounded-md p-4 flex flex-col h-full select-none">
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-[#8B4513]/10 pb-4 mb-4">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 border border-[#8B4513]/30 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-[#8B4513] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-playfair font-bold text-lg text-neutral-850 dark:text-neutral-100 min-w-[140px] text-center">
            {formattedHeaderLabel}
          </span>
          <button
            onClick={handleNext}
            className="p-1.5 border border-[#8B4513]/30 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-[#8B4513] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex bg-[#ebd5b3]/40 border border-[#8B4513]/20 rounded-md p-0.5">
          {['month', 'week', 'day'].map((type) => (
            <button
              key={type}
              onClick={() => setViewType(type)}
              className={`px-3 py-1 text-xs font-bold capitalize rounded transition cursor-pointer ${
                viewType === type
                  ? 'bg-[#8B4513] text-white'
                  : 'text-[#8B4513] hover:bg-white/50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewType === 'month' && (
        <div className="flex-1 flex flex-col min-h-[450px]">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center font-bold text-xs text-[#8B4513] mb-1">
            {weekHeaders.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>
          {/* Month grid */}
          <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-1">
            {monthData.map(({ date, isCurrentMonth }, idx) => {
              const dateStr = toDateOnlyString(date);
              const dayTasks = tasksMap[dateStr] || [];
              const isToday = toDateOnlyString(new Date()) === dateStr;

              return (
                <div
                  key={idx}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const taskId = e.dataTransfer.getData('text/plain');
                    handleDrop(taskId, dateStr);
                  }}
                  className={`border border-neutral-200 dark:border-neutral-800 rounded p-1.5 min-h-[75px] flex flex-col transition ${
                    isCurrentMonth ? 'bg-white dark:bg-neutral-850' : 'bg-neutral-50/50 dark:bg-neutral-900/30'
                  } ${isToday ? 'ring-2 ring-yellow-600' : ''}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className={`text-[10px] font-bold ${
                        isCurrentMonth
                          ? 'text-neutral-700 dark:text-neutral-300'
                          : 'text-neutral-400 dark:text-neutral-600'
                      } ${isToday ? 'text-yellow-600 font-extrabold' : ''}`}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                  {/* Task list container */}
                  <div className="flex-1 overflow-y-auto space-y-1 max-h-[70px]">
                    {dayTasks.map((task) => (
                      <div
                        key={task._id || task.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', task._id || task.id);
                        }}
                        className={`text-[9px] font-bold p-1 rounded border shadow-sm truncate cursor-grab active:cursor-grabbing ${
                          task.completed
                            ? 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through dark:bg-neutral-800'
                            : getUrgencyColor(dateStr)
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewType === 'week' && (
        <div className="flex-1 grid grid-cols-7 gap-2 min-h-[450px]">
          {weekDays.map((day, idx) => {
            const dateStr = toDateOnlyString(day);
            const dayTasks = tasksMap[dateStr] || [];
            const isToday = toDateOnlyString(new Date()) === dateStr;

            return (
              <div
                key={idx}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const taskId = e.dataTransfer.getData('text/plain');
                  handleDrop(taskId, dateStr);
                }}
                className={`border border-neutral-200 dark:border-neutral-850 rounded-lg p-3 flex flex-col bg-white dark:bg-neutral-850 ${
                  isToday ? 'ring-2 ring-yellow-600' : ''
                }`}
              >
                <div className="text-center mb-3 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="text-[10px] uppercase font-bold text-neutral-500">{weekHeaders[idx]}</div>
                  <div className={`text-lg font-black ${isToday ? 'text-yellow-600' : 'text-neutral-800 dark:text-neutral-200'}`}>
                    {day.getDate()}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {dayTasks.map((task) => (
                    <div
                      key={task._id || task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', task._id || task.id);
                      }}
                      className={`text-[10px] font-bold p-2 rounded-md border shadow-sm cursor-grab active:cursor-grabbing ${
                        task.completed
                          ? 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through dark:bg-neutral-800'
                          : getUrgencyColor(dateStr)
                      }`}
                      title={task.title}
                    >
                      <div className="truncate mb-1">{task.title}</div>
                      <div className="text-[8px] opacity-70">⏱️ {task.duration || 60}m</div>
                    </div>
                  ))}
                  {dayTasks.length === 0 && (
                    <div className="text-[10px] text-neutral-400 italic text-center py-8">Free day</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DAY VIEW */}
      {viewType === 'day' && (
        <div className="flex-1 flex flex-col bg-white dark:bg-neutral-850 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 min-h-[450px]">
          <h4 className="text-xl font-bold font-playfair text-[#3E2723] dark:text-neutral-100 mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-2">
            Today's Schedule ({toDateOnlyString(currentDate)})
          </h4>
          <div className="flex-1 overflow-y-auto space-y-3">
            {(tasksMap[toDateOnlyString(currentDate)] || []).map((task) => (
              <div
                key={task._id || task.id}
                className={`p-4 rounded-xl border shadow-sm flex justify-between items-center ${
                  task.completed
                    ? 'bg-neutral-50 text-neutral-400 border-neutral-200 line-through dark:bg-neutral-900/40'
                    : 'bg-[#ebd5b3]/20 border-[#8B4513]/20 text-[#3E2723] dark:text-neutral-200'
                }`}
              >
                <div>
                  <h5 className="font-bold text-sm">{task.title}</h5>
                  <p className="text-xs opacity-75 mt-1">
                    ⏱️ {task.duration || 60} minutes recommended study time
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    task.completed
                      ? 'bg-neutral-200 text-neutral-500'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {task.completed ? 'Done' : 'Pending'}
                </span>
              </div>
            ))}
            {(tasksMap[toDateOnlyString(currentDate)] || []).length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-400 italic text-sm">
                <span>No study tasks scheduled for this day.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
