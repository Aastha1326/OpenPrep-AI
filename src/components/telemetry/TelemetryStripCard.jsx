import React from 'react';
import { Heart, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

export default function TelemetryStripCard({ strip, onInspect }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-red-500/50 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:shadow-red-500/10 flex flex-col justify-between group">
      <div>
        {/* Header Title & Status */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-red-300 transition">
              {strip.stripTitle}
            </h3>
            <p className="text-xs text-slate-400 font-medium">{strip.patientBed}</p>
          </div>

          <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-xs px-2.5 py-1 rounded-lg font-mono font-semibold">
            {strip.telemetryStatus}
          </span>
        </div>

        {/* Heart Rate Box */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-4 font-mono">
          <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Measured Heart Rate</div>
          <div className="text-2xl font-black text-white">
            {strip.heartRateBPM} BPM
          </div>
          <div className="text-xs text-red-400 mt-1 font-semibold">
            Classification: {strip.rhythmClassification}
          </div>
        </div>

        {/* Intervals */}
        <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-5 bg-slate-900 p-2.5 rounded-xl border border-slate-800/60">
          <div className="text-slate-400">PR: <span className="text-white font-bold">{strip.prIntervalMs} ms</span></div>
          <div className="text-slate-400">QRS: <span className="text-cyan-400 font-bold">{strip.qrsDurationMs} ms</span></div>
          <div className="text-slate-400">QTc: <span className="text-emerald-400 font-bold">{strip.qtcIntervalMs} ms</span></div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 font-mono">AI Model Confidence: {strip.aiConfidencePercent}%</span>
        <button
          onClick={onInspect}
          className="bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-red-500/30 transition flex items-center gap-1"
        >
          <span>12-Lead Strip</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
