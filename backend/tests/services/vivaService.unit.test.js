const { generateFirstQuestion, generateFollowUp, generateFinalScorecard } = require('../../services/vivaService');

describe('vivaService Unit Tests', () => {
  describe('generateFirstQuestion', () => {
    it('returns a technical introductory question prompt', async () => {
      const q = await generateFirstQuestion('Operating Systems');
      expect(typeof q).toBe('string');
      expect(q.length).toBeGreaterThan(5);
    });
  });

  describe('generateFollowUp', () => {
    it('generates next technical query based on previous transcript answers', async () => {
      const mockTurns = [
        { speaker: 'AI', text: 'Explain CPU scheduling algorithms.' },
        { speaker: 'student', text: 'We use round robin and first come first serve.' }
      ];
      const q = await generateFollowUp('Operating Systems', mockTurns, 'We use round robin and first come first serve.');
      expect(typeof q).toBe('string');
      expect(q.length).toBeGreaterThan(5);
    });
  });

  describe('generateFinalScorecard', () => {
    it('analyzes transcript exchanges to produce structured evaluation rubrics', async () => {
      const mockTurns = [
        { speaker: 'AI', text: 'Explain CPU scheduling algorithms.' },
        { speaker: 'student', text: 'We use round robin and first come first serve.' },
        { speaker: 'AI', text: 'What is the downside of Round Robin scheduling?' },
        { speaker: 'student', text: 'High context switching overhead if time quantum is too small.' }
      ];

      const result = await generateFinalScorecard('Operating Systems', mockTurns);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('conceptualDepth');
      expect(result).toHaveProperty('technicalAccuracy');
      expect(result).toHaveProperty('communicationClarity');
      expect(result).toHaveProperty('feedback');
      expect(result).toHaveProperty('masteryBreakdown');
      expect(Array.isArray(result.masteryBreakdown)).toBe(true);
    });
  });
});
