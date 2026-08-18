import React, { useState } from 'react';
import { Award, Video, ShieldCheck, Download, Search, Sparkles, CheckCircle2, Clock, Activity, AlertTriangle, FileText, Stethoscope, Users, MessageSquare } from 'lucide-react';
import OSCESimulationCard from '../../components/osce/OSCESimulationCard';
import DebriefStreamTimeline from '../../components/osce/DebriefStreamTimeline';

const OSCE_SCENARIOS = [
  {
    id: 'osce-801',
    scenarioTitle: 'High-Fidelity Manikin Simulation - Anaphylactic Shock Management',
    clinicalDomain: 'Emergency Resuscitation & Airway',
    learnerName: 'Nurse Trainee Sarah Connor',
    overallRubricScorePercent: 94.5,
    criticalErrorsCount: 0,
    timeToEpinephrineSec: 45,
    debriefSummary: 'Exceptional communication during crisis. Rapid IV epinephrine administration and airway positioning.',
    simulationStatus: 'PASSED_EXCELLENT',
  },
  {
    id: 'osce-802',
    scenarioTitle: 'Standardized Patient Interaction - SBAR Handoff & Sepsis Protocol',
    clinicalDomain: 'Communication & Interprofessional Handoff',
    learnerName: 'Resident Dr. Alex Vance',
    overallRubricScorePercent: 88.0,
    criticalErrorsCount: 0,
    timeToEpinephrineSec: 0,
    debriefSummary: 'Strong SBAR structure during physician escalation. Blood culture collection completed prior to IV antibiotics.',
    simulationStatus: 'PASSED',
  },
  {
    id: 'osce-803',
    scenarioTitle: 'Pediatric Asthma Exacerbation & Oxygen Titration',
    clinicalDomain: 'Pediatric Acute Care',
    learnerName: 'Student Nurse David Kim',
    overallRubricScorePercent: 72.5,
    criticalErrorsCount: 1,
    timeToEpinephrineSec: 0,
    debriefSummary: 'Delayed nebulizer setup by 3 minutes. Good pediatric reassessment after albuterol administration.',
    simulationStatus: 'NEEDS_REMEDIATION',
  },
];

export default function ClinicalSimulationOSCEPage() {
  const [scenarios, setScenarios] = useState(OSCE_SCENARIOS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('scenarios');
  const [selectedScenarioModal, setSelectedScenarioModal] = useState(null);

  const avgRubric = (scenarios.reduce((acc, s) => acc + s.overallRubricScorePercent, 0) / scenarios.length).toFixed(1);

  const filteredScenarios = scenarios.filter(s =>
    s.scenarioTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.learnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.clinicalDomain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Header Banner */}
      <header className="max-w-7xl mx-auto mb-8 bg-gradient-to-r from-teal-950 via-slate-900 to-cyan-950 border border-teal-500/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-teal-500/20 text-teal-300 text-xs px-3 py-1 rounded-full font-semibold border border-teal-500/30 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" /> OpenPrep-AI Simulation Lab
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> INACSL Clinical Simulation Standard Compliant
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-teal-200 bg-clip-text text-transparent">
              Clinical Simulation & OSCE AI Debrief Suite
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Objective Structured Clinical Examination (OSCE) video scoring, SBAR handoff evaluation, crisis resource management rubrics, and automated AI post-simulation debriefing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-teal-600/30 transition flex items-center gap-2 border border-teal-400/20 text-sm">
              <Video className="w-4 h-4" /> Start Video OSCE Rubric
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
              <span>Mean OSCE Rubric Score</span>
              <Award className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{avgRubric}%</div>
            <div className="text-emerald-400 text-xs mt-2 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Above 85% Competency Standard
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Zero-Critical-Error Rate</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">92.4%</div>
            <div className="text-cyan-400 text-xs mt-2 font-medium">
              Patient Safety Protocols Enforced
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>AI Debrief Confidence</span>
              <MessageSquare className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">98.2%</div>
            <div className="text-indigo-400 text-xs mt-2 font-medium">
              Constructive Video Marker Feedback
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
                activeTab === 'scenarios'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Video className="w-4 h-4" /> Completed OSCE Sessions
            </button>
            <button
              onClick={() => setActiveTab('debrief-stream')}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
                activeTab === 'debrief-stream'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4" /> Video Debrief Marker Stream
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search scenario or learner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Tab Body */}
        {activeTab === 'debrief-stream' ? (
          <DebriefStreamTimeline />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredScenarios.map((scenario) => (
              <OSCESimulationCard
                key={scenario.id}
                scenario={scenario}
                onInspect={() => setSelectedScenarioModal(scenario)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal View */}
      {selectedScenarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedScenarioModal(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white text-xl font-bold"
            >
              ×
            </button>

            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedScenarioModal.scenarioTitle}</h3>
                <div className="text-xs text-slate-400 font-mono">Learner: {selectedScenarioModal.learnerName}</div>
              </div>
              <span className="bg-teal-500/20 text-teal-400 px-2.5 py-1 rounded font-mono text-xs font-bold border border-teal-500/30">
                {selectedScenarioModal.simulationStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Rubric Score</span>
                <span className="text-teal-400 font-bold text-sm">{selectedScenarioModal.overallRubricScorePercent}%</span>
              </div>
              <div>
                <span className="text-slate-500 block">Critical Errors</span>
                <span className="text-emerald-400 font-bold text-sm">{selectedScenarioModal.criticalErrorsCount} Items</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-800/80">
                <span className="text-slate-500 block">AI Debrief Feedback</span>
                <span className="text-cyan-300 font-semibold">{selectedScenarioModal.debriefSummary}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedScenarioModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition"
              >
                Close Debrief View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
