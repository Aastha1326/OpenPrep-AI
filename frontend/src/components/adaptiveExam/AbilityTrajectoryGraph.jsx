import React from 'react';
import { TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

const AbilityTrajectoryGraph = ({ trajectory = [] }) => {
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-inner">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-stone-100 font-bold text-sm font-playfair flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            IRT Ability Trajectory (θ Convergence)
          </h4>
          <p className="text-stone-400 text-xs mt-0.5">Real-time candidate mastery estimation across question steps</p>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trajectory} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="step" stroke="#737373" tick={{ fontSize: 11 }} label={{ value: 'Question Step', position: 'insideBottom', offset: -5, fill: '#737373', fontSize: 10 }} />
            <YAxis domain={[-3, 3]} stroke="#737373" tick={{ fontSize: 11 }} unit="θ" />
            <ReferenceLine y={0} stroke="#525252" strokeDasharray="2 2" label={{ value: 'Baseline (0.0)', fill: '#737373', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '12px', fontSize: '12px' }}
              formatter={(val) => [`${val > 0 ? '+' : ''}${val}`, 'Ability θ']}
              labelFormatter={(step) => `Step ${step}`}
            />
            <Line type="monotone" dataKey="theta" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#818cf8' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AbilityTrajectoryGraph;
