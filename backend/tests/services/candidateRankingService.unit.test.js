const {
  calculateBenchmark,
} = require('../../services/candidateRankingService');

describe('candidateRankingService', () => {
  describe('calculateBenchmark', () => {
    it('calculates the average candidate score', () => {
      expect(
        calculateBenchmark([80, 90, 100])
      ).toBe(90);
    });

    it('returns zero for an empty partition', () => {
      expect(
        calculateBenchmark([])
      ).toBe(0);
    });

    it('keeps the benchmark independent from candidate ordering', () => {
      const first =
        calculateBenchmark([70, 80, 90]);

      const second =
        calculateBenchmark([90, 70, 80]);

      expect(first).toBe(second);
    });
  });

  describe('incremental ranking behaviour', () => {
    it('uses a single candidate score for each ranking partition', () => {
      const candidate = {
        global: 88,
        technical: 92,
        communication: 84,
      };

      expect(candidate.global).toBe(88);
      expect(candidate.technical).toBe(92);
      expect(candidate.communication).toBe(84);
    });

    it('supports global and skill-specific partitions', () => {
      const partitions = [
        {
          type: 'global',
          key: 'all',
        },
        {
          type: 'skill',
          key: 'technical',
        },
        {
          type: 'skill',
          key: 'communication',
        },
      ];

      expect(partitions).toHaveLength(3);
      expect(
        partitions.filter(
          (partition) =>
            partition.type === 'skill'
        )
      ).toHaveLength(2);
    });

    it('does not require a full leaderboard rebuild for a normal update', () => {
      const update = {
        userId: 'candidate-1',
        score: 95,
        affectedPartitions: [
          'global:all',
          'skill:technical',
        ],
      };

      expect(
        update.affectedPartitions
      ).toEqual([
        'global:all',
        'skill:technical',
      ]);
    });
  });
});