/**
 * Spaced Repetition & Retention Modeling Service
 * Implements Ebbinghaus Forgetting Curve and FSRS stability calculations
 */

class RetentionService {
  /**
   * Calculates retention percentage using Ebbinghaus decay formula:
   * R = e^(-t / S)
   * @param {number} daysElapsed - Time elapsed since last active recall session (days)
   * @param {number} stability - Memory stability factor in days (higher = slower decay)
   * @returns {number} Retention percentage (0 to 100)
   */
  calculateRetention(daysElapsed, stability = 5) {
    if (stability <= 0) return 0;
    if (daysElapsed <= 0) return 100;
    const r = Math.exp(-daysElapsed / stability) * 100;
    return parseFloat(Math.min(100, Math.max(0, r)).toFixed(2));
  }

  /**
   * Computes optimal next review timestamp targeting desired retention rate (default 85%)
   * Formula: t = -S * ln(R_target)
   */
  getOptimalReviewTime(stability = 5, targetRetention = 0.85) {
    const safeTarget = Math.min(0.99, Math.max(0.01, targetRetention));
    const daysUntilReview = -stability * Math.log(safeTarget);
    const msUntilReview = daysUntilReview * 24 * 60 * 60 * 1000;
    return new Date(Date.now() + msUntilReview);
  }

  /**
   * Generates a 14-day future decay projection curve across subjects
   */
  generateSubjectDecayProjections(subjects = []) {
    const defaultSubjects = subjects.length > 0 ? subjects : [
      { name: 'Computer Networks', stability: 7, lastReviewedDaysAgo: 2 },
      { name: 'Algorithms & Complexity', stability: 4, lastReviewedDaysAgo: 5 },
      { name: 'Database Architecture', stability: 12, lastReviewedDaysAgo: 1 },
    ];

    return defaultSubjects.map((sub) => {
      const curve = [];
      for (let day = 0; day <= 14; day++) {
        const totalElapsed = sub.lastReviewedDaysAgo + day;
        curve.push({
          day: `+${day}d`,
          retention: this.calculateRetention(totalElapsed, sub.stability),
        });
      }

      const currentRetention = this.calculateRetention(sub.lastReviewedDaysAgo, sub.stability);
      const isUrgent = currentRetention < 60;

      return {
        subject: sub.name,
        stability: sub.stability,
        currentRetention,
        isUrgent,
        optimalNextReview: this.getOptimalReviewTime(sub.stability),
        curve,
      };
    });
  }

  /**
   * Updates card stability based on recall grade (0: Blackout, 1: Hard, 2: Good, 3: Easy)
   */
  updateStability(currentStability = 2.5, grade = 2) {
    switch (grade) {
      case 0: // Total recall failure
        return Math.max(1, currentStability * 0.4);
      case 1: // Hard recall
        return Math.max(1.2, currentStability * 0.9);
      case 2: // Good recall
        return currentStability * 1.5;
      case 3: // Easy recall
        return currentStability * 2.2;
      default:
        return currentStability;
    }
  }
}

module.exports = new RetentionService();
