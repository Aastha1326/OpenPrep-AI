const { evaluateGrammarAndSymmetry, evaluateClueLeakage, evaluateDistractors } = require('../services/distractorScorerService');

describe('Distractor Scorer Service', () => {
  test('evaluateGrammarAndSymmetry detects length variance and formatting', () => {
    const options = [
      'Short choice',
      'Another short choice',
      'This is an extraordinarily long choice that goes into immense detail with extra explanation compared to all other options',
      'Third choice'
    ];
    const result = evaluateGrammarAndSymmetry(options, 2);
    expect(result.symmetryScore).toBeLessThan(100);
    expect(result.outlierWarning).toBeDefined();
  });

  test('evaluateClueLeakage flags dead giveaway absolute terms', () => {
    const options = [
      'Normal choice',
      'Option with always true statement',
      'Option with never happen statement',
      'Valid choice'
    ];
    const result = evaluateClueLeakage(options);
    expect(result.clueLeakageScore).toBeLessThan(100);
    expect(result.optionLeakage[1].flaggedTerms).toContain('always');
    expect(result.optionLeakage[2].flaggedTerms).toContain('never');
  });

  test('evaluateDistractors produces complete evaluation report', async () => {
    const payload = {
      question: 'What is the value of 5 * -2?',
      options: ['-10', '10', '3', '-3'],
      correctAnswerIndex: 0,
      context: 'Mathematics'
    };
    const evaluation = await evaluateDistractors(payload);
    expect(evaluation.overallQualityScore).toBeGreaterThan(0);
    expect(evaluation.metrics).toHaveProperty('plausibilityScore');
    expect(evaluation.metrics).toHaveProperty('symmetryScore');
    expect(evaluation.metrics).toHaveProperty('clueLeakageScore');
    expect(Array.isArray(evaluation.optionEvaluations)).toBe(true);
    expect(evaluation.optionEvaluations).toHaveLength(4);
  });
});
