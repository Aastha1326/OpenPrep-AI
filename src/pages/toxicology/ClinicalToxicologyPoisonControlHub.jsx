import React, { useState } from 'react';
import { ToxicologyCaseCard } from '../../components/toxicology/ToxicologyCaseCard';
import { ToxicologyTelemetryStreamTimeline } from '../../components/toxicology/ToxicologyTelemetryStreamTimeline';

/**
 * Clinical Toxicology & Poison Control Center Dashboard Page.
 * Surveillance dashboard for acute toxic overdose cases, toxidrome mapping,
 * antidote administration protocols, serum drug concentration analytics, and emergency triage.
 */
export default function ClinicalToxicologyPoisonControlHub() {
  const [cases, setCases] = useState([
    {
      caseId: 'TOX-CASE-901',
      patientId: 'PT-8801',
      patientAlias: 'Elena Rostova',
      suspectedSubstance: 'Acetaminophen (Paracetamol)',
      toxidromeClassification: 'UNKNOWN',
      exposureRoute: 'INGESTION',
      timeSinceExposureHours: 4.5,
      antidotePrescribed: 'N-Acetylcysteine (NAC) IV',
      antidoteAdministered: true,
      triageSeverity: 'MODERATE_INTERVENTION',
      serumLevels: [
        {
          substanceName: 'Acetaminophen',
          concentrationMgL: 185,
          isToxicThresholdExceeded: true,
          halfLifeHours: 4.0,
        },
      ],
    },
    {
      caseId: 'TOX-CASE-902',
      patientId: 'PT-8802',
      patientAlias: 'David Vance',
      suspectedSubstance: 'Organophosphate Insecticide',
      toxidromeClassification: 'CHOLINERGIC',
      exposureRoute: 'DERMAL',
      timeSinceExposureHours: 1.2,
      antidotePrescribed: 'Atropine + Pralidoxime',
      antidoteAdministered: false,
      triageSeverity: 'CRITICAL_ICU',
      serumLevels: [
        {
          substanceName: 'Cholinesterase Inhibition',
          concentrationMgL: 45,
          isToxicThresholdExceeded: true,
          halfLifeHours: 12.0,
        },
      ],
    },
  ]);

  const [showCaseModal, setShowCaseModal] = useState(false);
  const [newCase, setNewCase] = useState({
    patientAlias: '',
    patientId: '',
    suspectedSubstance: '',
    toxidromeClassification: 'OPIOID',
    exposureRoute: 'INGESTION',
    timeSinceExposureHours: 2.0,
    triageSeverity: 'MODERATE_INTERVENTION',
  });

  const handleAdministerAntidote = (caseId) => {
    setCases((prev) =>
      prev.map((c) => (c.caseId === caseId ? { ...c, antidoteAdministered: true } : c))
    );
  };

  const handleRegisterCase = (e) => {
    e.preventDefault();
    const created = {
      caseId: `TOX-CASE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      ...newCase,
      antidotePrescribed: newCase.toxidromeClassification === 'OPIOID' ? 'Naloxone IV' : 'Supportive Care',
      antidoteAdministered: false,
      serumLevels: [
        {
          substanceName: newCase.suspectedSubstance,
          concentrationMgL: 120,
          isToxicThresholdExceeded: true,
          halfLifeHours: 3.5,
        },
      ],
    };
    setCases([created, ...cases]);
    setShowCaseModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-purple-500/20 border border-purple-500/40 text-purple-400 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                AACT Poison Control Protocol
              </span>
              <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                Toxidrome Mapping Engine
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
              Clinical Toxicology & Poison Control Hub
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl">
              Real-time toxicological overdose surveillance, Rumack-Matthew nomogram analytics, toxidrome classification, and emergency antidote protocol management.
            </p>
          </div>

          <button
            onClick={() => setShowCaseModal(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-purple-600/25 transition-all transform hover:-translate-y-0.5"
          >
            + Register Overdose Case
          </button>
        </div>
      </div>

      {/* Telemetry Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Active Poison Cases
          </span>
          <span className="text-white text-3xl font-black">{cases.length}</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Critical ICU Triage
          </span>
          <span className="text-rose-400 text-3xl font-black">
            {cases.filter((c) => c.triageSeverity === 'CRITICAL_ICU').length}
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Antidotes Administered
          </span>
          <span className="text-emerald-400 text-3xl font-black">
            {cases.filter((c) => c.antidoteAdministered).length}
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Pending Antidotes
          </span>
          <span className="text-purple-400 text-3xl font-black">
            {cases.filter((c) => !c.antidoteAdministered).length}
          </span>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {cases.map((c) => (
          <ToxicologyCaseCard
            key={c.caseId}
            caseDoc={c}
            onAdministerAntidote={handleAdministerAntidote}
          />
        ))}
      </div>

      {/* Audit Timeline */}
      <ToxicologyTelemetryStreamTimeline cases={cases} />

      {/* New Case Modal */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl w-full shadow-2xl">
            <h3 className="text-white font-extrabold text-2xl mb-6">Register Poison Control Case</h3>
            <form onSubmit={handleRegisterCase} className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs font-bold block mb-1">Patient Alias / Name</label>
                <input
                  type="text"
                  required
                  value={newCase.patientAlias}
                  onChange={(e) => setNewCase({ ...newCase, patientAlias: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Patient ID</label>
                  <input
                    type="text"
                    required
                    value={newCase.patientId}
                    onChange={(e) => setNewCase({ ...newCase, patientId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Suspected Toxin / Substance</label>
                  <input
                    type="text"
                    required
                    value={newCase.suspectedSubstance}
                    onChange={(e) => setNewCase({ ...newCase, suspectedSubstance: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Toxidrome Classification</label>
                  <select
                    value={newCase.toxidromeClassification}
                    onChange={(e) => setNewCase({ ...newCase, toxidromeClassification: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  >
                    <option value="OPIOID">Opioid</option>
                    <option value="CHOLINERGIC">Cholinergic</option>
                    <option value="ANTICHOLINERGIC">Anticholinergic</option>
                    <option value="SYMPATHOMIMETIC">Sympathomimetic</option>
                    <option value="SEDATIVE_HYPNOTIC">Sedative-Hypnotic</option>
                    <option value="UNKNOWN">Unknown / Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Exposure Route</label>
                  <select
                    value={newCase.exposureRoute}
                    onChange={(e) => setNewCase({ ...newCase, exposureRoute: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  >
                    <option value="INGESTION">Ingestion</option>
                    <option value="INHALATION">Inhalation</option>
                    <option value="DERMAL">Dermal</option>
                    <option value="INTRAVENOUS">Intravenous</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCaseModal(false)}
                  className="bg-slate-800 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
                >
                  Register Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
