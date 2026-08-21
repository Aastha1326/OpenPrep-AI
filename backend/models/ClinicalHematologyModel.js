/**
 * Mongoose domain model for Clinical Hematology & Transfusion Blood Bank.
 * Tracks patient blood types, crossmatch compatibility, donor unit inventory,
 * hemoglobin levels, and transfusion event audit telemetry.
 */

const mongoose = require('mongoose');

const BloodUnitSchema = new mongoose.Schema({
  unitId: { type: String, required: true, unique: true },
  donorId: { type: String, required: true },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true,
  },
  componentType: {
    type: String,
    enum: ['Packed Red Blood Cells', 'Fresh Frozen Plasma', 'Platelet Concentrate', 'Cryoprecipitate'],
    default: 'Packed Red Blood Cells',
  },
  volumeMl: { type: Number, required: true },
  storageTemperatureCelsius: { type: Number, default: 4.0 },
  expirationDate: { type: Date, required: true },
  isCrossmatched: { type: Boolean, default: false },
  assignedPatientId: { type: String, default: null },
  status: {
    type: String,
    enum: ['AVAILABLE', 'CROSSMATCHED', 'IN_TRANSFUSION', 'TRANSFUSED', 'DISCARDED'],
    default: 'AVAILABLE',
  },
});

const ClinicalHematologySchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    patientId: { type: String, required: true },
    patientName: { type: String, required: true },
    recipientBloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: true,
    },
    hemoglobinGdl: { type: Number, required: true },
    hematocritPercentage: { type: Number, required: true },
    plateletCountK: { type: Number, required: true },
    requestedUnitsCount: { type: Number, default: 1 },
    urgencyLevel: {
      type: String,
      enum: ['ROUTINE', 'URGENT', 'STAT_EMERGENCY'],
      default: 'ROUTINE',
    },
    assignedUnits: [BloodUnitSchema],
    crossmatchStatus: {
      type: String,
      enum: ['PENDING', 'COMPATIBLE', 'INCOMPATIBLE', 'TRANSFUSION_COMPLETED'],
      default: 'PENDING',
    },
    attendingHematologist: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClinicalHematology', ClinicalHematologySchema);
