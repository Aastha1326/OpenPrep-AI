import React from 'react';

/**
 * Toxicology Telemetry Stream Timeline Component.
 * Audits poison control cases, toxidrome classifications, and antidote administration logs.
 */
export const ToxicologyTelemetryStreamTimeline = ({ cases }) => {
  if (!cases || cases.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center backdrop-blur-xl">
        <p className="text-slate-400 text-sm">No toxicological poison control cases logged in memory.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
      <h3 className="text-white font-extrabold text-xl mb-6 flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-purple-500 animate-ping" />
        Poison Control Toxicology Surveillance Audit Ledger
      </h3>

      <div className="space-y-4">
        {cases.map((c) => (
          <div
            key={c.caseId}
            className="relative pl-6 border-l-2 border-slate-800 hover:border-purple-500 transition-colors"
          >
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-purple-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-purple-400 font-extrabold text-sm">{c.caseId}</span>
                  <span className="text-slate-400 text-xs">Patient: {c.patientAlias}</span>
                  <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {c.toxidromeClassification}
                  </span>
                </div>
                <p className="text-slate-300 text-xs">
                  Toxin: <strong className="text-white">{c.suspectedSubstance}</strong> | Route:{' '}
                  <strong className="text-white">{c.exposureRoute}</strong> | Elapsed:{' '}
                  <strong className="text-white">{c.timeSinceExposureHours} hrs</strong>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-slate-400 text-[11px] block">Severity</span>
                  <span className="text-rose-400 font-extrabold text-xs">
                    {c.triageSeverity}
                  </span>
                </div>
                <span className="text-slate-500 text-xs">
                  {new Date(c.createdAt || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
