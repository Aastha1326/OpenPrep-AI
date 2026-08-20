class ClinicalPharmacologyModel {
  constructor(doseData = {}) {
    this.doseId = doseData.doseId || `dose_${Math.random().toString(36).substr(2, 9)}`;
    this.medicationName = doseData.medicationName || 'Dopamine IV Infusion';
    this.patientWeightKg = doseData.patientWeightKg || 70;
    this.targetDoseMcgKgMin = doseData.targetDoseMcgKgMin || 5.0;
    this.concentrationMg = doseData.concentrationMg || 400;
    this.volumeMl = doseData.volumeMl || 250;
    this.rateMlHr = doseData.rateMlHr || 13.1;
    this.isHighAlert = doseData.isHighAlert ?? true;
    this.createdAt = doseData.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      doseId: this.doseId,
      medicationName: this.medicationName,
      patientWeightKg: this.patientWeightKg,
      targetDoseMcgKgMin: this.targetDoseMcgKgMin,
      concentrationMg: this.concentrationMg,
      volumeMl: this.volumeMl,
      rateMlHr: this.rateMlHr,
      isHighAlert: this.isHighAlert,
      createdAt: this.createdAt,
    };
  }
}

module.exports = ClinicalPharmacologyModel;
