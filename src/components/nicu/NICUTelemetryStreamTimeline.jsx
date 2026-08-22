import React from 'react';

/**
 * NICU Telemetry Stream Timeline Component.
 * Audits infant vitals stream events, apnea alarms, and phototherapy interventions.
 */
export const NICUTelemetryStreamTimeline = ({ incubators }) => {
  if (!incubators || incubators.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center backdrop-blur-xl">
        <p className="text-slate-400 text-sm">No neonatal telemetry audit events recorded.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
      <h3 className="text-white font-extrabold text-xl mb-6 flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-cyan-500 animate-ping" />
        NICU Neonatal Telemetry & Clinical Event Audit Ledger
      </h3>

      <div className="space-y-4">
        {incubators.map((inc) => (
          <div
            key={inc.incubatorId}
            className="relative pl-6 border-l-2 border-slate-800 hover:border-cyan-500 transition-colors"
          >
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-cyan-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-cyan-400 font-extrabold text-sm">{inc.infantAlias}</span>
                  <span className="text-slate-400 text-xs">GA: {inc.gestationalAgeWeeks}w</span>
                  <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    APGAR: {inc.apgarScore1Min}/{inc.apgarScore5Min}
                  </span>
                </div>
                <p className="text-slate-300 text-xs">
                  Phototherapy:{' '}
                  <strong className={inc.phototherapyActive ? 'text-blue-400' : 'text-slate-500'}>
                    {inc.phototherapyActive ? 'ACTIVE' : 'OFF'}
                  </strong>{' '}
                  | Surfactant:{' '}
                  <strong className={inc.surfactantAdministered ? 'text-emerald-400' : 'text-slate-500'}>
                    {inc.surfactantAdministered ? 'GIVEN' : 'PENDING'}
                  </strong>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-slate-400 text-[11px] block">Alarm Status</span>
                  <span className="text-emerald-400 font-extrabold text-xs">
                    {inc.alarmStatus}
                  </span>
                </div>
                <span className="text-slate-500 text-xs">
                  {new Date(inc.createdAt || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
