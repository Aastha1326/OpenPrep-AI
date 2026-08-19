import React from 'react';
import { Activity, ShieldCheck, CheckCircle2, Bug } from 'lucide-react';

const RECENT_INCUBATIONS = [
  {
    id: 'inc-1',
    bottleId: 'BOTTLE-BLOOD-9021',
    organism: 'MRSA (Gram-Positive Cocci)',
    incubationTimeHours: 14.5,
    status: 'GROWTH_DETECTED_MALDI_CONFIRMED',
    timestampAgo: '15 mins ago',
  },
  {
    id: 'inc-2',
    bottleId: 'BOTTLE-URINE-8812',
    organism: 'ESBL E. coli (Gram-Negative Rods)',
    incubationTimeHours: 18.0,
    status: 'ANTIBIOGRAM_MIC_READY',
    timestampAgo: '40 mins ago',
  },
  {
    id: 'inc-3',
    bottleId: 'BOTTLE-SPUT-0012',
    organism: 'Pseudomonas aeruginosa',
    incubationTimeHours: 24.0,
    status: 'ANTIBIOGRAM_MIC_READY',
    timestampAgo: '1 hour ago',
  },
];

export default function CultureStreamTimeline() {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" /> Automated Incubator & MALDI-TOF Stream
          </h3>
          <p className="text-slate-400 text-xs mt-1">Continuous blood culture bottle colorimetric growth monitoring, rapid laser desorption ionization, and MIC panel generation.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-emerald-300 font-semibold font-mono">
          <Bug className="w-4 h-4 text-emerald-400" /> MALDI-TOF Mass Spec Online
        </div>
      </div>

      <div className="space-y-4">
        {RECENT_INCUBATIONS.map((inc) => (
          <div
            key={inc.id}
            className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-500/10 text-emerald-400 text-[11px] font-mono px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                  {inc.status}
                </span>
                <span className="text-slate-500 text-xs font-mono">{inc.timestampAgo}</span>
              </div>
              <h4 className="text-base font-bold text-slate-100">{inc.organism}</h4>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                Bottle Ref: <span className="text-slate-200">{inc.bottleId}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-green-400 font-mono font-extrabold text-xs bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20">
                Incubation: {inc.incubationTimeHours} hrs
              </div>
              <div className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> MIC Calibrated
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
