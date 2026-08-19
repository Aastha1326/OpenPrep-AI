class ClinicalPathologyModel {
  constructor(reportData = {}) {
    this.reportId = reportData.reportId || `lab_${Math.random().toString(36).substr(2, 9)}`;
    this.panelName = reportData.panelName || 'Comprehensive Lab Panel';
    this.patientName = reportData.patientName || 'Anonymous Patient';
    this.specimenType = reportData.specimenType || 'Venous Blood';
    this.criticalCount = reportData.criticalCount || 0;
    this.isCritical = this.criticalCount > 0;
    this.loincCode = reportData.loincCode || '24331-1';
    this.createdAt = reportData.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      reportId: this.reportId,
      panelName: this.panelName,
      patientName: this.patientName,
      specimenType: this.specimenType,
      criticalCount: this.criticalCount,
      isCritical: this.isCritical,
      loincCode: this.loincCode,
      createdAt: this.createdAt,
    };
  }
}

module.exports = ClinicalPathologyModel;
