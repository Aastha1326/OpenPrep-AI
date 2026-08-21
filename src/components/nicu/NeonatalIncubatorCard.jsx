import React from 'react';

/**
 * Neonatal Incubator Card Component for NICU Station.
 * Displays infant vital telemetry, phototherapy status, FiO2 levels, and alarm badges.
 */
export const NeonatalIncubatorCard = ({ incubator, onTogglePhototherapy, onAdministerSurfactant }) => {
  const latestVital = incubator.vitalsHistory?.[incubator.vitalsHistory.length - 1] || {
    heartRateBpm: 140,
    spo2Percentage: 96,
    incubatorTemperatureCelsius: 36.8,
    fio2OxygenPercentage: 21.0,
  };

  const getAlarmBadge = (status) => {
    switch (status) {
      case 'STABLE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'BRADYCARDIA_WARNING':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'DESATURATION_CRITICAL':
      case 'APNEA_ALERT':
        return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl hover:border-cyan-500/40 transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <span className="bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {incubator.careLevel.replace(/_/g, ' ')}
        </span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getAlarmBadge(incubator.alarmStatus)}`}>
          {incubator.alarmStatus.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 text-xl font-black">
          👶
        </div>
        <div>
          <h4 className="text-white font-extrabold text-lg">{incubator.infantAlias}</h4>
          <p className="text-slate-400 text-xs">
            Incubator: {incubator.incubatorId} | GA: {incubator.gestationalAgeWeeks}w | Wt: {incubator.birthWeightGrams}g
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-xs block">Heart Rate (HR)</span>
          <span className="text-rose-400 font-bold text-lg">{latestVital.heartRateBpm} bpm</span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-xs block">SpO2 Saturation</span>
          <span className="text-emerald-400 font-bold text-lg">{latestVital.spo2Percentage}%</span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-xs block">Incubator Temp</span>
          <span className="text-amber-400 font-bold text-lg">{latestVital.incubatorTemperatureCelsius}°C</span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-xs block">FiO2 Oxygen</span>
          <span className="text-cyan-400 font-bold text-lg">{latestVital.fio2OxygenPercentage}%</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/60">
        <button
          onClick={() => onTogglePhototherapy(incubator.incubatorId, !incubator.phototherapyActive)}
          className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${
            incubator.phototherapyActive
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Phototherapy: {incubator.phototherapyActive ? 'ACTIVE 💡' : 'OFF'}
        </button>

        {!incubator.surfactantAdministered && (
          <button
            onClick={() => onAdministerSurfactant(incubator.incubatorId)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
          >
            Administer Surfactant 💉
          </button>
        )}
      </div>
    </div>
  );
};
