const crypto = require('crypto');
const astAnalysisService = require('./astAnalysisService');

class PlagiarismService {
  constructor() {
    this.kGramSize = 5; // Size of token sub-sequences
    this.windowSize = 4; // Winnowing window size
  }

  /**
   * Generates Winnowing fingerprints from code tokens
   */
  generateFingerprint(tokens) {
    if (tokens.length < this.kGramSize) {
      return [this.hashString(tokens.join('_'))];
    }

    const hashes = [];
    for (let i = 0; i <= tokens.length - this.kGramSize; i++) {
      const kgram = tokens.slice(i, i + this.kGramSize).join('_');
      hashes.push({ hash: this.hashString(kgram), pos: i });
    }

    // Winnowing algorithm: select minimum hash in each window
    const fingerprints = new Set();
    for (let i = 0; i <= hashes.length - this.windowSize; i++) {
      const window = hashes.slice(i, i + this.windowSize);
      let minHashObj = window[0];
      for (let j = 1; j < window.length; j++) {
        if (window[j].hash <= minHashObj.hash) {
          minHashObj = window[j];
        }
      }
      fingerprints.add(minHashObj.hash);
    }

    return Array.from(fingerprints);
  }

  hashString(str) {
    return crypto.createHash('md5').update(str).digest('hex').substring(0, 12);
  }

  /**
   * Computes Jaccard Similarity index between two fingerprint sets
   */
  calculateSimilarity(fpA = [], fpB = []) {
    if (fpA.length === 0 || fpB.length === 0) return 0;

    const setA = new Set(fpA);
    const setB = new Set(fpB);

    let intersection = 0;
    setA.forEach((hash) => {
      if (setB.has(hash)) intersection++;
    });

    const union = setA.size + setB.size - intersection;
    if (union === 0) return 0;

    const similarity = (intersection / union) * 100;
    return parseFloat(similarity.toFixed(2));
  }

  /**
   * Compares source code against a corpus of historical submissions
   */
  compareAgainstCorpus(newCode, historicalSubmissions = []) {
    const tokensA = astAnalysisService.abstractTokens(newCode);
    const fpA = this.generateFingerprint(tokensA);

    const matches = [];

    historicalSubmissions.forEach((sub) => {
      const similarity = this.calculateSimilarity(fpA, sub.tokenFingerprint || []);
      if (similarity > 20) { // Threshold for reporting
        matches.push({
          submissionId: sub.id,
          userId: sub.userId,
          similarityPercentage: similarity,
          flagged: similarity >= 75,
        });
      }
    });

    matches.sort((a, b) => b.similarityPercentage - a.similarityPercentage);

    return {
      fingerprint: fpA,
      tokenCount: tokensA.length,
      highestSimilarity: matches[0]?.similarityPercentage || 0,
      matches,
    };
  }
}

module.exports = new PlagiarismService();
