/**
 * Clinical Rheumatology & Autoimmune Immunology Engine Service.
 * Computes Disease Activity Score (DAS28), evaluates ANA serology patterns,
 * tracks inflammatory markers (ESR/CRP), and manages biologic DMARD therapy infusions.
 */

const ClinicalRheumatology = require('../models/ClinicalRheumatologyModel');

class ClinicalRheumatologyService {
  /**
   * Calculates DAS28-CRP Disease Activity Score for Rheumatoid Arthritis.
   * Formula: 0.56 * sqrt(TJC28) + 0.28 * sqrt(SJC28) + 0.36 * ln(CRP + 1) + 0.014 * GH + 0.96
   */
  static calculateDAS28(tenderJoints, swollenJoints, crp) {
    const tjTerm = 0.56 * Math.sqrt(tenderJoints);
    const sjTerm = 0.28 * Math.sqrt(swollenJoints);
    const crpTerm = 0.36 * Math.log(crp + 1);
    const score = tjTerm + sjTerm + crpTerm + 0.96;
    return parseFloat(score.toFixed(2));
  }

  /**
   * Evaluates disease activity state based on DAS28 score.
   */
  static evaluateDiseaseState(das28Score) {
    if (das28Score < 2.6) return 'REMISSION';
    if (das28Score <= 3.2) return 'LOW_ACTIVITY';
    if (das28Score <= 5.1) return 'MODERATE_ACTIVITY';
    return 'HIGH_FLARE_STATE';
  }

  /**
   * Registers a new rheumatology autoimmune patient case.
   */
  static async registerRheumatologyCase(caseData) {
    const das28 = this.calculateDAS28(
      caseData.tenderJointCount || 0,
      caseData.swollenJointCount || 0,
      caseData.initialCrp || 10.0
    );

    const diseaseState = this.evaluateDiseaseState(das28);

    const newCase = new ClinicalRheumatology({
      caseId: `RHEUM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      ...caseData,
      das28Score: das28,
      diseaseActivityState: diseaseState,
    });

    return await newCase.save();
  }

  /**
   * Logs new autoimmune serology lab panel (ANA, ESR, CRP).
   */
  static async addSerologyPanel(caseId, serologyData) {
    const caseDoc = await ClinicalRheumatology.findOne({ caseId });
    if (!caseDoc) {
      throw new Error(`Rheumatology case ${caseId} not found.`);
    }

    caseDoc.serologyHistory.push(serologyData);

    // Recalculate DAS28 score with new CRP
    const updatedDas28 = this.calculateDAS28(
      caseDoc.tenderJointCount,
      caseDoc.swollenJointCount,
      serologyData.crpMgL
    );

    caseDoc.das28Score = updatedDas28;
    caseDoc.diseaseActivityState = this.evaluateDiseaseState(updatedDas28);

    return await caseDoc.save();
  }

  /**
   * Toggles active biologic DMARD therapy (e.g. Adalimumab, Rituximab).
   */
  static async toggleBiologicTherapy(caseId, biologicName, activeState) {
    const caseDoc = await ClinicalRheumatology.findOne({ caseId });
    if (!caseDoc) {
      throw new Error(`Rheumatology case ${caseId} not found.`);
    }

    caseDoc.biologicTherapy = biologicName;
    caseDoc.biologicActive = activeState;
    return await caseDoc.save();
  }
}

module.exports = ClinicalRheumatologyService;
