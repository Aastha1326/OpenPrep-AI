class ClinicalRadiologyPACSModel {
  constructor(scanData = {}) {
    this.scanId = scanData.scanId || `rad_${Math.random().toString(36).substr(2, 9)}`;
    this.scanTitle = scanData.scanTitle || 'DICOM 3.0 Imaging Study';
    this.modality = scanData.modality || 'CT Scan';
    this.patientName = scanData.patientName || 'Anonymous Patient';
    this.aiFinding = scanData.aiFinding || 'Unremarkable Imaging Study';
    this.isSTAT = scanData.isSTAT ?? false;
    this.createdAt = scanData.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      scanId: this.scanId,
      scanTitle: this.scanTitle,
      modality: this.modality,
      patientName: this.patientName,
      aiFinding: this.aiFinding,
      isSTAT: this.isSTAT,
      createdAt: this.createdAt,
    };
  }
}

module.exports = ClinicalRadiologyPACSModel;
