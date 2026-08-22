/**
 * Clinical Toxicology & Poison Control Engine Service.
 * Evaluates toxin blood concentrations, maps toxicological toxidromes,
 * recommends antidote regimens (e.g. N-acetylcysteine, Naloxone, Atropine), and logs triage alerts.
 */

const ClinicalToxicology = require('../models/ClinicalToxicologyModel');

const ANTIDOTE_RECOMMENDATIONS = {
  OPIOID: 'Naloxone IV',
  CHOLINERGIC: 'Atropine + Pralidoxime',
  ANTICHOLINERGIC: 'Physostigmine',
  SYMPATHOMIMETIC: 'Benzodiazepines IV',
  SEDATIVE_HYPNOTIC: 'Flumazenil',
};

class ClinicalToxicologyService {
  /**
   * Registers a new poison control clinical overdose case.
   */
  static async registerCase(caseData) {
    const recommendedAntidote = ANTIDOTE_RECOMMENDATIONS[caseData.toxidromeClassification] || 'Supportive Care / Activated Charcoal';

    const newCase = new ClinicalToxicology({
      caseId: `TOX-CASE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      ...caseData,
      antidotePrescribed: caseData.antidotePrescribed || recommendedAntidote,
      antidoteAdministered: false,
    });
    return await newCase.save();
  }

  /**
   * Ingests serum toxin laboratory concentration measurements.
   */
  static async ingestSerumToxinLevel(caseId, serumData) {
    const caseDoc = await ClinicalToxicology.findOne({ caseId });
    if (!caseDoc) {
      throw new Error(`Poison control case ${caseId} not found.`);
    }

    caseDoc.serumLevels.push(serumData);

    if (serumData.isToxicThresholdExceeded) {
      caseDoc.triageSeverity = 'CRITICAL_ICU';
    }

    return await caseDoc.save();
  }

  /**
   * Administers specific antidote therapy.
   */
  static async administerAntidote(caseId) {
    const caseDoc = await ClinicalToxicology.findOne({ caseId });
    if (!caseDoc) {
      throw new Error(`Poison control case ${caseId} not found.`);
    }

    caseDoc.antidoteAdministered = true;
    return await caseDoc.save();
  }
}

module.exports = ClinicalToxicologyService;
