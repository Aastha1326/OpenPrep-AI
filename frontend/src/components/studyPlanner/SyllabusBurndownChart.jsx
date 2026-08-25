import React from 'react';
import { TrendingDown, Calendar, AlertCircle, Zap } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const SyllabusBurndownChart = ({ burndownData = {} }) => {
  const {
    totalTasks = 0,
    completedTasks = 0,
    remainingTasks = 0,
    trailingVelocity = 1.0,
    projectedCompletionDate = 'TBD',
    isBehindSchedule = false,
    recommendedStudyHoursPerDay = 1.5,
    burndownPoints = [],
  } = burndownData;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-stone-100 font-extrabold text-base font-playfair flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-indigo-400" />
            Agile Syllabus Burn-down Chart & Velocity
          </h3>
          <p className="text-stone-400 text-xs mt-0.5">Tracking ideal remaining work vs actual completion trajectory</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-neutral-950/80 border border-neutral-800 px-3.5 py-1.5 rounded-2xl text-right">
            <div className="text-[10px] text-stone-400 font-bold uppercase">7-Day Trailing Velocity</div>
            <div className="text-sm font-black font-mono text-indigo-400 flex items-center gap-1 justify-end">
              <Zap className="w-3.5 h-3.5" />
              {trailingVelocity} tasks/day
            </div>
          </div>
        </div>
      </div>

      {isBehindSchedule && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3.5 rounded-2xl text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>Behind Schedule:</strong> Projected completion is <strong>{projectedCompletionDate}</strong>. Increase study time to <strong>{recommendedStudyHoursPerDay} hrs/day</strong> to catch up.
          </span>
        </div>
      )}

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={burndownPoints} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="day" stroke="#737373" tick={{ fontSize: 11 }} label={{ value: 'Timeline (Days)', position: 'insideBottom', offset: -5, fill: '#737373', fontSize: 10 }} />
            <YAxis stroke="#737373" tick={{ fontSize: 11 }} label={{ value: 'Remaining Tasks', angle: -90, position: 'insideLeft', fill: '#737373', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '12px', fontSize: '12px' }}
              labelFormatter={(day) => `Day ${day}`}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Line type="monotone" dataKey="idealRemaining" name="Ideal Burn-down" stroke="#737373" strokeDasharray="4 4" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="actualRemaining" name="Actual Remaining Tasks" stroke="#6366f1" strokeWidth={3} dot={{ r: 3, fill: '#818cf8' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SyllabusBurndownChart;
