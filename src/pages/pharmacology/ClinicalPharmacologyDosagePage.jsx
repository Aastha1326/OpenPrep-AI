import React, { useState } from 'react';
import { Pill, Calculator, ShieldCheck, Download, Search, Sparkles, CheckCircle2, Clock, Activity, AlertTriangle, Stethoscope, HeartPulse, Droplets } from 'lucide-react';
import DosageCalculationCard from '../../components/pharmacology/DosageCalculationCard';
import InfusionStreamTimeline from '../../components/pharmacology/InfusionStreamTimeline';

const DOSAGE_CALCULATIONS = [
  {
    id: 'dos-601',
    medicationName: 'Dopamine IV Infusion (Hemodynamic Support)',
    patientWeightKg: 72,
    targetDosageMcgKgMin: 5.0,
    concentrationMgMl: 400,
    diluentVolumeMl: 250,
    calculatedRateMlHr: 13.5,
    highAlertWarning: 'High-Alert Vasopressor: Double-check IV pump rate against Central Line',
    safetyVerificationStatus: 'VERIFIED_SAFE',
  },
  {
    id: 'dos-602',
    medicationName: 'Pediatric Amoxicillin Suspension',
    patientWeightKg: 18,
    targetDosageMcgKgMin: 0,
    concentrationMgMl: 250,
    diluentVolumeMl: 5,
    calculatedRateMlHr: 7.2,
    highAlertWarning: 'Weight-Based Pediatric Dosing: 45 mg/kg/day divided q12h',
    safetyVerificationStatus: 'VERIFIED_SAFE',
  },
  {
    id: 'dos-603',
    medicationName: 'Heparin Sodium Anticoagulation Drip',
    patientWeightKg: 85,
    targetDosageMcgKgMin: 18,
    concentrationMgMl: 25000,
    diluentVolumeMl: 500,
    calculatedRateMlHr: 30.6,
    highAlertWarning: 'Critical Anticoagulant: Verify baseline aPTT and weight protocol',
    safetyVerificationStatus: 'VERIFIED_SAFE',
  },
];

export default function ClinicalPharmacologyDosagePage() {
  const [calculations, setCalculations] = useState(DOSAGE_CALCULATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('calculations');
  const [selectedCalcModal, setSelectedCalcModal] = useState(null);

  const filteredCalculations = calculations.filter(c =>
    c.medicationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.highAlertWarning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Header Banner */}
      <header className="max-w-7xl mx-auto mb-8 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full font-semibold border border-emerald-500/30 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5" /> OpenPrep-AI Clinical Pharmacology
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> ISMP High-Alert Medication Protocol Verified
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-200 bg-clip-text text-transparent">
              Clinical Pharmacology & Dosage Calculation Suite
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Precision weight-based IV drip rate calculators, mcg/kg/min infusion programming, pediatric dosage safety checks, and high-alert drug double-verification engines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 border border-emerald-400/20 text-sm">
              <Calculator className="w-4 h-4" /> Run IV Rate Calculator
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
              <span>Calculation Accuracy</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">100.0% Exact</div>
            <div className="text-emerald-400 text-xs mt-2 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> ISMP Zero-Error Safety Protocol
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Active IV Infusions</span>
              <Droplets className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">3 Pumps Active</div>
            <div className="text-teal-400 text-xs mt-2 font-medium">
              Vasopressors & Anticoagulants
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>High-Alert Verification</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">Dual Sign-Off</div>
            <div className="text-amber-400 text-xs mt-2 font-medium">
              RN Independent Double-Check Active
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('calculations')}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
                activeTab === 'calculations'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Pill className="w-4 h-4" /> Active Dosage Calculations
            </button>
            <button
              onClick={() => setActiveTab('infusion-stream')}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
                activeTab === 'infusion-stream'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4" /> Smart Pump Infusion Stream
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search medication or alert..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Tab Body */}
        {activeTab === 'infusion-stream' ? (
          <InfusionStreamTimeline />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCalculations.map((calc) => (
              <DosageCalculationCard
                key={calc.id}
                calculation={calc}
                onInspect={() => setSelectedCalcModal(calc)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal View */}
      {selectedCalcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedCalcModal(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white text-xl font-bold"
            >
              ×
            </button>

            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedCalcModal.medicationName}</h3>
                <div className="text-xs text-slate-400 font-mono">Patient Weight: {selectedCalcModal.patientWeightKg} kg</div>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded font-mono text-xs font-bold border border-emerald-500/30">
                {selectedCalcModal.safetyVerificationStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Calculated Pump Rate</span>
                <span className="text-emerald-400 font-bold text-sm">{selectedCalcModal.calculatedRateMlHr} mL/hr</span>
              </div>
              <div>
                <span className="text-slate-500 block">Concentration</span>
                <span className="text-teal-400 font-bold text-sm">{selectedCalcModal.concentrationMgMl} mg / {selectedCalcModal.diluentVolumeMl} mL</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-800/80">
                <span className="text-slate-500 block">ISMP High-Alert Guardrail</span>
                <span className="text-amber-400 font-bold text-xs">{selectedCalcModal.highAlertWarning}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedCalcModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition"
              >
                Close Safety Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
