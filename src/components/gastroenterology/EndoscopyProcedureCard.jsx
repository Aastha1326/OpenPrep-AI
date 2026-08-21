import React from 'react';

/**
 * Endoscopy Procedure Card Component for Gastroenterology Station.
 * Displays procedure type, Mayo endoscopic score, bowel prep quality, findings, and GI bleeding risk.
 */
export const EndoscopyProcedureCard = ({ procedure, onAddFinding }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'IN_PROCEDURE':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse';
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'BIOPSY_PENDING':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl hover:border-emerald-500/40 transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <span className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {procedure.procedureType.replace(/_/g, ' ')}
        </span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(procedure.procedureStatus)}`}>
          {procedure.procedureStatus.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-2xl font-black">
          🔬
        </div>
        <div>
          <h4 className="text-white font-extrabold text-lg">{procedure.patientAlias}</h4>
          <p className="text-slate-400 text-xs">
            Procedure ID: {procedure.procedureId} | Sedation: {procedure.sedationAgent}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-xs block">Mayo IBD Score</span>
          <span className="text-emerald-400 font-bold text-lg">Stage {procedure.mayoEndoscopicScore}</span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-xs block">Glasgow Risk</span>
          <span className="text-amber-400 font-bold text-lg">{procedure.glasgowBlatchfordScore} pts</span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-xs block">Bowel Prep</span>
          <span className="text-cyan-300 font-bold text-xs">{procedure.bowelPreparationQuality}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
        <span className="text-slate-400 text-xs">
          Findings: {procedure.findings?.length || 0} mucosal observations
        </span>
        <button
          onClick={() => onAddFinding(procedure)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-600/20"
        >
          + Log Endoscopic Finding
        </button>
      </div>
    </div>
  );
};
