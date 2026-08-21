/**
 * Neonatal Intensive Care Unit (NICU) Telemetry Engine Service.
 * Analyzes infant vital streams for bradycardia, oxygen desaturation,
 * apnea episodes, and triggers incubator phototherapy/surfactant interventions.
 */

const ClinicalNICU = require('../models/ClinicalNICUModel');

class ClinicalNICUService {
  /**
   * Registers a new incubator telemetry monitor in the NICU.
   */
  static async registerIncubator(incubatorData) {
    const newIncubator = new ClinicalNICU({
      incubatorId: `NICU-INC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      ...incubatorData,
      alarmStatus: 'STABLE',
    });
    return await newIncubator.save();
  }

  /**
   * Ingests real-time neonatal vitals and evaluates clinical alert thresholds.
   */
  static async ingestVitalsStream(incubatorId, vitalsData) {
    const incubator = await ClinicalNICU.findOne({ incubatorId });
    if (!incubator) {
      throw new Error(`Incubator ${incubatorId} not found.`);
    }

    incubator.vitalsHistory.push(vitalsData);

    // Clinical threshold evaluation
    if (vitalsData.apneaEpisodeSeconds >= 20 || vitalsData.heartRateBpm < 80) {
      incubator.alarmStatus = 'APNEA_ALERT';
    } else if (vitalsData.spo2Percentage < 88) {
      incubator.alarmStatus = 'DESATURATION_CRITICAL';
    } else if (vitalsData.heartRateBpm < 100) {
      incubator.alarmStatus = 'BRADYCARDIA_WARNING';
    } else {
      incubator.alarmStatus = 'STABLE';
    }

    return await incubator.save();
  }

  /**
   * Toggles phototherapy treatment for hyperbilirubinemia.
   */
  static async togglePhototherapy(incubatorId, activeState) {
    const incubator = await ClinicalNICU.findOne({ incubatorId });
    if (!incubator) {
      throw new Error(`Incubator ${incubatorId} not found.`);
    }

    incubator.phototherapyActive = activeState;
    return await incubator.save();
  }

  /**
   * Logs exogenous surfactant administration for respiratory distress syndrome.
   */
  static async recordSurfactantAdministration(incubatorId) {
    const incubator = await ClinicalNICU.findOne({ incubatorId });
    if (!incubator) {
      throw new Error(`Incubator ${incubatorId} not found.`);
    }

    incubator.surfactantAdministered = true;
    return await incubator.save();
  }
}

module.exports = ClinicalNICUService;
