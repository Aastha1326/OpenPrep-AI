class ClinicalTelemetryModel {
  constructor(telemetryData = {}) {
    this.stripId = telemetryData.stripId || `tel_${Math.random().toString(36).substr(2, 9)}`;
    this.stripTitle = telemetryData.stripTitle || '12-Lead ECG Analysis';
    this.patientBed = telemetryData.patientBed || 'ICU Bed 01';
    this.heartRateBPM = telemetryData.heartRateBPM || 80;
    this.qtcIntervalMs = telemetryData.qtcIntervalMs || 420;
    this.qrsDurationMs = telemetryData.qrsDurationMs || 90;
    this.isCritical = telemetryData.isCritical ?? false;
    this.createdAt = telemetryData.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      stripId: this.stripId,
      stripTitle: this.stripTitle,
      patientBed: this.patientBed,
      heartRateBPM: this.heartRateBPM,
      qtcIntervalMs: this.qtcIntervalMs,
      qrsDurationMs: this.qrsDurationMs,
      isCritical: this.isCritical,
      createdAt: this.createdAt,
    };
  }
}

module.exports = ClinicalTelemetryModel;
