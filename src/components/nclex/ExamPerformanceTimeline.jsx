import React from 'react';
import { Activity, Brain, CheckCircle2, ShieldCheck } from 'lucide-react';

const RECENT_IRT_LOGS = [
  {
    id: 'irt-1',
    itemType: 'NGN Bowtie Matrix (Pharmacology)',
    difficultyLevel: '+2.10 (High Discrimination)',
    userResponseCorrect: true,
    newThetaEstimate: '+1.85',
    timestampAgo: '12 mins ago',
  },
  {
    id: 'irt-2',
    itemType: 'Select All That Apply (SATA) - Infection Control',
    difficultyLevel: '+1.40 (Medium-Hard)',
    userResponseCorrect: true,
    newThetaEstimate: '+1.70',
    timestampAgo: '28 mins ago',
  },
  {
    id: 'irt-3',
    itemType: 'Highlight Clinical Case Study - Pediatric Airway',
    difficultyLevel: '+2.50 (Max Difficulty)',
    userResponseCorrect: false,
    newThetaEstimate: '+1.62',
    timestampAgo: '45 mins ago',
  },
];

export default function ExamPerformanceTimeline() {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" /> Item-Response Theory (IRT) Calibration Stream
          </h3>
          <p className="text-slate-400 text-xs mt-1">Real-time item difficulty adjustment, candidate ability estimation (θ), and computer adaptive test stopping rules.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-indigo-300 font-semibold font-mono">
          <Brain className="w-4 h-4 text-indigo-400" /> 3-Parameter IRT Engine Active
        </div>
      </div>

      <div className="space-y-4">
        {RECENT_IRT_LOGS.map((log) => (
          <div
            key={log.id}
            className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-indigo-500/10 text-indigo-400 text-[11px] font-mono px-2 py-0.5 rounded border border-indigo-500/20 font-bold">
                  {log.difficultyLevel}
                </span>
                <span className="text-slate-500 text-xs font-mono">{log.timestampAgo}</span>
              </div>
              <h4 className="text-base font-bold text-slate-100">{log.itemType}</h4>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                Outcome: <span className={log.userResponseCorrect ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {log.userResponseCorrect ? 'Correct (+Theta Delta)' : 'Incorrect (-Theta Delta)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-indigo-400 font-mono font-extrabold text-sm bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">
                New θ: {log.newThetaEstimate}
              </div>
              <div className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Calibrated
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
