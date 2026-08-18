import React from 'react';
import { Pill, ArrowRight, ShieldCheck, Droplets, AlertTriangle } from 'lucide-react';

export default function DosageCalculationCard({ calculation, onInspect }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:shadow-emerald-500/10 flex flex-col justify-between group">
      <div>
        {/* Header Medication & Verification */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition">
              {calculation.medicationName}
            </h3>
            <p className="text-xs text-slate-400 font-medium">Patient Weight: {calculation.patientWeightKg} kg</p>
          </div>

          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-lg font-mono font-semibold">
            {calculation.safetyVerificationStatus}
          </span>
        </div>

        {/* Pump Rate Box */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-4 font-mono">
          <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Calculated IV Pump Infusion Rate</div>
          <div className="text-2xl font-black text-white">
            {calculation.calculatedRateMlHr} mL/hr
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-semibold">
            Concentration: {calculation.concentrationMgMl} mg in {calculation.diluentVolumeMl} mL
          </div>
        </div>

        {/* Safety Warning */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-mono mb-5 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span className="text-amber-300 font-medium">{calculation.highAlertWarning}</span>
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 font-mono">ISMP Dose Error Reduction System</span>
        <button
          onClick={onInspect}
          className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-emerald-500/30 transition flex items-center gap-1"
        >
          <span>Dose Verification</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
