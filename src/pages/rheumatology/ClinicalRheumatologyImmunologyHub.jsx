import React, { useState } from 'react';
import { RheumatologyCaseCard } from '../../components/rheumatology/RheumatologyCaseCard';
import { RheumatologyTelemetryStreamTimeline } from '../../components/rheumatology/RheumatologyTelemetryStreamTimeline';

/**
 * Clinical Rheumatology & Autoimmune Immunology Hub Dashboard Page.
 * Surveillance dashboard for autoimmune disorders (RA, SLE), ANA immunofluorescence titers,
 * DAS28-CRP score tracking, inflammatory marker analytics, and biologic DMARD infusions.
 */
export default function ClinicalRheumatologyImmunologyHub() {
  const [cases, setCases] = useState([
    {
      caseId: 'RHEUM-901',
      patientId: 'PT-9901',
      patientAlias: 'Sophia Martinez',
      primaryAutoimmuneDiagnosis: 'RHEUMATOID_ARTHRITIS',
      das28Score: 4.82,
      swollenJointCount: 6,
      tenderJointCount: 8,
      biologicTherapy: 'Adalimumab (Humira) 40mg SC',
      biologicActive: true,
      diseaseActivityState: 'MODERATE_ACTIVITY',
      serologyHistory: [
        {
          anaTiterRatio: '1:320',
          anaPattern: 'SPECKLED',
          antiDsDnaTiter: 12.0,
          rheumatoidFactorIu: 64.0,
          antiCcpUnits: 88.0,
          esrMmHr: 48,
          crpMgL: 24.5,
        },
      ],
    },
    {
      caseId: 'RHEUM-902',
      patientId: 'PT-9902',
      patientAlias: 'Claire Bennett',
      primaryAutoimmuneDiagnosis: 'SYSTEMIC_LUPUS_ERYTHEMATOSUS',
      das28Score: 5.65,
      swollenJointCount: 9,
      tenderJointCount: 11,
      biologicTherapy: 'Belimumab (Benlysta) IV',
      biologicActive: false,
      diseaseActivityState: 'HIGH_FLARE_STATE',
      serologyHistory: [
        {
          anaTiterRatio: '1:640',
          anaPattern: 'HOMOGENEOUS',
          antiDsDnaTiter: 145.0,
          rheumatoidFactorIu: 15.0,
          antiCcpUnits: 10.0,
          esrMmHr: 62,
          crpMgL: 38.0,
        },
      ],
    },
  ]);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newCase, setNewCase] = useState({
    patientAlias: '',
    patientId: '',
    primaryAutoimmuneDiagnosis: 'RHEUMATOID_ARTHRITIS',
    swollenJointCount: 4,
    tenderJointCount: 6,
    biologicTherapy: 'Etanercept (Enbrel)',
    initialCrp: 15.0,
  });

  const handleToggleBiologic = (caseId, biologicName, activeState) => {
    setCases((prev) =>
      prev.map((c) =>
        c.caseId === caseId ? { ...c, biologicTherapy: biologicName, biologicActive: activeState } : c
      )
    );
  };

  const handleRegisterCase = (e) => {
    e.preventDefault();
    const tjTerm = 0.56 * Math.sqrt(newCase.tenderJointCount);
    const sjTerm = 0.28 * Math.sqrt(newCase.swollenJointCount);
    const crpTerm = 0.36 * Math.log(newCase.initialCrp + 1);
    const das28 = parseFloat((tjTerm + sjTerm + crpTerm + 0.96).toFixed(2));

    const state = das28 > 5.1 ? 'HIGH_FLARE_STATE' : das28 > 3.2 ? 'MODERATE_ACTIVITY' : 'LOW_ACTIVITY';

    const created = {
      caseId: `RHEUM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      ...newCase,
      das28Score: das28,
      diseaseActivityState: state,
      biologicActive: false,
      serologyHistory: [
        {
          anaTiterRatio: '1:160',
          anaPattern: 'SPECKLED',
          esrMmHr: 30,
          crpMgL: newCase.initialCrp,
        },
      ],
    };

    setCases([created, ...cases]);
    setShowRegisterModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-teal-500/20 border border-teal-500/40 text-teal-400 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                EULAR / ACR Rheumatology Guidelines
              </span>
              <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                DAS28 & ANA Serology Engine
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
              Clinical Rheumatology & Autoimmune Immunology Hub
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl">
              High-assurance surveillance for Rheumatoid Arthritis & SLE, DAS28-CRP score calculation, ANA immunofluorescence titers, and targeted biologic DMARD infusions.
            </p>
          </div>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-teal-600/25 transition-all transform hover:-translate-y-0.5"
          >
            + Register Autoimmune Case
          </button>
        </div>
      </div>

      {/* Telemetry Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Total Autoimmune Patients
          </span>
          <span className="text-white text-3xl font-black">{cases.length}</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Active Biologic Infusions
          </span>
          <span className="text-teal-400 text-3xl font-black">
            {cases.filter((c) => c.biologicActive).length}
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            High Flare States
          </span>
          <span className="text-rose-400 text-3xl font-black">
            {cases.filter((c) => c.diseaseActivityState === 'HIGH_FLARE_STATE').length}
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Mean DAS28 Score
          </span>
          <span className="text-amber-400 text-3xl font-black">
            {(cases.reduce((acc, c) => acc + c.das28Score, 0) / (cases.length || 1)).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {cases.map((c) => (
          <RheumatologyCaseCard
            key={c.caseId}
            caseDoc={c}
            onToggleBiologic={handleToggleBiologic}
          />
        ))}
      </div>

      {/* Audit Timeline */}
      <RheumatologyTelemetryStreamTimeline cases={cases} />

      {/* New Case Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl w-full shadow-2xl">
            <h3 className="text-white font-extrabold text-2xl mb-6">Register Autoimmune Patient</h3>
            <form onSubmit={handleRegisterCase} className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs font-bold block mb-1">Patient Name / Alias</label>
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
                  <label className="text-slate-400 text-xs font-bold block mb-1">Primary Diagnosis</label>
                  <select
                    value={newCase.primaryAutoimmuneDiagnosis}
                    onChange={(e) => setNewCase({ ...newCase, primaryAutoimmuneDiagnosis: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  >
                    <option value="RHEUMATOID_ARTHRITIS">Rheumatoid Arthritis</option>
                    <option value="SYSTEMIC_LUPUS_ERYTHEMATOSUS">Systemic Lupus Erythematosus</option>
                    <option value="ANKYLOSING_SPONDYLITIS">Ankylosing Spondylitis</option>
                    <option value="PSORIATIC_ARTHRITIS">Psoriatic Arthritis</option>
                    <option value="SJOGRENS_SYNDROME">Sjogren's Syndrome</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Tender Joints</label>
                  <input
                    type="number"
                    max="28"
                    value={newCase.tenderJointCount}
                    onChange={(e) => setNewCase({ ...newCase, tenderJointCount: parseInt(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Swollen Joints</label>
                  <input
                    type="number"
                    max="28"
                    value={newCase.swollenJointCount}
                    onChange={(e) => setNewCase({ ...newCase, swollenJointCount: parseInt(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">CRP (mg/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCase.initialCrp}
                    onChange={(e) => setNewCase({ ...newCase, initialCrp: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="bg-slate-800 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
                >
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
