import React, { useState } from 'react';
import { Calendar, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const generate52WeekData = () => {
  const weeks = [];
  for (let w = 0; w < 52; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const active = Math.random() > 0.25;
      const intensity = active ? Math.floor(Math.random() * 4) + 1 : 0;
      days.push({
        dayOfWeek: d,
        intensity,
        cardsReviewed: intensity * 15,
      });
    }
    weeks.push(days);
  }
  return weeks;
};

const getCellColor = (intensity) => {
  switch (intensity) {
    case 1: return 'bg-emerald-950/80 border-emerald-900';
    case 2: return 'bg-emerald-800 border-emerald-700';
    case 3: return 'bg-emerald-600 border-emerald-500';
    case 4: return 'bg-emerald-400 border-emerald-300';
    default: return 'bg-gray-850/60 border-gray-800';
  }
};

const SyllabusHeatmap = () => {
  const [weeks] = useState(generate52WeekData());
  const [selectedDay, setSelectedDay] = useState(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="w-full bg-gray-900/60 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="text-emerald-400" size={22} />
            Syllabus Mastery & Study Activity Heatmap
          </h3>
          <p className="text-sm text-gray-400">
            52-week consistency tracking across all academic modules
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
          <span>Less</span>
          <div className="w-3.5 h-3.5 rounded bg-gray-850 border border-gray-800" />
          <div className="w-3.5 h-3.5 rounded bg-emerald-950 border border-emerald-900" />
          <div className="w-3.5 h-3.5 rounded bg-emerald-800 border border-emerald-700" />
          <div className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-500" />
          <div className="w-3.5 h-3.5 rounded bg-emerald-400 border border-emerald-300" />
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex justify-between text-[11px] text-gray-500 mb-2 px-1">
          {months.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>

        <div className="inline-flex gap-1">
          {weeks.map((week, wIdx) => (
            <div key={`w-${wIdx}`} className="flex flex-col gap-1">
              {week.map((day, dIdx) => (
                <motion.div
                  key={`w-${wIdx}-d-${dIdx}`}
                  whileHover={{ scale: 1.4, zIndex: 20 }}
                  onClick={() => setSelectedDay(day)}
                  className={`w-3.5 h-3.5 rounded-sm border cursor-pointer transition-colors ${getCellColor(day.intensity)}`}
                  title={`Level ${day.intensity}: ${day.cardsReviewed} items reviewed`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {selectedDay && (
        <div className="mt-4 p-3 bg-gray-850/80 rounded-2xl border border-gray-700 flex items-center justify-between text-xs text-gray-300">
          <span>Selected Date Activity: <strong>{selectedDay.cardsReviewed} cards reviewed</strong></span>
          <span className="text-emerald-400 font-bold">Intensity Level {selectedDay.intensity}/4</span>
        </div>
      )}
    </div>
  );
};

export default SyllabusHeatmap;
