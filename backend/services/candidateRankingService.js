const MockInterview = require('../models/MockInterview');
const CandidateRanking = require('../models/CandidateRanking');
const redisService = require('./redisService');

const PARTITIONS = {
  GLOBAL: 'global',
  SKILL: 'skill',
  ROLE: 'role',
};

function redisKey(partitionType, partitionKey) {
  return `candidate-ranking:${partitionType}:${partitionKey}`;
}

function calculatePercentile(rank, total) {
  if (!total) return 0;

  return Number(
    (((total - rank) / total) * 100).toFixed(2)
  );
}

function calculateBenchmark(scores) {
  if (!scores.length) return 0;

  const total = scores.reduce(
    (sum, score) => sum + Number(score),
    0
  );

  return Number((total / scores.length).toFixed(2));
}

function getPartitions(interview) {
  const partitions = [
    {
      type: PARTITIONS.GLOBAL,
      key: 'all',
      score: interview.overallScore,
    },
    {
      type: PARTITIONS.SKILL,
      key: 'technical',
      score: interview.technicalScore,
    },
    {
      type: PARTITIONS.SKILL,
      key: 'communication',
      score: interview.communicationScore,
    },
  ];

  if (interview.jobRole) {
    partitions.push({
      type: PARTITIONS.ROLE,
      key: interview.jobRole.toLowerCase().trim(),
      score: interview.overallScore,
    });
  }

  return partitions.filter(
    (partition) =>
      Number.isFinite(Number(partition.score))
  );
}

/**
 * Incrementally updates only the partitions affected by
 * the newly completed interview.
 */
async function updateCandidateRanking(interview) {
  if (!interview || interview.status !== 'Completed') {
    return [];
  }

  const partitions = getPartitions(interview);
  const results = [];

  for (const partition of partitions) {
    const key = redisKey(
      partition.type,
      partition.key
    );

    await redisService.zadd(
      key,
      Number(partition.score),
      interview.userId
    );

    const ranking = await refreshCandidatePartition(
      interview,
      partition
    );

    results.push(ranking);
  }

  return results;
}

/**
 * Updates only the affected candidate's persistent ranking
 * record. Redis remains the fast ranking source.
 */
async function refreshCandidatePartition(
  interview,
  partition
) {
  const key = redisKey(
    partition.type,
    partition.key
  );

  const rankIndex = await redisService.zrevrank(
    key,
    interview.userId
  );

  const total = await redisService.zcard(key);

  const rank =
    rankIndex === null
      ? null
      : Number(rankIndex) + 1;

  const percentile = calculatePercentile(
    rank,
    total
  );

  const scoresWithMembers =
    await redisService.zrangeWithScores(key);

  const scores = [];

  for (
    let index = 1;
    index < scoresWithMembers.length;
    index += 2
  ) {
    scores.push(Number(scoresWithMembers[index]));
  }

  const benchmark = calculateBenchmark(scores);

  const [record] = await CandidateRanking.findOrCreate({
    where: {
      userId: interview.userId,
      partitionType: partition.type,
      partitionKey: partition.key,
    },
    defaults: {
      interviewId: interview.id,
      score: Number(partition.score),
      rank,
      percentile,
      benchmark,
    },
  });

  await record.update({
    interviewId: interview.id,
    score: Number(partition.score),
    rank,
    percentile,
    benchmark,
  });

  return {
    partitionType: partition.type,
    partitionKey: partition.key,
    userId: interview.userId,
    score: Number(partition.score),
    rank,
    percentile,
    benchmark,
    totalParticipants: total,
  };
}

async function getCandidateRanking({
  partitionType = PARTITIONS.GLOBAL,
  partitionKey = 'all',
  limit = 50,
  currentUserId = null,
}) {
  const key = redisKey(
    partitionType,
    partitionKey
  );

  let entries =
    await redisService.zrangeWithScores(key);

  /*
   * If Redis is empty, rebuild this partition once.
   * Normal requests do not rebuild the entire leaderboard.
   */
  if (!entries.length) {
    await rebuildPartition(
      partitionType,
      partitionKey
    );

    entries =
      await redisService.zrangeWithScores(key);
  }

  const parsed = [];

  for (
    let index = entries.length - 2;
    index >= 0;
    index -= 2
  ) {
    parsed.push({
      userId: entries[index],
      score: Number(entries[index + 1]),
    });
  }

  const limited = parsed
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  let currentUser = null;

  if (currentUserId) {
    const currentIndex =
      await redisService.zrevrank(
        key,
        currentUserId
      );

    if (currentIndex !== null) {
      const currentScore =
        await redisService.zscore(
          key,
          currentUserId
        );

      const total =
        await redisService.zcard(key);

      currentUser = {
        userId: currentUserId,
        score: Number(currentScore),
        rank: Number(currentIndex) + 1,
        percentile: calculatePercentile(
          Number(currentIndex) + 1,
          total
        ),
      };
    }
  }

  const scores = parsed.map(
    (entry) => entry.score
  );

  return {
    partitionType,
    partitionKey,
    entries: limited,
    currentUser,
    totalParticipants: parsed.length,
    benchmark: calculateBenchmark(scores),
    generatedAt: new Date().toISOString(),
  };
}

async function rebuildPartition(
  partitionType,
  partitionKey
) {
  let where = {
    status: 'Completed',
  };

  if (partitionType === PARTITIONS.ROLE) {
    where.jobRole = partitionKey;
  }

  const interviews =
    await MockInterview.findAll({
      where,
      attributes: [
        'id',
        'userId',
        'jobRole',
        'overallScore',
        'technicalScore',
        'communicationScore',
        'completedAt',
      ],
      order: [
        ['completedAt', 'DESC'],
      ],
    });

  /*
   * Keep only the latest evaluation for each candidate.
   */
  const latestByUser = new Map();

  for (const interview of interviews) {
    if (!latestByUser.has(interview.userId)) {
      latestByUser.set(
        interview.userId,
        interview
      );
    }
  }

  for (const interview of latestByUser.values()) {
    const partitions =
      getPartitions(interview);

    const partition =
      partitions.find(
        (item) =>
          item.type === partitionType &&
          item.key === partitionKey
      );

    if (!partition) continue;

    await redisService.zadd(
      redisKey(
        partitionType,
        partitionKey
      ),
      Number(partition.score),
      interview.userId
    );
  }

  return latestByUser.size;
}

/**
 * Compares the incremental cache against the
 * latest completed interview data.
 */
async function validatePartition(
  partitionType,
  partitionKey
) {
  const key = redisKey(
    partitionType,
    partitionKey
  );

  const cached =
    await redisService.zrangeWithScores(key);

  const before = cached.length;

  await rebuildPartition(
    partitionType,
    partitionKey
  );

  const rebuilt =
    await redisService.zrangeWithScores(key);

  const after = rebuilt.length;

  const cacheMap = new Map();

  for (
    let index = 0;
    index < rebuilt.length;
    index += 2
  ) {
    cacheMap.set(
      rebuilt[index],
      Number(rebuilt[index + 1])
    );
  }

  const consistent =
    before === after &&
    cached.every(
      (value, index) =>
        value === rebuilt[index]
    );

  return {
    partitionType,
    partitionKey,
    consistent,
    participants: cacheMap.size,
    checkedAt: new Date().toISOString(),
  };
}

module.exports = {
  PARTITIONS,
  updateCandidateRanking,
  getCandidateRanking,
  rebuildPartition,
  validatePartition,
  calculateBenchmark,
};