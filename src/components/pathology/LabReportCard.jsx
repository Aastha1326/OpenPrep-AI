import React from 'react';
import { TestTube2, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function LabReportCard({ report, onInspect }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:shadow-purple-500/10 flex flex-col justify-between group">
      <div>
        {/* Header Panel Name & Status */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-purple-300 transition">
              {report.panelName}
            </h3>
            <p className="text-xs text-slate-400 font-medium">Patient: {report.patientName}</p>
          </div>

          <span className={`text-xs px-2.5 py-1 rounded-lg font-mono font-semibold border ${
            report.labStatus === 'CRITICAL_PANEL'
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}>
            {report.labStatus}
          </span>
        </div>

        {/* Interpretation Box */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-4 font-mono">
          <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Pathology Diagnostic Analysis</div>
          <div className="text-sm font-bold text-white">
            "{report.aiInterpretation}"
          </div>
          <div className="text-xs text-purple-300 mt-2 font-semibold">
            Specimen: {report.specimenType}
          </div>
        </div>

        {/* Specs */}
        <div className="space-y-2 text-xs font-mono mb-5">
          <div className="flex justify-between text-slate-400">
            <span>Critical Flag Count:</span>
            <span className={report.criticalAbnormalitiesCount > 0 ? 'text-purple-400 font-bold' : 'text-emerald-400 font-bold'}>
              {report.criticalAbnormalitiesCount} Flagged Items
            </span>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 font-mono">LOINC Standardized Code</span>
        <button
          onClick={onInspect}
          className="bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-purple-500/30 transition flex items-center gap-1"
        >
          <span>Full Lab View</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
