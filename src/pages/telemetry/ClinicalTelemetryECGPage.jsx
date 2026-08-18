import React, { useState } from 'react';
import { Heart, Activity, ShieldCheck, Download, Search, Sparkles, CheckCircle2, Clock, AlertTriangle, Cpu, Radio, Zap } from 'lucide-react';
import TelemetryStripCard from '../../components/telemetry/TelemetryStripCard';
import ArrhythmiaStreamTimeline from '../../components/telemetry/ArrhythmiaStreamTimeline';

const TELEMETRY_STRIPS = [
  {
    id: 'tel-501',
    stripTitle: '12-Lead ECG - Acute Anterior Wall ST-Elevation (STEMI)',
    patientBed: 'ICU Bed 03 - Eleanor Vance',
    heartRateBPM: 118,
    qtcIntervalMs: 440,
    prIntervalMs: 160,
    qrsDurationMs: 110,
    rhythmClassification: 'ST-Elevation Myocardial Infarction (STEMI)',
    leadPlacement: 'Standard 12-Lead (V1-V6, I, II, III, aVR, aVL, aVF)',
    aiConfidencePercent: 99.1,
    telemetryStatus: 'CRITICAL_ARRHYTHMIA',
  },
  {
    id: 'tel-502',
    stripTitle: 'Continuous Bedside Monitoring - Atrial Fibrillation w/ RVR',
    patientBed: 'Stepdown Bed 08 - Julian Thorne',
    heartRateBPM: 142,
    qtcIntervalMs: 410,
    prIntervalMs: 0,
    qrsDurationMs: 88,
    rhythmClassification: 'Atrial Fibrillation with Rapid Ventricular Response',
    leadPlacement: 'Lead II Telemetry Patch',
    aiConfidencePercent: 97.4,
    telemetryStatus: 'HIGH_PRIORITY_ALERT',
  },
  {
    id: 'tel-503',
    stripTitle: 'Post-Op Monitoring - Normal Sinus Rhythm w/ Occasional PACs',
    patientBed: 'Telemetry Unit Bed 12 - Marcus Sterling',
    heartRateBPM: 74,
    qtcIntervalMs: 420,
    prIntervalMs: 154,
    qrsDurationMs: 92,
    rhythmClassification: 'Normal Sinus Rhythm',
    leadPlacement: '5-Lead ECG Monitor',
    aiConfidencePercent: 99.8,
    telemetryStatus: 'NOMINAL',
  },
];

export default function ClinicalTelemetryECGPage() {
  const [strips, setStrips] = useState(TELEMETRY_STRIPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('telemetry-strips');
  const [selectedStripModal, setSelectedStripModal] = useState(null);

  const criticalCount = strips.filter(s => s.telemetryStatus === 'CRITICAL_ARRHYTHMIA').length;

  const filteredStrips = strips.filter(s =>
    s.stripTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.patientBed.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rhythmClassification.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Header Banner */}
      <header className="max-w-7xl mx-auto mb-8 bg-gradient-to-r from-red-950 via-slate-900 to-rose-950 border border-red-500/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-red-500/20 text-red-300 text-xs px-3 py-1 rounded-full font-semibold border border-red-500/30 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" /> OpenPrep-AI Telemetry Engine
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> AHA 12-Lead Diagnostic Standard Verified
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-red-200 bg-clip-text text-transparent">
              Clinical Telemetry & 12-Lead ECG Analysis Suite
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Real-time multi-lead arrhythmia detection, QTc/PR interval automated measurements, STEMI elevation pattern recognition, and telemetry alarm safety filters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-red-600/30 transition flex items-center gap-2 border border-red-400/20 text-sm">
              <Activity className="w-4 h-4" /> Capture 12-Lead ECG Strip
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto space-y-6">
        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Active STEMI / Critical Alerts</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{criticalCount} Active Alarm</div>
            <div className="text-red-400 text-xs mt-2 flex items-center gap-1 font-medium">
              <Zap className="w-3.5 h-3.5 text-red-400" /> Cath Lab Activation Notification Sent
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>ECG Model Accuracy</span>
              <Cpu className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">98.9% Sensitivity</div>
            <div className="text-rose-400 text-xs mt-2 font-medium">
              300k Waveform Dataset Calibrated
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Continuous Telemetry Feed</span>
              <Radio className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">500 Hz Sampling</div>
            <div className="text-cyan-400 text-xs mt-2 font-medium">
              Zero-Packet-Loss Wireless Stream
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('telemetry-strips')}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
                activeTab === 'telemetry-strips'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Heart className="w-4 h-4" /> Active ECG Waveforms
            </button>
            <button
              onClick={() => setActiveTab('arrhythmia-stream')}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
                activeTab === 'arrhythmia-stream'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4" /> Live Arrhythmia Stream
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search rhythm or bed..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-red-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Tab Body */}
        {activeTab === 'arrhythmia-stream' ? (
          <ArrhythmiaStreamTimeline />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredStrips.map((strip) => (
              <TelemetryStripCard
                key={strip.id}
                strip={strip}
                onInspect={() => setSelectedStripModal(strip)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal View */}
      {selectedStripModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedStripModal(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white text-xl font-bold"
            >
              ×
            </button>

            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedStripModal.stripTitle}</h3>
                <div className="text-xs text-slate-400 font-mono">{selectedStripModal.patientBed}</div>
              </div>
              <span className="bg-red-500/20 text-red-400 px-2.5 py-1 rounded font-mono text-xs font-bold border border-red-500/30">
                {selectedStripModal.telemetryStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Heart Rate</span>
                <span className="text-red-400 font-bold text-sm">{selectedStripModal.heartRateBPM} BPM</span>
              </div>
              <div>
                <span className="text-slate-500 block">QTc Interval</span>
                <span className="text-white font-bold text-sm">{selectedStripModal.qtcIntervalMs} ms</span>
              </div>
              <div>
                <span className="text-slate-500 block">PR Interval</span>
                <span className="text-cyan-400 font-bold text-sm">{selectedStripModal.prIntervalMs} ms</span>
              </div>
              <div>
                <span className="text-slate-500 block">QRS Duration</span>
                <span className="text-emerald-400 font-bold text-sm">{selectedStripModal.qrsDurationMs} ms</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-800/80">
                <span className="text-slate-500 block">AI Rhythm Diagnosis</span>
                <span className="text-red-300 font-bold text-xs">{selectedStripModal.rhythmClassification}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedStripModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition"
              >
                Close ECG View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
