import React from 'react';
import { Activity, ShieldCheck, CheckCircle2, Heart } from 'lucide-react';

const RECENT_ARRHYTHMIAS = [
  {
    id: 'arr-1',
    patientBed: 'ICU Bed 03',
    rhythm: 'Acute Anterior STEMI (V1-V4)',
    hrBpm: 118,
    actionTaken: 'Cath Lab Team Paged',
    timestampAgo: 'Just now',
  },
  {
    id: 'arr-2',
    patientBed: 'Stepdown Bed 08',
    rhythm: 'Atrial Fibrillation w/ RVR',
    hrBpm: 142,
    actionTaken: 'IV Diltiazem Bolus Ordered',
    timestampAgo: '15 mins ago',
  },
  {
    id: 'arr-3',
    patientBed: 'Telemetry Bed 12',
    rhythm: 'Isolated Premature Atrial Contraction',
    hrBpm: 74,
    actionTaken: 'Monitored / No Intervention Required',
    timestampAgo: '40 mins ago',
  },
];

export default function ArrhythmiaStreamTimeline() {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-400" /> Real-time Arrhythmia & Alarm Filtering Stream
          </h3>
          <p className="text-slate-400 text-xs mt-1">Continuous ECG waveform beat segmentation, ST-segment elevation tracking, and central nursing station alarm suppression.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-red-300 font-semibold font-mono">
          <Heart className="w-4 h-4 text-red-400" /> Central Station Telemetry Linked
        </div>
      </div>

      <div className="space-y-4">
        {RECENT_ARRHYTHMIAS.map((arr) => (
          <div
            key={arr.id}
            className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 hover:border-red-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-red-500/10 text-red-400 text-[11px] font-mono px-2 py-0.5 rounded border border-red-500/20 font-bold">
                  {arr.patientBed}
                </span>
                <span className="text-slate-500 text-xs font-mono">{arr.timestampAgo}</span>
              </div>
              <h4 className="text-base font-bold text-slate-100">{arr.rhythm}</h4>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                Action: <span className="text-red-300 font-semibold">{arr.actionTaken}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-cyan-400 font-mono font-extrabold text-xs bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20">
                {arr.hrBpm} BPM
              </div>
              <div className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Logged
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
