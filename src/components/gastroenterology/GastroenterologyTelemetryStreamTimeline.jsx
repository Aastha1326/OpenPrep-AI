import React from 'react';

/**
 * Gastroenterology Telemetry Stream Timeline Component.
 * Audits endoscopic procedures, Mayo score updates, polyp resections, and biopsy path logs.
 */
export const GastroenterologyTelemetryStreamTimeline = ({ procedures }) => {
  if (!procedures || procedures.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center backdrop-blur-xl">
        <p className="text-slate-400 text-sm">No endoscopy GI procedures logged in memory.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
      <h3 className="text-white font-extrabold text-xl mb-6 flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
        Endoscopy & Gastroenterology Procedure Audit Ledger
      </h3>

      <div className="space-y-4">
        {procedures.map((p) => (
          <div
            key={p.procedureId}
            className="relative pl-6 border-l-2 border-slate-800 hover:border-emerald-500 transition-colors"
          >
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-emerald-400 font-extrabold text-sm">{p.procedureId}</span>
                  <span className="text-slate-400 text-xs">Patient: {p.patientAlias}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {p.procedureType}
                  </span>
                </div>
                <p className="text-slate-300 text-xs">
                  Prep: <strong className="text-white">{p.bowelPreparationQuality}</strong> | Mayo Score:{' '}
                  <strong className="text-white">Stage {p.mayoEndoscopicScore}</strong> | Glasgow Risk:{' '}
                  <strong className="text-white">{p.glasgowBlatchfordScore} pts</strong>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-slate-400 text-[11px] block">Status</span>
                  <span className="text-amber-400 font-extrabold text-xs">
                    {p.procedureStatus}
                  </span>
                </div>
                <span className="text-slate-500 text-xs">
                  {new Date(p.createdAt || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
