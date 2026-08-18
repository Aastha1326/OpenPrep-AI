class ClinicalSimulationOSCEModel {
  constructor(scenarioData = {}) {
    this.scenarioId = scenarioData.scenarioId || `osce_${Math.random().toString(36).substr(2, 9)}`;
    this.scenarioTitle = scenarioData.scenarioTitle || 'High-Fidelity Simulation';
    this.learnerName = scenarioData.learnerName || 'Trainee Learner';
    this.rubricScore = scenarioData.rubricScore || 85.0;
    this.hasPassed = this.rubricScore >= 80.0;
    this.createdAt = scenarioData.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      scenarioId: this.scenarioId,
      scenarioTitle: this.scenarioTitle,
      learnerName: this.learnerName,
      rubricScore: this.rubricScore,
      hasPassed: this.hasPassed,
      createdAt: this.createdAt,
    };
  }
}

module.exports = ClinicalSimulationOSCEModel;
