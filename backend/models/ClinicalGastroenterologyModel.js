/**
 * Mongoose domain model for Clinical Gastroenterology & Endoscopy Procedures.
 * Tracks endoscopic procedures (Esophagogastroduodenoscopy - EGD, Colonoscopy, ERCP),
 * Mayo endoscopic score for Inflammatory Bowel Disease (IBD), polyp histopathology,
 * gastrointestinal bleeding risk (Glasgow-Blatchford score), and post-procedure sedation audit.
 */

const mongoose = require('mongoose');

const EndoscopicFindingSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  location: { type: String, required: true }, // e.g. Cecum, Sigmoid Colon, Duodenum
  findingType: {
    type: String,
    enum: ['POLYP', 'ULCERATION', 'VARICES', 'MUCOSAL_INFLAMMATION', 'STRICTURE', 'NORMAL'],
    default: 'NORMAL',
  },
  polypSizeMm: { type: Number, default: 0 },
  biopsyTaken: { type: Boolean, default: false },
  histopathologyGrade: { type: String, default: 'Pending Path' },
});

const ClinicalGastroenterologySchema = new mongoose.Schema(
  {
    procedureId: { type: String, required: true, unique: true },
    patientId: { type: String, required: true },
    patientAlias: { type: String, required: true },
    procedureType: {
      type: String,
      enum: ['COLONOSCOPY', 'EGD_GASTROSCOPY', 'ERCP', 'CAPSULE_ENDOSCOPY', 'FLEXIBLE_SIGMOIDOSCOPY'],
      required: true,
    },
    mayoEndoscopicScore: { type: Number, default: 0 }, // 0 (Normal) to 3 (Severe IBD)
    glasgowBlatchfordScore: { type: Number, default: 0 }, // GI bleeding risk score (0-23)
    sedationAgent: { type: String, default: 'Propofol + Fentanyl' },
    bowelPreparationQuality: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'],
      default: 'EXCELLENT',
    },
    findings: [EndoscopicFindingSchema],
    procedureStatus: {
      type: String,
      enum: ['SCHEDULED', 'IN_PROCEDURE', 'COMPLETED', 'BIOPSY_PENDING'],
      default: 'SCHEDULED',
    },
    attendingGastroenterologist: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClinicalGastroenterology', ClinicalGastroenterologySchema);
