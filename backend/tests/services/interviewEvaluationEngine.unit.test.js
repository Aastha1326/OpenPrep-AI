const {
  evaluateInterview,
} = require('../../services/interviewEvaluationEngine');

describe('Versioned Interview Evaluation Engine', () => {
  const versionOne = {
    version: '1.0',
    weights: {
      technical: 0.5,
      communication: 0.3,
      confidence: 0.2,
    },
    rubric: {
      technical: {
        baseScore: 50,
        responseCountBonus: 5,
        averageWordsBonus: 0.2,
      },
      communication: {
        baseScore: 40,
        averageWordsBonus: 0.5,
      },
      confidence: {
        fallbackScore: 50,
      },
    },
    rules: {
      minScore: 0,
      maxScore: 100,
      feedback: 'Version 1 feedback',
    },
  };

  const versionTwo = {
    ...versionOne,
    version: '2.0',
    weights: {
      technical: 0.7,
      communication: 0.2,
      confidence: 0.1,
    },
  };

  const transcript = [
    { role: 'ai', text: 'Tell me about your project.' },
    {
      role: 'user',
      text: 'I designed the backend API and improved database query performance.',
    },
  ];

  it('produces deterministic scores for the same version', async () => {
    const first = await evaluateInterview(
      transcript,
      [80],
      versionOne
    );

    const second = await evaluateInterview(
      transcript,
      [80],
      versionOne
    );

    expect(first).toEqual(second);
  });

  it('allows multiple evaluation versions to coexist', async () => {
    const firstVersion = await evaluateInterview(
      transcript,
      [80],
      versionOne
    );

    const secondVersion = await evaluateInterview(
      transcript,
      [80],
      versionTwo
    );

    expect(firstVersion.overallScore).not.toBe(
      secondVersion.overallScore
    );
  });

  it('does not mutate the original evaluation version', async () => {
    const originalWeights = JSON.stringify(versionOne.weights);

    await evaluateInterview(
      transcript,
      [80],
      versionOne
    );

    expect(JSON.stringify(versionOne.weights)).toBe(originalWeights);
  });
});