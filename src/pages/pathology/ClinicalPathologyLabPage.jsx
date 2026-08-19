import React, { useState } from 'react';
import { TestTube2, Microscope, ShieldCheck, Download, Search, Sparkles, CheckCircle2, Clock, Activity, AlertTriangle, FileText, BarChart3, Binary } from 'lucide-react';
import LabReportCard from '../../components/pathology/LabReportCard';
import SpecimenStreamTimeline from '../../components/pathology/SpecimenStreamTimeline';

const LAB_REPORTS = [
  {
    id: 'lab-701',
    panelName: 'Comprehensive Metabolic Panel (CMP) + ABG',
    patientName: 'Eleanor Vance',
    specimenType: 'Arterial Blood Gas & Venous Serum',
    criticalAbnormalitiesCount: 2,
    pHLevel: 7.28,
    pco2MmHg: 52,
    hco3MeqL: 24,
    potassiumMeqL: 5.8,
    aiInterpretation: 'Decompensated Respiratory Acidosis with Hyperkalemia. Immediate ABG reassessment recommended.',
    labStatus: 'CRITICAL_PANEL',
  },
  {
    id: 'lab-702',
    panelName: 'Complete Blood Count (CBC) w/ Differential',
    patientName: 'Julian Thorne',
    specimenType: 'Whole Blood (EDTA)',
    criticalAbnormalitiesCount: 1,
    wbcCountK: 18.5,
    hemoglobinGdl: 14.2,
    plateletK: 280,
    aiInterpretation: 'Leukocytosis with Left Shift (Neutrophilia 88%). Supports acute inflammatory process.',
    labStatus: 'ABNORMAL',
  },
  {
    id: 'lab-703',
    panelName: 'Cardiac Biomarker Panel (Troponin I & CK-MB)',
    patientName: 'Marcus Sterling',
    specimenType: 'Plasma (Heparin)',
    criticalAbnormalitiesCount: 0,
    troponinNgMl: 0.01,
    ckmbNgMl: 2.1,
    aiInterpretation: 'Troponin I within normal reference range (< 0.04 ng/mL). Low risk acute coronary event.',
    labStatus: 'NORMAL',
  },
];

export default function ClinicalPathologyLabPage() {
  const [reports, setReports] = useState(LAB_REPORTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('lab-reports');
  const [selectedReportModal, setSelectedReportModal] = useState(null);

  const criticalPanels = reports.filter(r => r.labStatus === 'CRITICAL_PANEL').length;

  const filteredReports = reports.filter(r =>
    r.panelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.aiInterpretation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Header Banner */}
      <header className="max-w-7xl mx-auto mb-8 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full font-semibold border border-purple-500/30 flex items-center gap-1.5">
                <Microscope className="w-3.5 h-3.5" /> OpenPrep-AI Pathology Engine
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> LOINC & HL7 Laboratory Standard
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-200 bg-clip-text text-transparent">
              Clinical Pathology & Lab Analytics Hub
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Automated ABG acid-base interpretation engines, CBC differential analyzers, biomarker threshold monitoring, and critical laboratory alert notification pipelines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-purple-600/30 transition flex items-center gap-2 border border-purple-400/20 text-sm">
              <TestTube2 className="w-4 h-4" /> Import LOINC Specimen Feed
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
              <span>Critical Lab Values</span>
              <AlertTriangle className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{criticalPanels} Panels</div>
            <div className="text-purple-400 text-xs mt-2 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> STAT Physician Notification Triggered
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>ABG Interpretation Engine</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">99.4% Accurate</div>
            <div className="text-indigo-400 text-xs mt-2 font-medium">
              Henderson-Hasselbalch Equation Validated
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Turnaround Speed</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">8.2 Minutes</div>
            <div className="text-cyan-400 text-xs mt-2 font-medium">
              LIS Direct LIS-to-EHR Sync
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('lab-reports')}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
                activeTab === 'lab-reports'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <TestTube2 className="w-4 h-4" /> Lab Panels
            </button>
            <button
              onClick={() => setActiveTab('specimen-stream')}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
                activeTab === 'specimen-stream'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4" /> Specimen Processing Stream
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search panel or patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Tab Body */}
        {activeTab === 'specimen-stream' ? (
          <SpecimenStreamTimeline />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredReports.map((report) => (
              <LabReportCard
                key={report.id}
                report={report}
                onInspect={() => setSelectedReportModal(report)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal View */}
      {selectedReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedReportModal(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white text-xl font-bold"
            >
              ×
            </button>

            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedReportModal.panelName}</h3>
                <div className="text-xs text-slate-400 font-mono">Patient: {selectedReportModal.patientName}</div>
              </div>
              <span className="bg-purple-500/20 text-purple-400 px-2.5 py-1 rounded font-mono text-xs font-bold border border-purple-500/30">
                {selectedReportModal.labStatus}
              </span>
            </div>

            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Specimen Type</span>
                <span className="text-white font-bold">{selectedReportModal.specimenType}</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-500 block">AI Pathology Interpretation</span>
                <span className="text-purple-300 font-semibold">{selectedReportModal.aiInterpretation}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedReportModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition"
              >
                Close Lab Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
