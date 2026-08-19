class ClinicalMicrobiologyModel {
  constructor(cultureData = {}) {
    this.cultureId = cultureData.cultureId || `mic_${Math.random().toString(36).substr(2, 9)}`;
    this.organismIdentified = cultureData.organismIdentified || 'Staphylococcus aureus';
    this.specimenSource = cultureData.specimenSource || 'Blood Culture';
    this.gramStain = cultureData.gramStain || 'Gram-Positive Cocci';
    this.isMDRO = cultureData.isMDRO ?? true;
    this.createdAt = cultureData.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      cultureId: this.cultureId,
      organismIdentified: this.organismIdentified,
      specimenSource: this.specimenSource,
      gramStain: this.gramStain,
      isMDRO: this.isMDRO,
      createdAt: this.createdAt,
    };
  }
}

module.exports = ClinicalMicrobiologyModel;
