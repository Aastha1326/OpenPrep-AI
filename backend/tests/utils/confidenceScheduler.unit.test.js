const {
  adjustIntervalByConfidence,
} = require('../../utils/confidenceScheduler');

describe('Confidence-aware spaced repetition scheduler', () => {
  describe('confidence interval adjustments', () => {
    it('should increase the interval for very confident answers', () => {
      expect(
        adjustIntervalByConfidence({
          interval: 10,
          confidence: 'very_confident',
        })
      ).toBe(12);
    });

    it('should reduce the interval for very unsure answers', () => {
      expect(
        adjustIntervalByConfidence({
          interval: 10,
          confidence: 'very_unsure',
        })
      ).toBe(7);
    });

    it('should use a smaller reduction for unsure answers', () => {
      expect(
        adjustIntervalByConfidence({
          interval: 10,
          confidence: 'unsure',
        })
      ).toBe(9);
    });

    it('should keep the interval unchanged for confident answers', () => {
      expect(
        adjustIntervalByConfidence({
          interval: 10,
          confidence: 'confident',
        })
      ).toBe(10);
    });
  });

  describe('optional confidence', () => {
    it('should preserve the original interval when confidence is omitted', () => {
      expect(
        adjustIntervalByConfidence({
          interval: 10,
        })
      ).toBe(10);
    });

    it('should preserve the original interval for an invalid confidence value', () => {
      expect(
        adjustIntervalByConfidence({
          interval: 10,
          confidence: 'unknown',
        })
      ).toBe(10);
    });
  });

  describe('minimum interval', () => {
    it('should never return an interval below one day', () => {
      expect(
        adjustIntervalByConfidence({
          interval: 1,
          confidence: 'very_unsure',
        })
      ).toBe(1);
    });

    it('should reject a zero interval', () => {
      expect(() =>
        adjustIntervalByConfidence({
          interval: 0,
          confidence: 'confident',
        })
      ).toThrow('interval must be a positive number');
    });

    it('should reject a negative interval', () => {
      expect(() =>
        adjustIntervalByConfidence({
          interval: -5,
          confidence: 'confident',
        })
      ).toThrow('interval must be a positive number');
    });
  });
});
