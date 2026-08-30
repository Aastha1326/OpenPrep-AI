import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Brain, AlertTriangle, ShieldCheck } from 'lucide-react';

const defaultSubjects = [
  { name: 'Computer Networks', stability: 8, color: '#10B981' },
  { name: 'Algorithms & Complexity', stability: 4, color: '#EF4444' },
  { name: 'Database Systems', stability: 12, color: '#3B82F6' },
];

const generateMultiSubjectCurve = (subjects) => {
  const data = [];
  for (let day = 0; day <= 14; day++) {
    const entry = { day: `Day ${day}` };
    subjects.forEach((sub) => {
      const r = Math.exp(-day / sub.stability) * 100;
      entry[sub.name] = parseFloat(r.toFixed(1));
    });
    data.push(entry);
  }
  return data;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 p-4 rounded-2xl shadow-2xl space-y-2">
        <p className="text-gray-300 font-extrabold text-sm border-b border-gray-800 pb-1">{label}</p>
        {payload.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-4 text-xs font-semibold">
            <span style={{ color: item.color }}>{item.name}:</span>
            <span className="text-white font-bold">{item.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const MemoryDecayCurve = () => {
  const [subjects] = useState(defaultSubjects);
  const data = generateMultiSubjectCurve(subjects);

  return (
    <div className="w-full bg-gray-900/60 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="text-emerald-400" size={24} />
            Ebbinghaus Memory Retention Decay Curve
          </h3>
          <p className="text-sm text-gray-400">
            Mathematical projection ($R = e^{-t/S}$) showing knowledge decay over a 14-day horizon
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <ShieldCheck size={16} /> Target &gt;80%
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
            <AlertTriangle size={16} /> Critical &lt;40%
          </div>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={[0, 100]} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '15px' }} />
            <ReferenceLine y={80} stroke="#10B981" strokeDasharray="4 4" label={{ value: 'Safe Zone (80%)', fill: '#10B981', position: 'insideTopLeft', fontSize: 11 }} />
            <ReferenceLine y={40} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Review Needed (40%)', fill: '#EF4444', position: 'insideBottomLeft', fontSize: 11 }} />

            {subjects.map((sub) => (
              <Line
                key={sub.name}
                type="monotone"
                dataKey={sub.name}
                stroke={sub.color}
                strokeWidth={3}
                dot={{ fill: sub.color, r: 3 }}
                activeDot={{ r: 7 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MemoryDecayCurve;
