import React from 'react';

/**
 * Toxicology Case Card Component for Poison Control Station.
 * Displays suspected toxin, toxidrome classification, antidote protocol, and serum concentration.
 */
export const ToxicologyCaseCard = ({ caseDoc, onAdministerAntidote }) => {
  const latestSerum = caseDoc.serumLevels?.[caseDoc.serumLevels.length - 1] || {
    substanceName: caseDoc.suspectedSubstance,
    concentrationMgL: 120,
    isToxicThresholdExceeded: true,
  };

  const getTriageBadge = (severity) => {
    switch (severity) {
      case 'MILD_OBSERVATION':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'MODERATE_INTERVENTION':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'CRITICAL_ICU':
        return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl hover:border-purple-500/40 transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <span className="bg-purple-500/15 border border-purple-500/40 text-purple-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Toxidrome: {caseDoc.toxidromeClassification}
        </span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getTriageBadge(caseDoc.triageSeverity)}`}>
          {caseDoc.triageSeverity.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/50 flex items-center justify-center text-purple-400 text-2xl font-black">
          🧪
        </div>
        <div>
          <h4 className="text-white font-extrabold text-lg">{caseDoc.patientAlias}</h4>
          <p className="text-slate-400 text-xs">
            Case ID: {caseDoc.caseId} | Route: {caseDoc.exposureRoute}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-xs block">Suspected Toxin</span>
          <span className="text-white font-bold text-sm">{caseDoc.suspectedSubstance}</span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-xs block">Serum Concentration</span>
          <span className="text-rose-400 font-bold text-sm">{latestSerum.concentrationMgL} mg/L</span>
        </div>
      </div>

      <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 mb-4 flex items-center justify-between">
        <div>
          <span className="text-slate-400 text-xs block">Prescribed Antidote</span>
          <span className="text-purple-300 font-bold text-sm">{caseDoc.antidotePrescribed}</span>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${caseDoc.antidoteAdministered ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
          {caseDoc.antidoteAdministered ? 'GIVEN 💉' : 'PENDING'}
        </span>
      </div>

      {!caseDoc.antidoteAdministered && (
        <button
          onClick={() => onAdministerAntidote(caseDoc.caseId)}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/20"
        >
          Administer Antidote Protocol
        </button>
      )}
    </div>
  );
};
