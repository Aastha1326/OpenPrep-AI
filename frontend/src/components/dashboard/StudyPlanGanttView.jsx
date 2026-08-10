import { useMemo, useState } from 'react';
import API from '../../services/api';
import { toDateOnlyString } from '../../utils/dateUtils';

const dayDiffInMs = 24 * 60 * 60 * 1000;

const getUrgencyColor = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  const diffDays = Math.round((target - today) / dayDiffInMs);

  if (diffDays <= 2) return 'bg-red-500';
  if (diffDays <= 5) return 'bg-yellow-500';
  return 'bg-emerald-500';
};

const StudyPlanGanttView = ({ activePlan, onPlanUpdate }) => {
  const [dragTaskId, setDragTaskId] = useState(null);

  const { days, rows } = useMemo(() => {
    if (!activePlan?.startDate || !activePlan?.endDate) return { days: [], rows: [] };

    const start = new Date(activePlan.startDate);
    const end = new Date(activePlan.endDate);
    const dayList = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dayList.push(toDateOnlyString(new Date(d)));
    }

    const rowList = [];
    (activePlan.dailyGoals || []).forEach((goal) => {
      const dateStr = toDateOnlyString(goal.date);
      (goal.tasks || []).forEach((task) => {
        rowList.push({
          id: task._id || task.id,
          title: task.title || task.topic?.name || 'Task',
          date: dateStr,
          completed: !!task.completed,
        });
      });
    });

    return { days: dayList, rows: rowList };
  }, [activePlan]);

  const handleDrop = async (e, targetDate) => {
    e.preventDefault();
    if (!dragTaskId || !activePlan?.id) return;

    try {
      await API.put(`/study-plans/${activePlan.id}/tasks/${dragTaskId}/date`, {
        newDate: targetDate,
      });
      onPlanUpdate?.();
    } catch (err) {
      console.error('Failed to move task:', err);
    } finally {
      setDragTaskId(null);
    }
  };

  if (days.length === 0) {
    return <p className="text-sm text-neutral-500 italic py-6 text-center">No active plan to display.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Timeline header */}
        <div className="flex border-b border-[#8B4513]/20 mb-2">
          <div className="w-40 shrink-0 font-semibold text-xs text-[#8B4513] py-2">Task</div>
          {days.map((day) => (
            <div
              key={day}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, day)}
              className="flex-1 min-w-[36px] text-center text-[10px] text-neutral-500 py-2 border-l border-[#8B4513]/10"
            >
              {day.slice(5)}
            </div>
          ))}
        </div>

        {/* Rows */}
        {rows.map((row) => {
          const colIndex = days.indexOf(row.date);
          return (
            <div key={row.id} className="flex items-center py-1.5">
              <div className="w-40 shrink-0 text-xs text-neutral-700 truncate pr-2">{row.title}</div>
              <div className="flex flex-1">
                {days.map((day, idx) => (
                  <div key={day} className="flex-1 min-w-[36px] border-l border-[#8B4513]/5 h-6 relative">
                    {idx === colIndex && (
                      <div
                        draggable
                        onDragStart={() => setDragTaskId(row.id)}
                        title={`${row.title} — ${row.date}`}
                        className={`absolute inset-y-0 left-0 right-0 mx-0.5 rounded cursor-grab active:cursor-grabbing ${
                          row.completed ? 'bg-neutral-400' : getUrgencyColor(row.date)
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudyPlanGanttView;