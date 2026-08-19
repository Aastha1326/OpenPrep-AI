import React, { useState } from 'react';
import { Award, BookOpen, Clock, Sparkles, CheckCircle2, ChevronRight, HelpCircle, BarChart3, AlertTriangle, ShieldCheck, Activity, Brain } from 'lucide-react';
import ExamQuestionCard from '../../components/nclex/ExamQuestionCard';
import ExamPerformanceTimeline from '../../components/nclex/ExamPerformanceTimeline';

const NCLEX_EXAM_SESSIONS = [
  {
    id: 'nclex-901',
    sessionTitle: 'Next Generation NCLEX (NGN) - Pharmacology & Parenteral Therapies',
    categoryDomain: 'Pharmacological & Parenteral Therapies',
    totalQuestionsCompleted: 45,
    masteryScorePercent: 88.5,
    thetaAbilityEstimate: '+1.85 (High Passing Probability)',
    averageTimePerQuestionSec: 42,
    adaptiveDifficulty: 'HARD / NGN CASE STUDY',
    status: 'IN_PROGRESS',
  },
  {
    id: 'nclex-902',
    sessionTitle: 'CAT Simulator - Reduction of Risk Potential',
    categoryDomain: 'Reduction of Risk Potential',
    totalQuestionsCompleted: 75,
    masteryScorePercent: 92.0,
    thetaAbilityEstimate: '+2.10 (Passing Cut Standard Achieved)',
    averageTimePerQuestionSec: 38,
    adaptiveDifficulty: 'ADAPTIVE MAX',
    status: 'PASSED_CUT_STANDARD',
  },
  {
    id: 'nclex-903',
    sessionTitle: 'Physiological Adaptation & Hemodynamic Monitoring',
    categoryDomain: 'Physiological Adaptation',
    totalQuestionsCompleted: 30,
    masteryScorePercent: 76.0,
    thetaAbilityEstimate: '+0.45 (Moderate Confidence)',
    averageTimePerQuestionSec: 51,
    adaptiveDifficulty: 'MEDIUM ADAPTIVE',
    status: 'IN_PROGRESS',
  },
];

export default function AdaptiveNCLEXExamSimulatorPage() {
  const [sessions, setSessions] = useState(NCLEX_EXAM_SESSIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('simulators');
  const [selectedSessionModal, setSelectedSessionModal] = useState(null);

  const avgMastery = (sessions.reduce((acc, s) => acc + s.masteryScorePercent, 0) / sessions.length).toFixed(1);

  const filteredSessions = sessions.filter(s =>
    s.sessionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.categoryDomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.adaptiveDifficulty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Header Banner */}
      <header className="max-w-7xl mx-auto mb-8 bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 border border-indigo-500/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full font-semibold border border-indigo-500/30 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> OpenPrep-AI Computer Adaptive Testing (CAT)
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> NGN Item-Response Theory (IRT) Calibrated
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              Adaptive NCLEX-RN Exam & NGN Simulator
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Computerized Adaptive Testing (CAT) engine, 3-parameter IRT difficulty calibration, Next Generation NCLEX (NGN) clinical judgment case studies, and passing probability estimation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 border border-indigo-400/20 text-sm">
              <BookOpen className="w-4 h-4" /> Start Full CAT Simulation
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
              <span>Overall Mastery Score</span>
              <Award className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{avgMastery}%</div>
            <div className="text-emerald-400 text-xs mt-2 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Above 95% Confidence Passing Threshold
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Theta Ability Estimate</span>
              <BarChart3 className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">+1.85 θ</div>
            <div className="text-violet-400 text-xs mt-2 font-medium">
              99.2% Estimated NCLEX-RN Pass Rate
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Completed NGN Items</span>
              <HelpCircle className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">150 Questions</div>
            <div className="text-cyan-400 text-xs mt-2 font-medium">
              Including Matrix, Bowtie & Highlight Items
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('simulators')}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
                activeTab === 'simulators'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Active CAT Modules
            </button>
            <button
              onClick={() => setActiveTab('performance-stream')}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
                activeTab === 'performance-stream'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4" /> IRT Calibration Telemetry
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <input
                type="text"
                placeholder="Search domain or difficulty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Tab Body */}
        {activeTab === 'performance-stream' ? (
          <ExamPerformanceTimeline />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSessions.map((session) => (
              <ExamQuestionCard
                key={session.id}
                session={session}
                onInspect={() => setSelectedSessionModal(session)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal View */}
      {selectedSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedSessionModal(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white text-xl font-bold"
            >
              ×
            </button>

            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedSessionModal.sessionTitle}</h3>
                <div className="text-xs text-slate-400 font-mono">{selectedSessionModal.categoryDomain}</div>
              </div>
              <span className="bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded font-mono text-xs font-bold border border-indigo-500/30">
                {selectedSessionModal.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Mastery Score</span>
                <span className="text-emerald-400 font-bold text-sm">{selectedSessionModal.masteryScorePercent}%</span>
              </div>
              <div>
                <span className="text-slate-500 block">Theta Ability Estimate</span>
                <span className="text-indigo-400 font-bold text-sm">{selectedSessionModal.thetaAbilityEstimate}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Completed Items</span>
                <span className="text-white font-bold text-sm">{selectedSessionModal.totalQuestionsCompleted} Questions</span>
              </div>
              <div>
                <span className="text-slate-500 block">Avg Speed / Item</span>
                <span className="text-cyan-400 font-bold text-sm">{selectedSessionModal.averageTimePerQuestionSec} Seconds</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedSessionModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition"
              >
                Close Exam Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
