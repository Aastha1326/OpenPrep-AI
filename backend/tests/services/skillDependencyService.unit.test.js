const {
  findRootCauseGaps,
  dependencyAwareOrder,
} = require('../../services/skillDependencyService');

describe('Skill Dependency Engine', () => {
  const gaps = [
    {
      topicId: 'javascript',
      topicName: 'JavaScript',
      masteryStatus: 'weak',
      gapScore: 80,
    },
    {
      topicId: 'react',
      topicName: 'React',
      masteryStatus: 'weak',
      gapScore: 95,
    },
    {
      topicId: 'nextjs',
      topicName: 'Next.js',
      masteryStatus: 'weak',
      gapScore: 90,
    },
  ];

  const dependencies = [
    {
      skillId: 'react',
      prerequisiteSkillId: 'javascript',
      dependencyType: 'prerequisite',
      weight: 1,
    },
    {
      skillId: 'nextjs',
      prerequisiteSkillId: 'react',
      dependencyType: 'prerequisite',
      weight: 1,
    },
  ];

  it('identifies the root prerequisite gap', () => {
    const roots = findRootCauseGaps(
      gaps,
      dependencies
    );

    expect(
      roots.map((gap) => gap.topicId)
    ).toEqual(['javascript']);
  });

  it('places prerequisites before dependent skills', () => {
    const ordered = dependencyAwareOrder(
      gaps,
      dependencies
    );

    expect(
      ordered.map((gap) => gap.topicId)
    ).toEqual([
      'javascript',
      'react',
      'nextjs',
    ]);
  });

  it('keeps independent gaps in the learning path', () => {
    const independentGap = {
      topicId: 'git',
      topicName: 'Git',
      masteryStatus: 'weak',
      gapScore: 70,
    };

    const ordered = dependencyAwareOrder(
      [...gaps, independentGap],
      dependencies
    );

    expect(
      ordered.map((gap) => gap.topicId)
    ).toContain('git');
  });

  it('does not get stuck on circular dependency data', () => {
    const circularDependencies = [
      {
        skillId: 'javascript',
        prerequisiteSkillId: 'react',
      },
      {
        skillId: 'react',
        prerequisiteSkillId: 'javascript',
      },
    ];

    const ordered = dependencyAwareOrder(
      gaps.slice(0, 2),
      circularDependencies
    );

    expect(ordered).toHaveLength(2);
  });
});