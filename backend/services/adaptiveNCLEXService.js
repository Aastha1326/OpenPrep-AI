const express = require('express');
const router = express.Router();

class AdaptiveNCLEXService {
  constructor() {
    this.sessions = [
      {
        id: 'nclex-901',
        sessionTitle: 'Next Generation NCLEX (NGN) - Pharmacology',
        masteryScorePercent: 88.5,
        thetaAbilityEstimate: '+1.85',
        status: 'IN_PROGRESS',
      },
      {
        id: 'nclex-902',
        sessionTitle: 'CAT Simulator - Reduction of Risk Potential',
        masteryScorePercent: 92.0,
        thetaAbilityEstimate: '+2.10',
        status: 'PASSED_CUT_STANDARD',
      },
    ];
  }

  getSessions() {
    return this.sessions;
  }

  submitAnswer(sessionData) {
    const { isCorrect, currentTheta } = sessionData;
    const numericTheta = parseFloat(currentTheta || '1.5');
    const updatedTheta = isCorrect ? (numericTheta + 0.15).toFixed(2) : (numericTheta - 0.10).toFixed(2);
    return {
      success: true,
      updatedTheta: `+${updatedTheta}`,
      nextDifficulty: parseFloat(updatedTheta) > 2.0 ? 'HARD / NGN MAX' : 'MEDIUM ADAPTIVE',
    };
  }
}

const nclexService = new AdaptiveNCLEXService();

router.get('/nclex/sessions', (req, res) => {
  res.json({ success: true, data: nclexService.getSessions() });
});

router.post('/nclex/submit-answer', (req, res) => {
  const result = nclexService.submitAnswer(req.body);
  res.json({ success: true, data: result });
});

module.exports = { router, AdaptiveNCLEXService };
