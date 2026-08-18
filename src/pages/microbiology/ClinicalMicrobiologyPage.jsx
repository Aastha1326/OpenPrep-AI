import React, { useState } from 'react';
import { Dna, Microscope, ShieldCheck, Download, Search, Sparkles, CheckCircle2, Clock, Activity, AlertTriangle, FileText, Bug, ShieldAlert } from 'lucide-react';
import OrganismCultureCard from '../../components/microbiology/OrganismCultureCard';
import CultureStreamTimeline from '../../components/microbiology/CultureStreamTimeline';

const MICROBIOLOGY_CULTURES = [
  {
    id: 'mic-201',
    specimenSource: 'Blood Culture (Aerobic Bottle #1)',
    organismIdentified: 'Methicillin-Resistant Staphylococcus aureus (MRSA)',
    gramStainResult: 'Gram-Positive Cocci in Clusters',
    patientName: 'Eleanor Vance',
    colonyFormingUnits: '> 100,000 CFU/mL',
    antibiogramSensitivity: 'Vancomycin (S), Daptomycin (S), Oxacillin (R), Penicillin (R)',
    stewardshipRecommendation: 'Initiate IV Vancomycin (trough target 15-20 mcg/mL). De-escalate beta-lactams.',
    microStatus: 'MDRO_ALERT',
  },
  {
    id: 'mic-202',
    specimenSource: 'Clean-Catch Urine Culture',
    organismIdentified: 'Extended-Spectrum Beta-Lactamase (ESBL) E. coli',
    gramStainResult: 'Gram-Negative Bacilli',
    patientName: 'Julian Thorne',
    colonyFormingUnits: '> 100,000 CFU/mL',
    antibiogramSensitivity: 'Meropenem (S), Nitrofurantoin (S), Ceftriaxone (R), Ciprofloxacin (R)',
    stewardshipRecommendation: 'Carbapenem therapy indicated. Strict Contact Isolation precautions active.',
    microStatus: 'MDRO_ALERT',
  },
  {
    id: 'mic-203',
    specimenSource: 'Sputum Aspirate Culture',
    organismIdentified: 'Pseudomonas aeruginosa (Wild-Type)',
    gramStainResult: 'Gram-Negative Rods',
    patientName: 'Marcus Sterling',
    colonyFormingUnits: 'Moderate Growth (3+)',
    antibiogramSensitivity: 'Cefepime (S), Piperacillin-Tazobactam (S), Tobramycin (S)',
    stewardshipRecommendation: 'High-dose anti-pseudomonal beta-lactam monotherapy recommended.',
    microStatus: 'SENSITIVE_SPECIES',
  },
];

export default function ClinicalMicrobiologyPage() {
  const [cultures, setCultures] = useState(MICROBIOLOGY_CULTURES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('cultures');
  const [selectedCultureModal, setSelectedCultureModal] = useState(null);

  const mdroCount = cultures.filter(c => c.microStatus === 'MDRO_ALERT').length;

  const filteredCultures = cultures.filter(c =>
    c.organismIdentified.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.specimenSource.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.patientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Header Banner */}
      <header className="max-w-7xl mx-auto mb-8 bg-gradient-to-r from-emerald-950 via-slate-900 to-green-950 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full font-semibold border border-emerald-500/30 flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5" /> OpenPrep-AI Microbiology Engine
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> CLSI M100 Antibiogram & MIC Standards Verified
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-200 bg-clip-text text-transparent">
              Clinical Microbiology & Antibiogram Suite
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Automated MALDI-TOF mass spec organism identification, MIC sensitivity panel interpretation, MDRO infection control isolation alerts, and antibiotic stewardship guidance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 border border-emerald-400/20 text-sm">
              <Microscope className="w-4 h-4" /> Run Antibiogram Matching
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
              <span>Active MDRO Flagged Cases</span>
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{mdroCount} Organisms</div>
            <div className="text-emerald-400 text-xs mt-2 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Contact Isolation Precautions Active
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>MALDI-TOF Mass Spec Time</span>
              <Clock className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">18 Minutes</div>
            <div className="text-green-400 text-xs mt-2 font-medium">
              Rapid Species Identification
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Stewardship De-escalation</span>
              <Dna className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">96.8% Compliance</div>
            <div className="text-cyan-400 text-xs mt-2 font-medium">
              Targeted Antibiotic Selection
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('cultures')}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
                activeTab === 'cultures'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Bug className="w-4 h-4" /> Culture Results
            </button>
            <button
              onClick={() => setActiveTab('culture-stream')}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
                activeTab === 'culture-stream'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4" /> Live Incubation Stream
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search organism or specimen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Tab Body */}
        {activeTab === 'culture-stream' ? (
          <CultureStreamTimeline />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCultures.map((culture) => (
              <OrganismCultureCard
                key={culture.id}
                culture={culture}
                onInspect={() => setSelectedCultureModal(culture)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal View */}
      {selectedCultureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedCultureModal(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white text-xl font-bold"
            >
              ×
            </button>

            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedCultureModal.organismIdentified}</h3>
                <div className="text-xs text-slate-400 font-mono">Specimen: {selectedCultureModal.specimenSource}</div>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded font-mono text-xs font-bold border border-emerald-500/30">
                {selectedCultureModal.microStatus}
              </span>
            </div>

            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Antibiogram Sensitivities (S / R)</span>
                <span className="text-emerald-300 font-bold">{selectedCultureModal.antibiogramSensitivity}</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-500 block">Antibiotic Stewardship Guidance</span>
                <span className="text-green-300 font-semibold">{selectedCultureModal.stewardshipRecommendation}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedCultureModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition"
              >
                Close Culture Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
