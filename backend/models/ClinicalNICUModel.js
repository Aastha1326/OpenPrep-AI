/**
 * Mongoose domain model for Neonatal Intensive Care Unit (NICU) Telemetry.
 * Tracks premature infant incubators, phototherapy status, FiO2 oxygen saturation,
 * APGAR scores, surfactant administration, and neonatal telemetry alerts.
 */

const mongoose = require('mongoose');

const NeonatalVitalSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  heartRateBpm: { type: Number, required: true },
  respiratoryRateRpm: { type: Number, required: true },
  spo2Percentage: { type: Number, required: true },
  incubatorTemperatureCelsius: { type: Number, required: true },
  fio2OxygenPercentage: { type: Number, default: 21.0 },
  apneaEpisodeSeconds: { type: Number, default: 0 },
});

const ClinicalNICUSchema = new mongoose.Schema(
  {
    incubatorId: { type: String, required: true, unique: true },
    infantId: { type: String, required: true },
    infantAlias: { type: String, required: true },
    gestationalAgeWeeks: { type: Number, required: true },
    birthWeightGrams: { type: Number, required: true },
    apgarScore1Min: { type: Number, required: true },
    apgarScore5Min: { type: Number, required: true },
    phototherapyActive: { type: Boolean, default: false },
    surfactantAdministered: { type: Boolean, default: false },
    careLevel: {
      type: String,
      enum: ['LEVEL_II_INTERMEDIATE', 'LEVEL_III_INTENSIVE', 'LEVEL_IV_SURGICAL'],
      default: 'LEVEL_III_INTENSIVE',
    },
    vitalsHistory: [NeonatalVitalSchema],
    alarmStatus: {
      type: String,
      enum: ['STABLE', 'BRADYCARDIA_WARNING', 'DESATURATION_CRITICAL', 'APNEA_ALERT'],
      default: 'STABLE',
    },
    attendingNeonatologist: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClinicalNICU', ClinicalNICUSchema);
