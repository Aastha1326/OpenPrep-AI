const { Op } = require('sequelize');
const Topic = require('../models/Topic');
const SkillDependency = require('../models/SkillDependency');

function buildGraph(topics, dependencies) {
  const nodes = topics.map((topic) => ({
    id: topic.id,
    label: topic.name,
    subjectName: topic.subjectRef?.name || 'General Subject',
    status: topic.status,
    weightage: topic.weightage || 0,
  }));

  const edges = dependencies.map((dependency) => ({
    id: dependency.id,
    source: dependency.prerequisiteSkillId,
    target: dependency.skillId,
    dependencyType: dependency.dependencyType,
    weight: dependency.weight,
  }));

  return { nodes, edges };
}

function findRootCauseGaps(gaps, dependencies) {
  const gapMap = new Map(
    gaps.map((gap) => [gap.topicId, gap])
  );

  const prerequisiteMap = new Map();

  for (const dependency of dependencies) {
    if (!prerequisiteMap.has(dependency.skillId)) {
      prerequisiteMap.set(dependency.skillId, []);
    }

    prerequisiteMap
      .get(dependency.skillId)
      .push(dependency.prerequisiteSkillId);
  }

  const rootCauses = [];

  for (const gap of gaps) {
    const prerequisites = prerequisiteMap.get(gap.topicId) || [];

    const hasUnresolvedPrerequisite = prerequisites.some(
      (prerequisiteId) => {
        const prerequisite = gapMap.get(prerequisiteId);

        return (
          prerequisite &&
          prerequisite.masteryStatus !== 'mastered'
        );
      }
    );

    if (!hasUnresolvedPrerequisite) {
      rootCauses.push({
        ...gap,
        isRootCause: true,
        dependencyDepth: 0,
      });
    }
  }

  return rootCauses;
}

function dependencyAwareOrder(gaps, dependencies) {
  const gapMap = new Map(
    gaps.map((gap) => [gap.topicId, gap])
  );

  const prerequisites = new Map();

  for (const dependency of dependencies) {
    if (!gapMap.has(dependency.skillId)) continue;
    if (!gapMap.has(dependency.prerequisiteSkillId)) continue;

    if (!prerequisites.has(dependency.skillId)) {
      prerequisites.set(dependency.skillId, []);
    }

    prerequisites
      .get(dependency.skillId)
      .push(dependency.prerequisiteSkillId);
  }

  const visited = new Set();
  const visiting = new Set();
  const ordered = [];

  function visit(topicId) {
    if (visited.has(topicId)) return;

    // Ignore circular dependency data rather than blocking
    // the complete learning path.
    if (visiting.has(topicId)) return;

    visiting.add(topicId);

    for (const prerequisiteId of prerequisites.get(topicId) || []) {
      visit(prerequisiteId);
    }

    visiting.delete(topicId);
    visited.add(topicId);

    if (gapMap.has(topicId)) {
      ordered.push(gapMap.get(topicId));
    }
  }

  for (const gap of gaps) {
    visit(gap.topicId);
  }

  return ordered;
}

async function getSkillGraph(userId) {
  const topics = await Topic.findAll({
    where: { user: userId },
    include: [
      {
        association: 'subjectRef',
        attributes: ['name'],
      },
    ],
    order: [['name', 'ASC']],
  });

  const topicIds = topics.map((topic) => topic.id);

  if (!topicIds.length) {
    return {
      nodes: [],
      edges: [],
      rootCauseGaps: [],
    };
  }

  const dependencies = await SkillDependency.findAll({
    where: {
      [Op.or]: [
        { skillId: { [Op.in]: topicIds } },
        { prerequisiteSkillId: { [Op.in]: topicIds } },
      ],
    },
  });

  const graph = buildGraph(topics, dependencies);

  const gaps = topics
    .filter((topic) => topic.status !== 'Strong')
    .map((topic) => ({
      topicId: topic.id,
      topicName: topic.name,
      masteryStatus:
        topic.status === 'Weak'
          ? 'weak'
          : 'developing',
      gapScore:
        topic.status === 'Weak'
          ? 100
          : 40,
    }));

  return {
    ...graph,
    rootCauseGaps: findRootCauseGaps(gaps, dependencies),
  };
}

async function resolveLearningOrder(userId, gaps) {
  const topicIds = gaps.map((gap) => gap.topicId);

  if (!topicIds.length) {
    return [];
  }

  const dependencies = await SkillDependency.findAll({
    where: {
      [Op.or]: [
        { skillId: { [Op.in]: topicIds } },
        { prerequisiteSkillId: { [Op.in]: topicIds } },
      ],
    },
  });

  return dependencyAwareOrder(gaps, dependencies);
}

async function addDependency({
  skillId,
  prerequisiteSkillId,
  dependencyType = 'prerequisite',
  weight = 1,
}) {
  if (skillId === prerequisiteSkillId) {
    throw new Error('A skill cannot depend on itself');
  }

  return SkillDependency.create({
    skillId,
    prerequisiteSkillId,
    dependencyType,
    weight,
  });
}

module.exports = {
  buildGraph,
  findRootCauseGaps,
  dependencyAwareOrder,
  getSkillGraph,
  resolveLearningOrder,
  addDependency,
};