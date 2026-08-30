import React from 'react';

/**
 * Rheumatology Case Card Component for Immunology Station.
 * Displays autoimmune diagnosis, DAS28 score, joint counts, ESR/CRP, and biologic DMARD status.
 */
export const RheumatologyCaseCard = ({ caseDoc, onToggleBiologic }) => {
  const latestSerology = caseDoc.serologyHistory?.[caseDoc.serologyHistory.length - 1] || {
    anaTiterRatio: '1:320',
    anaPattern: 'SPECKLED',
    esrMmHr: 42,
    crpMgL: 18.5,
  };

  const getDiseaseBadge = (state) => {
    switch (state) {
      case 'REMISSION':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'LOW_ACTIVITY':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'MODERATE_ACTIVITY':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'HIGH_FLARE_STATE':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl hover:border-teal-500/40 transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <span className="bg-teal-500/15 border border-teal-500/40 text-teal-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {caseDoc.primaryAutoimmuneDiagnosis.replace(/_/g, ' ')}
        </span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getDiseaseBadge(caseDoc.diseaseActivityState)}`}>
          {caseDoc.diseaseActivityState.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-teal-600/20 border border-teal-500/50 flex items-center justify-center text-teal-400 text-2xl font-black">
          🦴
        </div>
        <div>
          <h4 className="text-white font-extrabold text-lg">{caseDoc.patientAlias}</h4>
          <p className="text-slate-400 text-xs">
            Case ID: {caseDoc.caseId} | ANA: {latestSerology.anaTiterRatio} ({latestSerology.anaPattern})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-xs block">DAS28 Score</span>
          <span className="text-teal-300 font-bold text-lg">{caseDoc.das28Score}</span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-xs block">Joints (T/S)</span>
          <span className="text-amber-400 font-bold text-lg">{caseDoc.tenderJointCount}/{caseDoc.swollenJointCount}</span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-xs block">CRP / ESR</span>
          <span className="text-rose-400 font-bold text-sm">{latestSerology.crpMgL} mg/L</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
        <div>
          <span className="text-slate-400 text-xs block">Biologic Therapy</span>
          <span className="text-white font-bold text-xs">{caseDoc.biologicTherapy}</span>
        </div>
        <button
          onClick={() => onToggleBiologic(caseDoc.caseId, caseDoc.biologicTherapy, !caseDoc.biologicActive)}
          className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${
            caseDoc.biologicActive
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Biologic: {caseDoc.biologicActive ? 'ACTIVE INFUSION 💉' : 'OFF'}
        </button>
      </div>
    </div>
  );
};
