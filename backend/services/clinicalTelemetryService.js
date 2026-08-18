const express = require('express');
const router = express.Router();

class ClinicalTelemetryService {
  constructor() {
    this.strips = [
      {
        id: 'tel-501',
        stripTitle: '12-Lead ECG - Acute Anterior STEMI',
        heartRateBPM: 118,
        rhythmClassification: 'ST-Elevation Myocardial Infarction',
        telemetryStatus: 'CRITICAL_ARRHYTHMIA',
      },
    ];
  }

  getStrips() {
    return this.strips;
  }

  analyzeECGWaveform(ecgData) {
    const { prInterval, qrsDuration, qtcInterval } = ecgData;
    let isAbnormal = false;
    if (qtcInterval > 450 || qrsDuration > 120) {
      isAbnormal = true;
    }
    return {
      isAbnormal,
      analyzedAt: new Date().toISOString(),
      recommendation: isAbnormal ? 'Cardiology Consultation Advised' : 'Normal Waveform Parameters',
    };
  }
}

const telemetryService = new ClinicalTelemetryService();

router.get('/telemetry/strips', (req, res) => {
  res.json({ success: true, data: telemetryService.getStrips() });
});

router.post('/telemetry/analyze-ecg', (req, res) => {
  const result = telemetryService.analyzeECGWaveform(req.body);
  res.json({ success: true, data: result });
});

module.exports = { router, ClinicalTelemetryService };
