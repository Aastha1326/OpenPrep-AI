import React, { useState } from 'react';
import { NeonatalIncubatorCard } from '../../components/nicu/NeonatalIncubatorCard';
import { NICUTelemetryStreamTimeline } from '../../components/nicu/NICUTelemetryStreamTimeline';

/**
 * Neonatal Intensive Care Unit (NICU) Telemetry Station Dashboard Page.
 * Surveillance dashboard for premature infant incubators, phototherapy controls,
 * FiO2 oxygen saturation monitoring, APGAR tracking, and emergency apnea alert handling.
 */
export default function NeonatalICUTelemetryHub() {
  const [incubators, setIncubators] = useState([
    {
      incubatorId: 'NICU-INC-801',
      infantId: 'INF-401',
      infantAlias: 'Baby Girl Miller',
      gestationalAgeWeeks: 28,
      birthWeightGrams: 1120,
      apgarScore1Min: 6,
      apgarScore5Min: 8,
      phototherapyActive: true,
      surfactantAdministered: true,
      careLevel: 'LEVEL_III_INTENSIVE',
      alarmStatus: 'STABLE',
      vitalsHistory: [
        {
          heartRateBpm: 142,
          respiratoryRateRpm: 48,
          spo2Percentage: 96,
          incubatorTemperatureCelsius: 36.8,
          fio2OxygenPercentage: 28.0,
          apneaEpisodeSeconds: 0,
        },
      ],
    },
    {
      incubatorId: 'NICU-INC-802',
      infantId: 'INF-402',
      infantAlias: 'Baby Boy Chen',
      gestationalAgeWeeks: 31,
      birthWeightGrams: 1450,
      apgarScore1Min: 7,
      apgarScore5Min: 9,
      phototherapyActive: false,
      surfactantAdministered: false,
      careLevel: 'LEVEL_II_INTERMEDIATE',
      alarmStatus: 'STABLE',
      vitalsHistory: [
        {
          heartRateBpm: 136,
          respiratoryRateRpm: 44,
          spo2Percentage: 97,
          incubatorTemperatureCelsius: 36.7,
          fio2OxygenPercentage: 21.0,
          apneaEpisodeSeconds: 0,
        },
      ],
    },
  ]);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newInfant, setNewInfant] = useState({
    infantAlias: '',
    gestationalAgeWeeks: 30,
    birthWeightGrams: 1300,
    apgarScore1Min: 7,
    apgarScore5Min: 9,
    careLevel: 'LEVEL_III_INTENSIVE',
  });

  const handleTogglePhototherapy = (incubatorId, activeState) => {
    setIncubators((prev) =>
      prev.map((inc) => (inc.incubatorId === incubatorId ? { ...inc, phototherapyActive: activeState } : inc))
    );
  };

  const handleAdministerSurfactant = (incubatorId) => {
    setIncubators((prev) =>
      prev.map((inc) => (inc.incubatorId === incubatorId ? { ...inc, surfactantAdministered: true } : inc))
    );
  };

  const handleRegisterIncubator = (e) => {
    e.preventDefault();
    const created = {
      incubatorId: `NICU-INC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      infantId: `INF-${Math.floor(100 + Math.random() * 900)}`,
      ...newInfant,
      phototherapyActive: false,
      surfactantAdministered: false,
      alarmStatus: 'STABLE',
      vitalsHistory: [
        {
          heartRateBpm: 138,
          respiratoryRateRpm: 46,
          spo2Percentage: 96,
          incubatorTemperatureCelsius: 36.8,
          fio2OxygenPercentage: 21.0,
          apneaEpisodeSeconds: 0,
        },
      ],
    };
    setIncubators([created, ...incubators]);
    setShowRegisterModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Neonatal Intensive Care Telemetry
              </span>
              <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                Level II-IV Nursery Unit
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
              Neonatal ICU & Premature Incubator Hub
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl">
              Continuous high-assurance surveillance for premature infant vitals, phototherapy controls, exogenous surfactant administration, and apnea detection algorithms.
            </p>
          </div>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-cyan-600/25 transition-all transform hover:-translate-y-0.5"
          >
            + Register Incubator Station
          </button>
        </div>
      </div>

      {/* Telemetry Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Active Incubators
          </span>
          <span className="text-white text-3xl font-black">{incubators.length}</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Phototherapy Active
          </span>
          <span className="text-blue-400 text-3xl font-black">
            {incubators.filter((i) => i.phototherapyActive).length}
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Surfactant Given
          </span>
          <span className="text-emerald-400 text-3xl font-black">
            {incubators.filter((i) => i.surfactantAdministered).length}
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Stable Vitals Rate
          </span>
          <span className="text-cyan-400 text-3xl font-black">100%</span>
        </div>
      </div>

      {/* Incubators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {incubators.map((inc) => (
          <NeonatalIncubatorCard
            key={inc.incubatorId}
            incubator={inc}
            onTogglePhototherapy={handleTogglePhototherapy}
            onAdministerSurfactant={handleAdministerSurfactant}
          />
        ))}
      </div>

      {/* Audit Timeline */}
      <NICUTelemetryStreamTimeline incubators={incubators} />

      {/* Register Incubator Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl w-full shadow-2xl">
            <h3 className="text-white font-extrabold text-2xl mb-6">Register Infant Incubator Station</h3>
            <form onSubmit={handleRegisterIncubator} className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs font-bold block mb-1">Infant Alias / Name</label>
                <input
                  type="text"
                  required
                  value={newInfant.infantAlias}
                  onChange={(e) => setNewInfant({ ...newInfant, infantAlias: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Gestational Age (wks)</label>
                  <input
                    type="number"
                    required
                    value={newInfant.gestationalAgeWeeks}
                    onChange={(e) => setNewInfant({ ...newInfant, gestationalAgeWeeks: parseInt(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Birth Weight (grams)</label>
                  <input
                    type="number"
                    required
                    value={newInfant.birthWeightGrams}
                    onChange={(e) => setNewInfant({ ...newInfant, birthWeightGrams: parseInt(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">1-Min APGAR</label>
                  <input
                    type="number"
                    max="10"
                    value={newInfant.apgarScore1Min}
                    onChange={(e) => setNewInfant({ ...newInfant, apgarScore1Min: parseInt(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">5-Min APGAR</label>
                  <input
                    type="number"
                    max="10"
                    value={newInfant.apgarScore5Min}
                    onChange={(e) => setNewInfant({ ...newInfant, apgarScore5Min: parseInt(e.target.value) })}
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
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
                >
                  Register Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
