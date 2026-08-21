import React from 'react';

/**
 * Blood Unit Card Component for Hematology Transfusion Hub.
 * Displays donor blood group, unit volume, expiration telemetry, and crossmatch state.
 */
export const BloodUnitCard = ({ unit, onCrossmatchSelect }) => {
  const isExpired = new Date(unit.expirationDate) < new Date();
  const getBadgeColor = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'CROSSMATCHED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'TRANSFUSED':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40';
      default:
        return 'bg-slate-700/50 text-slate-400 border-slate-600';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl hover:border-red-500/40 transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <span className="bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {unit.componentType}
        </span>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full border ${getBadgeColor(
            unit.status
          )}`}
        >
          {unit.status}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400 text-2xl font-black">
          {unit.bloodGroup}
        </div>
        <div>
          <h4 className="text-white font-extrabold text-lg">Unit ID: {unit.unitId}</h4>
          <p className="text-slate-400 text-xs">Donor ID: {unit.donorId}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-xs block">Volume (mL)</span>
          <span className="text-white font-bold text-base">{unit.volumeMl} mL</span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-xs block">Storage Temp</span>
          <span className="text-emerald-400 font-bold text-base">
            {unit.storageTemperatureCelsius}°C
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
        <span className="text-slate-400 text-xs">
          Expires: {new Date(unit.expirationDate).toLocaleDateString()}
        </span>
        {unit.status === 'AVAILABLE' && !isExpired && (
          <button
            onClick={() => onCrossmatchSelect(unit)}
            className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-red-600/20"
          >
            Select for Crossmatch
          </button>
        )}
      </div>
    </div>
  );
};
