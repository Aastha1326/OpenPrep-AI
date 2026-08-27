import React from 'react';
import { Layers, Sparkles, ArrowRight } from 'lucide-react';

const SpacedRepetitionScheduler = ({ dueCount = 24, estimatedMinutes = 15, onStartReview }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-gray-900 to-gray-900 p-6 rounded-3xl border border-indigo-500/20 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers size={26} />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-lg">Spaced Review Queue</h4>
            <p className="text-xs text-gray-400">Optimized via Ebbinghaus retention timing</p>
          </div>
        </div>

        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
          Due Today
        </span>
      </div>

      <div className="my-5 p-4 rounded-2xl bg-gray-850/80 border border-gray-800 flex items-center justify-around text-center">
        <div>
          <div className="text-2xl font-black text-white">{dueCount}</div>
          <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Cards Due</div>
        </div>
        <div className="h-8 w-px bg-gray-700" />
        <div>
          <div className="text-2xl font-black text-emerald-400">~{estimatedMinutes}m</div>
          <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Est. Duration</div>
        </div>
        <div className="h-8 w-px bg-gray-700" />
        <div>
          <div className="text-2xl font-black text-yellow-400">+120</div>
          <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">XP Available</div>
        </div>
      </div>

      <button
        onClick={onStartReview}
        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
      >
        <Sparkles size={18} />
        Start Spaced Review Session
        <ArrowRight size={18} />
      </button>
    </div>
  );
};

export default SpacedRepetitionScheduler;
