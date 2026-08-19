import React, { useState, useMemo } from 'react';
import {
  Dna,
  Users,
  Search,
  Filter,
  Microscope,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  Database,
  Layers,
  Sparkles,
  Zap,
  Sliders,
  XCircle,
  FileCode,
  Share2
} from 'lucide-react';

const ClinicalTrialGenomicHub = () => {
  const [activeTab, setActiveTab] = useState('biomarkers');
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [selectedCohort, setSelectedCohort] = useState(null);

  const [cohorts, setCohorts] = useState([
    {
      id: 'COHORT-801',
      trialTitle: 'Phase III EGFR Mutation Non-Small Cell Lung Cancer',
      biomarker: 'EGFR T790M / L858R',
      enrolledPatients: 420,
      targetCohortSize: 500,
      phase: 'Phase III',
      status: 'Active Enrolling',
      expressionLevel: 'High (84.2%)',
      responderRate: '68.5%',
      principalInvestigator: 'Dr. Aris Thorne'
    },
    {
      id: 'COHORT-802',
      trialTitle: 'Phase II BRCA1/2 Deficient Triple Negative Breast Cancer',
      biomarker: 'BRCA1/2 Deletion',
      enrolledPatients: 180,
      targetCohortSize: 200,
      phase: 'Phase II',
      status: 'Cohort Closed',
      expressionLevel: 'Biallelic Loss',
      responderRate: '74.1%',
      principalInvestigator: 'Dr. Elena Rostova'
    },
    {
      id: 'COHORT-803',
      trialTitle: 'Phase I KRAS G12C Inhibitor Expansion',
      biomarker: 'KRAS G12C Point Mutation',
      enrolledPatients: 95,
      targetCohortSize: 120,
      phase: 'Phase I',
      status: 'Active Enrolling',
      expressionLevel: 'Medium (52.0%)',
      responderRate: '51.8%',
      principalInvestigator: 'Dr. Marcus Holloway'
    }
  ]);

  const filteredCohorts = useMemo(() => {
    return cohorts.filter(c => {
      const matchesSearch =
        c.trialTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.biomarker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPhase =
        phaseFilter === 'all' || c.phase.toLowerCase() === phaseFilter.toLowerCase();

      return matchesSearch && matchesPhase;
    });
  }, [cohorts, searchTerm, phaseFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600/20 rounded-xl border border-purple-500/30 text-purple-400">
            <Dna className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Clinical Trial & Genomic Research Overwatch
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-medium">
                Biomarker Sandbox
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Precision oncology variant sequencing, biomarker expression cohort sandbox & multi-center clinical trial management.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-purple-600/20">
            <Microscope className="w-4 h-4" />
            Query Genomic Variant DB
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Clinical Cohorts</p>
            <p className="text-2xl font-bold text-white mt-1">12 Studies</p>
            <span className="text-xs text-purple-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> 695 Active Patients
            </span>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Sequenced Variants</p>
            <p className="text-2xl font-bold text-white mt-1">14,290 Genes</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <Sparkles className="w-3 h-3" /> Deep Coverage 100x
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Dna className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Overall Response Rate</p>
            <p className="text-2xl font-bold text-white mt-1">64.8%</p>
            <span className="text-xs text-indigo-400 flex items-center gap-1 mt-1">
              <BarChart2 className="w-3 h-3" /> Exceeds Control Arm
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Multi-Center Repositories</p>
            <p className="text-2xl font-bold text-white mt-1">8 Hospitals</p>
            <span className="text-xs text-purple-400 flex items-center gap-1 mt-1">
              <Database className="w-3 h-3" /> HL7 FHIR Genomics
            </span>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl mb-6">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search biomarker, trial title or cohort ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400">Trial Phase:</span>
            <select
              value={phaseFilter}
              onChange={e => setPhaseFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Phases</option>
              <option value="phase i">Phase I</option>
              <option value="phase ii">Phase II</option>
              <option value="phase iii">Phase III</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cohorts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredCohorts.map(cohort => (
          <div key={cohort.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800">
                {cohort.id}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                {cohort.phase}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-white text-base leading-snug">{cohort.trialTitle}</h3>
              <p className="text-xs text-slate-400 mt-1">PI: {cohort.principalInvestigator}</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Target Biomarker:</span>
                <span className="text-purple-300 font-semibold">{cohort.biomarker}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Enrollment:</span>
                <span className="text-slate-200 font-mono">{cohort.enrolledPatients} / {cohort.targetCohortSize}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Response Rate:</span>
                <span className="text-emerald-400 font-bold">{cohort.responderRate}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedCohort(cohort)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700"
            >
              Analyze Biomarker Cohort
            </button>
          </div>
        ))}
      </div>

      {/* Modal Popup */}
      {selectedCohort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Dna className="w-5 h-5 text-purple-400" />
                  Cohort Detail: {selectedCohort.id}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{selectedCohort.trialTitle}</p>
              </div>
              <button onClick={() => setSelectedCohort(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-slate-400">Biomarker Expression: <strong className="text-purple-300">{selectedCohort.expressionLevel}</strong></p>
              <p className="text-slate-400">Status: <strong className="text-emerald-400">{selectedCohort.status}</strong></p>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedCohort(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalTrialGenomicHub;
