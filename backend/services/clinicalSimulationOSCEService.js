const express = require('express');
const router = express.Router();

class ClinicalSimulationOSCEService {
  constructor() {
    this.scenarios = [
      {
        id: 'osce-801',
        scenarioTitle: 'High-Fidelity Manikin - Anaphylactic Shock',
        learnerName: 'Nurse Trainee Sarah Connor',
        overallRubricScorePercent: 94.5,
        debriefSummary: 'Exceptional crisis communication & rapid epinephrine.',
        simulationStatus: 'PASSED_EXCELLENT',
      },
    ];
  }

  getScenarios() {
    return this.scenarios;
  }

  scoreSimulationRubric(rubricData) {
    const { communicationScore, clinicalSkillScore, safetyScore } = rubricData;
    const totalScore = ((communicationScore + clinicalSkillScore + safetyScore) / 30) * 100;
    return {
      finalRubricPercent: parseFloat(totalScore.toFixed(1)),
      isCompetent: totalScore >= 80,
      timestamp: new Date().toISOString(),
    };
  }
}

const osceService = new ClinicalSimulationOSCEService();

router.get('/osce/scenarios', (req, res) => {
  res.json({ success: true, data: osceService.getScenarios() });
});

router.post('/osce/score-rubric', (req, res) => {
  const result = osceService.scoreSimulationRubric(req.body);
  res.json({ success: true, data: result });
});

module.exports = { router, ClinicalSimulationOSCEService };
