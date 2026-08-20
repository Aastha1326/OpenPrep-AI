import React from 'react';
import { Activity, ShieldCheck, CheckCircle2, Droplets } from 'lucide-react';

const RECENT_INFUSIONS = [
  {
    id: 'inf-1',
    medication: 'Dopamine Drip (Pump #01)',
    flowRateMlHr: 13.5,
    doseMcgKgMin: 5.0,
    status: 'INFUSING_NOMINAL',
    timestampAgo: '5 mins ago',
  },
  {
    id: 'inf-2',
    medication: 'Amoxicillin Oral Suspension',
    flowRateMlHr: 7.2,
    doseMcgKgMin: 0,
    status: 'DOSE_ADMINISTERED',
    timestampAgo: '20 mins ago',
  },
  {
    id: 'inf-3',
    medication: 'Heparin Sodium Drip (Pump #03)',
    flowRateMlHr: 30.6,
    doseMcgKgMin: 18,
    status: 'INFUSING_NOMINAL',
    timestampAgo: '45 mins ago',
  },
];

export default function InfusionStreamTimeline() {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" /> Smart IV Pump Infusion & Guardrail Telemetry
          </h3>
          <p className="text-slate-400 text-xs mt-1">Real-time smart infusion pump telemetry, soft/hard dosage limit warnings, and EHR barcode MAR verification.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-emerald-300 font-semibold font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> EHR Barcode MAR Integrated
        </div>
      </div>

      <div className="space-y-4">
        {RECENT_INFUSIONS.map((inf) => (
          <div
            key={inf.id}
            className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-500/10 text-emerald-400 text-[11px] font-mono px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                  {inf.status}
                </span>
                <span className="text-slate-500 text-xs font-mono">{inf.timestampAgo}</span>
              </div>
              <h4 className="text-base font-bold text-slate-100">{inf.medication}</h4>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                Flow Rate: <span className="text-emerald-300 font-bold">{inf.flowRateMlHr} mL/hr</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-teal-400 font-mono font-extrabold text-xs bg-teal-500/10 px-3 py-1.5 rounded-xl border border-teal-500/20">
                Target: {inf.doseMcgKgMin} mcg/kg/min
              </div>
              <div className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Locked & Infusing
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
