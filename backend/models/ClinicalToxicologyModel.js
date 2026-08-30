/**
 * Mongoose domain model for Clinical Toxicology & Poison Control.
 * Tracks patient toxin exposure events, toxicological Toxidromes (e.g., Cholinergic, Anticholinergic, Opioid),
 * blood serum drug levels, antidote administration, and poison control protocols.
 */

const mongoose = require('mongoose');

const SerumToxinLevelSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  substanceName: { type: String, required: true },
  concentrationMgL: { type: Number, required: true },
  isToxicThresholdExceeded: { type: Boolean, default: false },
  halfLifeHours: { type: Number, required: true },
});

const ClinicalToxicologySchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, unique: true },
    patientId: { type: String, required: true },
    patientAlias: { type: String, required: true },
    suspectedSubstance: { type: String, required: true },
    toxidromeClassification: {
      type: String,
      enum: ['CHOLINERGIC', 'ANTICHOLINERGIC', 'OPIOID', 'SYMPATHOMIMETIC', 'SEDATIVE_HYPNOTIC', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    exposureRoute: {
      type: String,
      enum: ['INGESTION', 'INHALATION', 'DERMAL', 'INTRAVENOUS'],
      default: 'INGESTION',
    },
    timeSinceExposureHours: { type: Number, required: true },
    antidotePrescribed: { type: String, default: null },
    antidoteAdministered: { type: Boolean, default: false },
    serumLevels: [SerumToxinLevelSchema],
    triageSeverity: {
      type: String,
      enum: ['MILD_OBSERVATION', 'MODERATE_INTERVENTION', 'CRITICAL_ICU'],
      default: 'MODERATE_INTERVENTION',
    },
    attendingToxicologist: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClinicalToxicology', ClinicalToxicologySchema);
