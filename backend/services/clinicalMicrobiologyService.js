const express = require('express');
const router = express.Router();

class ClinicalMicrobiologyService {
  constructor() {
    this.cultures = [
      {
        id: 'mic-201',
        specimenSource: 'Blood Culture',
        organismIdentified: 'Methicillin-Resistant Staphylococcus aureus (MRSA)',
        antibiogramSensitivity: 'Vancomycin (S), Daptomycin (S), Oxacillin (R)',
        stewardshipRecommendation: 'Initiate IV Vancomycin.',
        microStatus: 'MDRO_ALERT',
      },
    ];
  }

  getCultures() {
    return this.cultures;
  }

  evaluateMDRORisk(cultureData) {
    const { organismName, resistantDrugs } = cultureData;
    const isMDRO = resistantDrugs.includes('Oxacillin') || resistantDrugs.includes('Ceftriaxone');
    return {
      isMDRO,
      isolationPrecautionNeeded: isMDRO ? 'Contact Isolation' : 'Standard Precautions',
      evaluatedAt: new Date().toISOString(),
    };
  }
}

const microService = new ClinicalMicrobiologyService();

router.get('/microbiology/cultures', (req, res) => {
  res.json({ success: true, data: microService.getCultures() });
});

router.post('/microbiology/evaluate-mdro', (req, res) => {
  const result = microService.evaluateMDRORisk(req.body);
  res.json({ success: true, data: result });
});

module.exports = { router, ClinicalMicrobiologyService };
