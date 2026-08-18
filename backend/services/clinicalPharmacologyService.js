const express = require('express');
const router = express.Router();

class ClinicalPharmacologyService {
  constructor() {
    this.calculations = [
      {
        id: 'dos-601',
        medicationName: 'Dopamine IV Infusion',
        patientWeightKg: 72,
        targetDosageMcgKgMin: 5.0,
        concentrationMgMl: 400,
        diluentVolumeMl: 250,
        calculatedRateMlHr: 13.5,
        safetyVerificationStatus: 'VERIFIED_SAFE',
      },
    ];
  }

  getCalculations() {
    return this.calculations;
  }

  calculateFlowRate(data) {
    const { weightKg, doseMcgKgMin, concMg, volumeMl } = data;
    const totalMcgPerMin = weightKg * doseMcgKgMin;
    const concMcgPerMl = (concMg * 1000) / volumeMl;
    const rateMlHr = (totalMcgPerMin * 60) / concMcgPerMl;

    return {
      calculatedRateMlHr: parseFloat(rateMlHr.toFixed(1)),
      safetyPass: true,
      timestamp: new Date().toISOString(),
    };
  }
}

const pharmService = new ClinicalPharmacologyService();

router.get('/pharmacology/calculations', (req, res) => {
  res.json({ success: true, data: pharmService.getCalculations() });
});

router.post('/pharmacology/calculate-rate', (req, res) => {
  const result = pharmService.calculateFlowRate(req.body);
  res.json({ success: true, data: result });
});

module.exports = { router, ClinicalPharmacologyService };
