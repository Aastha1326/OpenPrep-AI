import React, { useState } from 'react';
import { EndoscopyProcedureCard } from '../../components/gastroenterology/EndoscopyProcedureCard';
import { GastroenterologyTelemetryStreamTimeline } from '../../components/gastroenterology/GastroenterologyTelemetryStreamTimeline';

/**
 * Clinical Gastroenterology & Endoscopy Suite Dashboard Page.
 * Surveillance dashboard for endoscopic procedures (Colonoscopy, EGD, ERCP),
 * Mayo endoscopic score for IBD, Glasgow-Blatchford GI bleeding risk, and biopsy path telemetry.
 */
export default function ClinicalGastroenterologyEndoscopyHub() {
  const [procedures, setProcedures] = useState([
    {
      procedureId: 'ENDO-901',
      patientId: 'PT-7701',
      patientAlias: 'Jonathan Hayes',
      procedureType: 'COLONOSCOPY',
      mayoEndoscopicScore: 1,
      glasgowBlatchfordScore: 2,
      sedationAgent: 'Propofol 140mg IV',
      bowelPreparationQuality: 'EXCELLENT',
      procedureStatus: 'BIOPSY_PENDING',
      findings: [
        {
          location: 'Sigmoid Colon',
          findingType: 'POLYP',
          polypSizeMm: 6,
          biopsyTaken: true,
          histopathologyGrade: 'Adenomatous Polyp (Pending Path)',
        },
      ],
    },
    {
      procedureId: 'ENDO-902',
      patientId: 'PT-7702',
      patientAlias: 'Maria Santos',
      procedureType: 'EGD_GASTROSCOPY',
      mayoEndoscopicScore: 2,
      glasgowBlatchfordScore: 8,
      sedationAgent: 'Midazolam + Fentanyl',
      bowelPreparationQuality: 'GOOD',
      procedureStatus: 'COMPLETED',
      findings: [
        {
          location: 'Duodenal Bulb',
          findingType: 'ULCERATION',
          polypSizeMm: 0,
          biopsyTaken: false,
          histopathologyGrade: 'Active Peptic Ulcer',
        },
      ],
    },
  ]);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newProcedure, setNewProcedure] = useState({
    patientAlias: '',
    patientId: '',
    procedureType: 'COLONOSCOPY',
    mayoEndoscopicScore: 0,
    glasgowBlatchfordScore: 1,
    sedationAgent: 'Propofol 120mg',
    bowelPreparationQuality: 'EXCELLENT',
  });

  const handleScheduleProcedure = (e) => {
    e.preventDefault();
    const created = {
      procedureId: `ENDO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      ...newProcedure,
      procedureStatus: 'SCHEDULED',
      findings: [],
    };
    setProcedures([created, ...procedures]);
    setShowScheduleModal(false);
  };

  const handleAddFinding = (proc) => {
    alert(`Initiated Endoscopic Finding Logger for Procedure ${proc.procedureId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                ASGE Endoscopy Standards
              </span>
              <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                Mayo IBD & Glasgow GI Risk
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
              Clinical Gastroenterology & Endoscopy Hub
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl">
              High-velocity surveillance for GI endoscopy procedures (EGD, Colonoscopy, ERCP), Mayo IBD mucosal scores, Glasgow-Blatchford GI bleeding risk calculation, and polyp biopsy telemetry.
            </p>
          </div>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
          >
            + Schedule Endoscopy Procedure
          </button>
        </div>
      </div>

      {/* Telemetry Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Total Endoscopies
          </span>
          <span className="text-white text-3xl font-black">{procedures.length}</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Biopsies Pending Path
          </span>
          <span className="text-purple-400 text-3xl font-black">
            {procedures.filter((p) => p.procedureStatus === 'BIOPSY_PENDING').length}
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            High GI Bleed Risk
          </span>
          <span className="text-rose-400 text-3xl font-black">
            {procedures.filter((p) => p.glasgowBlatchfordScore >= 6).length}
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Excellent Prep Rate
          </span>
          <span className="text-emerald-400 text-3xl font-black">
            {Math.round((procedures.filter((p) => p.bowelPreparationQuality === 'EXCELLENT').length / (procedures.length || 1)) * 100)}%
          </span>
        </div>
      </div>

      {/* Procedures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {procedures.map((p) => (
          <EndoscopyProcedureCard
            key={p.procedureId}
            procedure={p}
            onAddFinding={handleAddFinding}
          />
        ))}
      </div>

      {/* Audit Timeline */}
      <GastroenterologyTelemetryStreamTimeline procedures={procedures} />

      {/* Schedule Procedure Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl w-full shadow-2xl">
            <h3 className="text-white font-extrabold text-2xl mb-6">Schedule Endoscopy Procedure</h3>
            <form onSubmit={handleScheduleProcedure} className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs font-bold block mb-1">Patient Name / Alias</label>
                <input
                  type="text"
                  required
                  value={newProcedure.patientAlias}
                  onChange={(e) => setNewProcedure({ ...newProcedure, patientAlias: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Patient ID</label>
                  <input
                    type="text"
                    required
                    value={newProcedure.patientId}
                    onChange={(e) => setNewProcedure({ ...newProcedure, patientId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Procedure Type</label>
                  <select
                    value={newProcedure.procedureType}
                    onChange={(e) => setNewProcedure({ ...newProcedure, procedureType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  >
                    <option value="COLONOSCOPY">Colonoscopy</option>
                    <option value="EGD_GASTROSCOPY">EGD Gastroscopy</option>
                    <option value="ERCP">ERCP</option>
                    <option value="CAPSULE_ENDOSCOPY">Capsule Endoscopy</option>
                    <option value="FLEXIBLE_SIGMOIDOSCOPY">Flexible Sigmoidoscopy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Mayo IBD Score (0-3)</label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={newProcedure.mayoEndoscopicScore}
                    onChange={(e) => setNewProcedure({ ...newProcedure, mayoEndoscopicScore: parseInt(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Bowel Prep Quality</label>
                  <select
                    value={newProcedure.bowelPreparationQuality}
                    onChange={(e) => setNewProcedure({ ...newProcedure, bowelPreparationQuality: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  >
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="bg-slate-800 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
                >
                  Schedule Procedure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
