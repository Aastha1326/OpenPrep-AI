const express = require('express');
const router = express.Router();

class ClinicalRadiologyPACSService {
  constructor() {
    this.scans = [
      {
        id: 'rad-301',
        scanTitle: 'Non-Contrast High-Resolution Chest CT',
        modality: 'CT Scan',
        patientName: 'Eleanor Vance',
        aiFindingClassification: 'Bilateral Pulmonary Embolism',
        radiologyStatus: 'STAT_CRITICAL',
      },
    ];
  }

  getScans() {
    return this.scans;
  }

  analyzeDICOMStudy(studyData) {
    const { modality, seriesCount, sliceCount } = studyData;
    return {
      success: true,
      dicomWebReady: true,
      cadTriageCategory: modality === 'CT Scan' ? 'STAT_PULMONARY_EMBOLISM_RISK' : 'NOMINAL_QUEUE',
      timestamp: new Date().toISOString(),
    };
  }
}

const pacsService = new ClinicalRadiologyPACSService();

router.get('/radiology/scans', (req, res) => {
  res.json({ success: true, data: pacsService.getScans() });
});

router.post('/radiology/analyze-study', (req, res) => {
  const result = pacsService.analyzeDICOMStudy(req.body);
  res.json({ success: true, data: result });
});

module.exports = { router, ClinicalRadiologyPACSService };
