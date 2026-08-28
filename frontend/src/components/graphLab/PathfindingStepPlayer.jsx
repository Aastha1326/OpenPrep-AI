import React, { useState } from 'react';
import { Play, RotateCcw, CheckCircle, ArrowRight } from 'lucide-react';

const PathfindingStepPlayer = ({ nodes, edges, startNode, targetNode }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    { desc: 'Initialize Dijkstra: Set distance to Start (A) = 0, all others = ∞', active: 'A', visited: ['A'] },
    { desc: 'Inspect neighbors of A: Distance to C = 2, Distance to B = 4', active: 'C', visited: ['A', 'C'] },
    { desc: 'Relax edge C ➔ B (weight 1): New distance to B = 2 + 1 = 3 (better than 4!)', active: 'B', visited: ['A', 'C', 'B'] },
    { desc: 'Inspect neighbors of B: Distance to D = 3 + 5 = 8. Target reached!', active: 'D', visited: ['A', 'C', 'B', 'D'] },
  ];

  return (
    <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Play size={16} className="text-amber-400" />
          Dijkstra Pathfinding Step-by-Step Traversal
        </h4>
        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
          Step {currentStepIndex + 1} of {steps.length}
        </span>
      </div>

      <div className="p-3.5 rounded-xl bg-gray-900 border border-gray-850 text-xs text-gray-200 font-mono flex items-center gap-2">
        <ArrowRight size={14} className="text-amber-400 shrink-0" />
        {steps[currentStepIndex].desc}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-2">
          {['A', 'C', 'B', 'D'].map((n, i) => (
            <span
              key={n}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-mono border ${
                i <= currentStepIndex
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-gray-900 border-gray-800 text-gray-500'
              }`}
            >
              {n}
            </span>
          ))}
        </div>

        <button
          onClick={() => setCurrentStepIndex((prev) => (prev + 1) % steps.length)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs rounded-xl shadow transition-all"
        >
          {currentStepIndex === steps.length - 1 ? 'Restart Trace' : 'Step Next ➔'}
        </button>
      </div>
    </div>
  );
};

export default PathfindingStepPlayer;
