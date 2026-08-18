import React from 'react';
import { Activity, ShieldCheck, CheckCircle2, Scan } from 'lucide-react';

const RECENT_IMAGING_LOGS = [
  {
    id: 'img-1',
    accessionNumber: 'ACC-CHEST-9021',
    modality: 'Chest CT (128-Slice)',
    aiCadAnalysis: 'Bilateral PE Detected (Saddle Thrombus)',
    status: 'PACS_ROUTED_STAT',
    timestampAgo: '3 mins ago',
  },
  {
    id: 'img-2',
    accessionNumber: 'ACC-BRAIN-8810',
    modality: 'Brain MRI (3.0T)',
    aiCadAnalysis: 'No Acute Hemorrhage / Ischemia',
    status: 'PACS_STORED',
    timestampAgo: '18 mins ago',
  },
  {
    id: 'img-3',
    accessionNumber: 'ACC-XRAY-0099',
    modality: 'Portable Chest X-Ray',
    aiCadAnalysis: 'Mild Right Basilar Atelectasis',
    status: 'PACS_STORED',
    timestampAgo: '42 mins ago',
  },
];

export default function ImagingStreamTimeline() {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" /> PACS DICOM Storage & CAD Analysis Stream
          </h3>
          <p className="text-slate-400 text-xs mt-1">Real-time C-STORE image receiving, automatic AI CAD preliminary triage, and DICOM web viewer streaming.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-blue-300 font-semibold font-mono">
          <Scan className="w-4 h-4 text-blue-400" /> C-STORE Listener Active
        </div>
      </div>

      <div className="space-y-4">
        {RECENT_IMAGING_LOGS.map((log) => (
          <div
            key={log.id}
            className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 hover:border-blue-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-500/10 text-blue-400 text-[11px] font-mono px-2 py-0.5 rounded border border-blue-500/20 font-bold">
                  {log.status}
                </span>
                <span className="text-slate-500 text-xs font-mono">{log.timestampAgo}</span>
              </div>
              <h4 className="text-base font-bold text-slate-100">{log.modality}</h4>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                CAD Finding: <span className="text-cyan-300 font-medium">{log.aiCadAnalysis}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> DICOM 3.0 Synced
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
