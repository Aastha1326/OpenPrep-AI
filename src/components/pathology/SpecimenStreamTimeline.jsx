import React from 'react';
import { Activity, ShieldCheck, CheckCircle2, TestTube2 } from 'lucide-react';

const RECENT_SPECIMENS = [
  {
    id: 'spc-1',
    specimenBarcode: 'BARCODE-ABG-9901',
    panelType: 'Arterial Blood Gas (ABG)',
    processingStage: 'ANALYZER_COMPLETE',
    turnaroundTimeMin: 4.5,
    timestampAgo: '10 mins ago',
  },
  {
    id: 'spc-2',
    specimenBarcode: 'BARCODE-CBC-8812',
    panelType: 'CBC w/ Differential',
    processingStage: 'STAINING_AUTOMATED',
    turnaroundTimeMin: 8.0,
    timestampAgo: '25 mins ago',
  },
  {
    id: 'spc-3',
    specimenBarcode: 'BARCODE-CAR-0021',
    panelType: 'Troponin I Immunoassay',
    processingStage: 'LIS_VERIFIED',
    turnaroundTimeMin: 12.0,
    timestampAgo: '50 mins ago',
  },
];

export default function SpecimenStreamTimeline() {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" /> Automated Specimen Tracking & LIS Stream
          </h3>
          <p className="text-slate-400 text-xs mt-1">Real-time specimen barcode centrifugation, automated hematology staining, and direct HL7 LIS result delivery.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-purple-300 font-semibold font-mono">
          <ShieldCheck className="w-4 h-4 text-purple-400" /> LOINC / HL7 Compliant
        </div>
      </div>

      <div className="space-y-4">
        {RECENT_SPECIMENS.map((spc) => (
          <div
            key={spc.id}
            className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 hover:border-purple-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-purple-500/10 text-purple-400 text-[11px] font-mono px-2 py-0.5 rounded border border-purple-500/20 font-bold">
                  {spc.processingStage}
                </span>
                <span className="text-slate-500 text-xs font-mono">{spc.timestampAgo}</span>
              </div>
              <h4 className="text-base font-bold text-slate-100">{spc.panelType}</h4>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                Barcode Ref: <span className="text-slate-200">{spc.specimenBarcode}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-indigo-400 font-mono font-extrabold text-xs bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
                TAT: {spc.turnaroundTimeMin} mins
              </div>
              <div className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> LIS Synced
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
