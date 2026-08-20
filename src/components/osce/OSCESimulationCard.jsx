import React from 'react';
import { Award, ArrowRight, ShieldCheck, Video, CheckCircle2 } from 'lucide-react';

export default function OSCESimulationCard({ scenario, onInspect }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:shadow-teal-500/10 flex flex-col justify-between group">
      <div>
        {/* Header Scenario Title & Status */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-teal-300 transition">
              {scenario.scenarioTitle}
            </h3>
            <p className="text-xs text-slate-400 font-medium">Learner: {scenario.learnerName}</p>
          </div>

          <span className="bg-teal-500/10 text-teal-400 border border-teal-500/30 text-xs px-2.5 py-1 rounded-lg font-mono font-semibold">
            {scenario.simulationStatus}
          </span>
        </div>

        {/* Rubric Score Box */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-4 font-mono">
          <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Overall OSCE Rubric Score</div>
          <div className="text-2xl font-black text-white">
            {scenario.overallRubricScorePercent}%
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Domain: {scenario.clinicalDomain}
          </div>
        </div>

        {/* AI Debrief Summary */}
        <div className="p-3 bg-slate-900 border border-slate-800/60 rounded-xl text-xs font-mono mb-5">
          <span className="text-slate-500 block mb-1">AI Debrief Assessment:</span>
          <span className="text-cyan-300 font-medium">"{scenario.debriefSummary}"</span>
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 font-mono">INACSL Simulation Standard</span>
        <button
          onClick={onInspect}
          className="bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-teal-500/30 transition flex items-center gap-1"
        >
          <span>Video Debrief</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
