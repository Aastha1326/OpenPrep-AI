/**
 * Mongoose domain model for Clinical Rheumatology & Autoimmune Immunology.
 * Tracks autoimmune disease profiles (e.g., Rheumatoid Arthritis, Systemic Lupus Erythematosus),
 * ANA immunofluorescence titers, Erythrocyte Sedimentation Rate (ESR), C-Reactive Protein (CRP),
 * biological DMARD therapy, and disease activity scoring (DAS28 / SLEDAI).
 */

const mongoose = require('mongoose');

const AutoimmuneSerologySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  anaTiterRatio: { type: String, default: '1:160' }, // e.g. 1:320, 1:640
  anaPattern: {
    type: String,
    enum: ['HOMOGENEOUS', 'SPECKLED', 'NUCLEOLAR', 'CENTROMERE', 'NEGATIVE'],
    default: 'SPECKLED',
  },
  antiDsDnaTiter: { type: Number, default: 0.0 }, // IU/mL
  rheumatoidFactorIu: { type: Number, default: 0.0 },
  antiCcpUnits: { type: Number, default: 0.0 },
  esrMmHr: { type: Number, required: true },
  crpMgL: { type: Number, required: true },
});

const ClinicalRheumatologySchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, unique: true },
    patientId: { type: String, required: true },
    patientAlias: { type: String, required: true },
    primaryAutoimmuneDiagnosis: {
      type: String,
      enum: ['RHEUMATOID_ARTHRITIS', 'SYSTEMIC_LUPUS_ERYTHEMATOSUS', 'ANKYLOSING_SPONDYLITIS', 'PSORIATIC_ARTHRITIS', 'SJOGRENS_SYNDROME'],
      required: true,
    },
    das28Score: { type: Number, default: 0.0 }, // DAS28-CRP score
    swollenJointCount: { type: Number, default: 0 },
    tenderJointCount: { type: Number, default: 0 },
    biologicTherapy: { type: String, default: 'None (Conventional DMARDs)' },
    biologicActive: { type: Boolean, default: font => false },
    diseaseActivityState: {
      type: String,
      enum: ['REMISSION', 'LOW_ACTIVITY', 'MODERATE_ACTIVITY', 'HIGH_FLARE_STATE'],
      default: 'MODERATE_ACTIVITY',
    },
    serologyHistory: [AutoimmuneSerologySchema],
    attendingRheumatologist: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClinicalRheumatology', ClinicalRheumatologySchema);
