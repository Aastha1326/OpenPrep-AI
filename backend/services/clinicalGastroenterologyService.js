/**
 * Clinical Gastroenterology & Endoscopy Engine Service.
 * Manages GI endoscopic procedures, evaluates Glasgow-Blatchford GI bleeding risk,
 * records Mayo IBD endoscopic scores, and tracks biopsy histopathology workflow.
 */

const ClinicalGastroenterology = require('../models/ClinicalGastroenterologyModel');

class ClinicalGastroenterologyService {
  /**
   * Schedules a new gastroenterology endoscopic procedure.
   */
  static async scheduleProcedure(procedureData) {
    const newProcedure = new ClinicalGastroenterology({
      procedureId: `ENDO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      ...procedureData,
      procedureStatus: 'SCHEDULED',
    });
    return await newProcedure.save();
  }

  /**
   * Logs an endoscopic finding (polyp, ulceration, varices) and biopsy status.
   */
  static async addEndoscopicFinding(procedureId, findingData) {
    const procedure = await ClinicalGastroenterology.findOne({ procedureId });
    if (!procedure) {
      throw new Error(`Endoscopic procedure ${procedureId} not found.`);
    }

    procedure.findings.push(findingData);
    procedure.procedureStatus = findingData.biopsyTaken ? 'BIOPSY_PENDING' : 'COMPLETED';

    return await procedure.save();
  }

  /**
   * Updates Mayo Endoscopic Score for IBD assessment (0 to 3).
   */
  static async updateMayoScore(procedureId, score) {
    const procedure = await ClinicalGastroenterology.findOne({ procedureId });
    if (!procedure) {
      throw new Error(`Endoscopic procedure ${procedureId} not found.`);
    }

    procedure.mayoEndoscopicScore = score;
    return await procedure.save();
  }

  /**
   * Calculates Glasgow-Blatchford GI Bleeding Risk Score based on BUN, Hb, and Vitals.
   */
  static calculateGlasgowBlatchfordScore(bloodUreaNitrogen, hemoglobin, systolicBp, pulse) {
    let score = 0;
    if (bloodUreaNitrogen >= 25) score += 6;
    else if (bloodUreaNitrogen >= 10) score += 4;

    if (hemoglobin < 10) score += 6;
    else if (hemoglobin < 12) score += 3;

    if (systolicBp < 90) score += 3;
    else if (systolicBp < 100) score += 2;

    if (pulse >= 100) score += 1;

    return score;
  }
}

module.exports = ClinicalGastroenterologyService;
