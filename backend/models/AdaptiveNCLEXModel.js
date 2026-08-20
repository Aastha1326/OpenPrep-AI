class AdaptiveNCLEXModel {
  constructor(sessionData = {}) {
    this.sessionId = sessionData.sessionId || `nclex_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionTitle = sessionData.sessionTitle || 'Adaptive NCLEX Module';
    this.domainCategory = sessionData.domainCategory || 'Pharmacology';
    this.totalQuestionsCompleted = sessionData.totalQuestionsCompleted || 0;
    this.thetaAbility = sessionData.thetaAbility || 1.5;
    this.masteryScore = sessionData.masteryScore || 80.0;
    this.hasPassedCutStandard = this.thetaAbility >= 1.8;
    this.createdAt = sessionData.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      sessionId: this.sessionId,
      sessionTitle: this.sessionTitle,
      domainCategory: this.domainCategory,
      totalQuestionsCompleted: this.totalQuestionsCompleted,
      thetaAbility: this.thetaAbility,
      masteryScore: this.masteryScore,
      hasPassedCutStandard: this.hasPassedCutStandard,
      createdAt: this.createdAt,
    };
  }
}

module.exports = AdaptiveNCLEXModel;
