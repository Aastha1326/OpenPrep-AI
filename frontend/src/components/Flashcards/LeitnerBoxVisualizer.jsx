import React from 'react';
import { Layers, Calendar, CheckCircle2, Clock, Zap } from 'lucide-react';

const BOX_CONFIGS = [
  { id: 1, name: 'Box 1', freq: 'Daily', color: 'from-rose-500 to-pink-600', icon: Zap, border: 'border-rose-500/30' },
  { id: 2, name: 'Box 2', freq: 'Every 3 Days', color: 'from-amber-500 to-orange-600', icon: Clock, border: 'border-amber-500/30' },
  { id: 3, name: 'Box 3', freq: 'Weekly', color: 'from-yellow-500 to-amber-600', icon: Calendar, border: 'border-yellow-500/30' },
  { id: 4, name: 'Box 4', freq: 'Bi-Weekly', color: 'from-indigo-500 to-blue-600', icon: Layers, border: 'border-indigo-500/30' },
  { id: 5, name: 'Box 5', freq: 'Mastered (Monthly)', color: 'from-emerald-500 to-teal-600', icon: CheckCircle2, border: 'border-emerald-500/30' },
];

const LeitnerBoxVisualizer = ({ boxes = [] }) => {
  const boxCountMap = (boxes || []).reduce((acc, b) => {
    acc[b.id] = b.count || 0;
    return acc;
  }, {});

  const totalCards = Object.values(boxCountMap).reduce((sum, val) => sum + val, 0);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-stone-100 font-extrabold text-base font-playfair flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            5-Tier Leitner Box Visualizer
          </h3>
          <p className="text-stone-400 text-xs mt-0.5">Spaced-repetition progress breakdown across difficulty boxes</p>
        </div>
        <div className="bg-neutral-800 text-stone-300 text-xs px-3 py-1.5 rounded-xl font-mono font-bold">
          {totalCards} Total Cards
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {BOX_CONFIGS.map((config) => {
          const count = boxCountMap[config.id] || 0;
          const pct = totalCards > 0 ? Math.round((count / totalCards) * 100) : 0;
          const Icon = config.icon;

          return (
            <div
              key={config.id}
              className={`bg-neutral-950/70 border ${config.border} rounded-2xl p-4 flex flex-col justify-between hover:scale-105 transition-all shadow-lg backdrop-blur-md relative overflow-hidden group`}
            >
              <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${config.color} opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-opacity`} />

              <div className="flex items-center justify-between mb-3">
                <span className="text-stone-400 text-xs font-bold font-mono">{config.name}</span>
                <div className={`p-1.5 rounded-lg bg-gradient-to-r ${config.color} text-white shadow-sm`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="my-2">
                <div className="text-2xl font-extrabold text-stone-100 font-playfair">{count}</div>
                <div className="text-[10px] text-stone-400 font-semibold">{pct}% of deck</div>
              </div>

              <div className="mt-3 pt-2 border-t border-neutral-800/60 flex items-center justify-between">
                <span className="text-[10px] text-stone-300 font-semibold">{config.freq}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeitnerBoxVisualizer;
