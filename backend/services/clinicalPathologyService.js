const express = require('express');
const router = express.Router();

class ClinicalPathologyService {
  constructor() {
    this.reports = [
      {
        id: 'lab-701',
        panelName: 'Comprehensive Metabolic Panel (CMP) + ABG',
        patientName: 'Eleanor Vance',
        criticalAbnormalitiesCount: 2,
        aiInterpretation: 'Decompensated Respiratory Acidosis with Hyperkalemia.',
        labStatus: 'CRITICAL_PANEL',
      },
    ];
  }

  getReports() {
    return this.reports;
  }

  interpretABG(abgValues) {
    const { pH, pco2, hco3 } = abgValues;
    let interpretation = 'Normal Acid-Base Balance';
    if (pH < 7.35 && pco2 > 45) {
      interpretation = 'Respiratory Acidosis';
    } else if (pH < 7.35 && hco3 < 22) {
      interpretation = 'Metabolic Acidosis';
    }
    return { diagnosis: interpretation, isCritical: pH < 7.30, timestamp: new Date().toISOString() };
  }
}

const pathService = new ClinicalPathologyService();

router.get('/pathology/reports', (req, res) => {
  res.json({ success: true, data: pathService.getReports() });
});

router.post('/pathology/interpret-abg', (req, res) => {
  const result = pathService.interpretABG(req.body);
  res.json({ success: true, data: result });
});

module.exports = { router, ClinicalPathologyService };
