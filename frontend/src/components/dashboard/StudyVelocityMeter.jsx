import React, { useState } from 'react';

export default function StudyVelocityMeter({ currentVelocity = 3.5, requiredVelocity = 5.2, remainingSyllabusHours = 240 }) {
  const [simulatedHours, setSimulatedHours] = useState(Math.round(currentVelocity));

  // Determine Pace Status Boundaries
  const paceDelta = currentVelocity - requiredVelocity;
  let status = { label: 'On Track', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
  
  if (paceDelta < -2.0) {
    status = { label: 'Critical Pace Deficit', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
  } else if (paceDelta < 0) {
    status = { label: 'Moderate Risk', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
  }

  // Calculate simulated timeline completion
  const currentDaysToFinish = Math.ceil(remainingSyllabusHours / max(currentVelocity, 0.5));
  const simulatedDaysToFinish = Math.ceil(remainingSyllabusHours / max(simulatedHours, 0.5));
  const daysSaved = currentDaysToFinish - simulatedDaysToFinish;

  function max(a, b) { return a > b ? a : b; }

  return (
    <div className="study-velocity-container p-5 bg-slate-900 border border-slate-800 rounded-xl max-w-md shadow-2xl font-sans text-white">
      {/* Velocity Status Header */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syllabus Completion Velocity</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Based on your logged tracking sessions over the last 14 days.</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.bg} ${status.color} ${status.border} whitespace-nowrap`}>
          ● {status.label}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg">
          <span className="text-[10px] text-slate-400 block">Current Velocity</span>
          <span className="text-xl font-bold font-mono text-white">{currentVelocity.toFixed(1)} <span className="text-xs font-normal text-slate-500">hrs/day</span></span>
        </div>
        <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg">
          <span className="text-[10px] text-slate-400 block">Required Velocity</span>
          <span className="text-xl font-bold font-mono text-indigo-400">{requiredVelocity.toFixed(1)} <span className="text-xs font-normal text-slate-500">hrs/day</span></span>
        </div>
      </div>

      {/* --- ADJUSTABLE STUDY PACE SIMULATOR --- */}
      <section className="p-4 bg-slate-950 border border-slate-800/60 rounded-lg">
        <h4 className="text-xs font-bold text-slate-300 mb-2">🎯 Study Pace Simulator</h4>
        <label htmlFor="paceSlider" className="sr-only">Simulated Study Hours Per Day</label>
        <input 
          type="range" 
          id="paceSlider"
          min="1" 
          max="12" 
          value={simulatedHours}
          onChange={(e) => setSimulatedHours(Number(e.target.value))}
          className="w-full accent-indigo-500 cursor-pointer mb-3"
        />

        <div className="text-[11px] text-slate-300 space-y-1">
          <p>• Testing Allocation: <span className="text-white font-bold">{simulatedHours} hours / day</span></p>
          <p>• Estimated Completion: <span className="text-indigo-400 font-semibold">{simulatedDaysToFinish} days</span></p>
          {daysSaved > 0 ? (
            <p className="text-emerald-400 font-medium">🎉 Increasing study time saves you {daysSaved} days of revision time!</p>
          ) : daysSaved < 0 ? (
            <p className="text-rose-400 font-medium">⚠️ Reducing velocity delays completion by {Math.abs(daysSaved)} days.</p>
          ) : (
            <p className="text-slate-500">Maintaining current pace vectors.</p>
          )}
        </div>
      </section>
    </div>
  );
}
