import React, { useState } from 'react';
import { Eye, ShieldCheck, Download, Search, Sparkles, CheckCircle2, Clock, Activity, AlertTriangle, FileText, Scan, Image, Layers } from 'lucide-react';
import DICOMScanCard from '../../components/radiology/DICOMScanCard';
import ImagingStreamTimeline from '../../components/radiology/ImagingStreamTimeline';

const RADIOLOGY_SCANS = [
  {
    id: 'rad-301',
    scanTitle: 'Non-Contrast High-Resolution Chest CT',
    modality: 'CT Scan (DICOM 3.0)',
    patientName: 'Eleanor Vance',
    anatomicRegion: 'Thorax & Pulmonary Vasculature',
    aiFindingClassification: 'Bilateral Pulmonary Embolism (Saddle Thrombus Risk)',
    sliceThicknessMm: 0.625,
    seriesCount: 4,
    radiologyStatus: 'STAT_CRITICAL',
  },
  {
    id: 'rad-302',
    scanTitle: 'Brain MRI w/ & w/o Gadolinium Contrast',
    modality: 'MRI Scan (3.0 Tesla)',
    patientName: 'Julian Thorne',
    anatomicRegion: 'Neuro-Cerebral & Circle of Willis',
    aiFindingClassification: 'No Acute Intracranial Hemorrhage or Large Territory Infarct',
    sliceThicknessMm: 1.0,
    seriesCount: 6,
    radiologyStatus: 'NOMINAL_READ',
  },
  {
    id: 'rad-303',
    scanTitle: 'Portable AP Chest Radiograph (X-Ray)',
    modality: 'Digital Radiography (DX)',
    patientName: 'Marcus Sterling',
    anatomicRegion: 'Cardiothoracic Region',
    aiFindingClassification: 'Mild Right Basalar Atelectasis. ET Tube 3cm Above Carina',
    sliceThicknessMm: 0,
    seriesCount: 1,
    radiologyStatus: 'NOMINAL_READ',
  },
];

export default function ClinicalRadiologyPACSPage() {
  const [scans, setScans] = useState(RADIOLOGY_SCANS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pacs-scans');
  const [selectedScanModal, setSelectedScanModal] = useState(null);

  const statCount = scans.filter(s => s.radiologyStatus === 'STAT_CRITICAL').length;

  const filteredScans = scans.filter(s =>
    s.scanTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.aiFindingClassification.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Header Banner */}
      <header className="max-w-7xl mx-auto mb-8 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1 rounded-full font-semibold border border-blue-500/30 flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5" /> OpenPrep-AI PACS Engine
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> DICOM 3.0 & Web-Viewer Standard Compliant
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-200 bg-clip-text text-transparent">
              Clinical Radiology & PACS AI Imaging Suite
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Automated DICOM image viewing, AI pulmonary embolism & hemorrhage detection, window-level Hounsfield adjustments, and radiology report triage pipelines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-blue-600/30 transition flex items-center gap-2 border border-blue-400/20 text-sm">
              <Scan className="w-4 h-4" /> Open DICOM Web Viewer
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
              <span>STAT Critical Findings</span>
              <AlertTriangle className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{statCount} Critical Scan</div>
            <div className="text-blue-400 text-xs mt-2 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> STAT Radiologist Pager Dispatched
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>AI CAD Detection Sensitivity</span>
              <Eye className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">99.3%</div>
            <div className="text-indigo-400 text-xs mt-2 font-medium">
              Zero-Miss Intracranial & PE Threshold
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>PACS Transfer Speed</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">1.2 Seconds</div>
            <div className="text-cyan-400 text-xs mt-2 font-medium">
              Lossless JPEG-2000 Transfer Syntax
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('pacs-scans')}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
                activeTab === 'pacs-scans'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Image className="w-4 h-4" /> DICOM Study Worklist
            </button>
            <button
              onClick={() => setActiveTab('imaging-stream')}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
                activeTab === 'imaging-stream'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4" /> Real-time Acquisition Stream
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search scan or modality..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Tab Body */}
        {activeTab === 'imaging-stream' ? (
          <ImagingStreamTimeline />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredScans.map((scan) => (
              <DICOMScanCard
                key={scan.id}
                scan={scan}
                onInspect={() => setSelectedScanModal(scan)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal View */}
      {selectedScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedScanModal(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white text-xl font-bold"
            >
              ×
            </button>

            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedScanModal.scanTitle}</h3>
                <div className="text-xs text-slate-400 font-mono">Patient: {selectedScanModal.patientName}</div>
              </div>
              <span className="bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded font-mono text-xs font-bold border border-blue-500/30">
                {selectedScanModal.radiologyStatus}
              </span>
            </div>

            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Modality</span>
                <span className="text-white font-bold">{selectedScanModal.modality}</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-500 block">AI Finding Classification</span>
                <span className="text-blue-300 font-semibold">{selectedScanModal.aiFindingClassification}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedScanModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition"
              >
                Close DICOM View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
