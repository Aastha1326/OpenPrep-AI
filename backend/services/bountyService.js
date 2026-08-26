/**
 * @fileoverview Bounty & Upvoting Engine Service.
 * Manages posting XP study bounties, community solution submissions, upvoting/downvoting,
 * solution acceptance with XP disbursement, and awarding "Verified Solution" badges.
 */

const { Bounty, BountySolution, BountySolutionVote, User, UserBadge, Badge } = require('../models');
const { addXP } = require('./xpService');

/**
 * Creates a new Question Bounty and locks the XP bounty from the author's balance.
 */
async function createBounty({ authorId, title, description, subject = 'General', bountyXP = 50 }) {
  if (!authorId || !title || !description) {
    throw new Error('Author ID, title, and description are required.');
  }

  const xpValue = parseInt(bountyXP, 10) || 50;
  if (xpValue < 10 || xpValue > 5000) {
    throw new Error('Bounty XP must be between 10 and 5000 XP.');
  }

  const author = await User.findByPk(authorId);
  if (!author) {
    throw new Error('Author user not found.');
  }

  if ((author.xp || 0) < xpValue) {
    throw new Error(`Insufficient XP balance. You have ${author.xp || 0} XP, but bounty requires ${xpValue} XP.`);
  }

  // Deduct XP bounty from author's balance
  author.xp = (author.xp || 0) - xpValue;
  await author.save();

  const bounty = await Bounty.create({
    authorId,
    title: title.trim(),
    description: description.trim(),
    subject: subject || 'General',
    bountyXP: xpValue,
    status: 'OPEN'
  });

  return bounty;
}

/**
 * Lists bounties with filtering and solution counts.
 */
async function getBounties({ status = 'OPEN', subject, limit = 20, offset = 0 }) {
  const whereClause = {};
  if (status && ['OPEN', 'SOLVED', 'CANCELLED'].includes(status)) {
    whereClause.status = status;
  }
  if (subject) {
    whereClause.subject = subject;
  }

  const { count, rows } = await Bounty.findAndCountAll({
    where: whereClause,
    limit: Math.min(Math.max(1, parseInt(limit, 10) || 20), 50),
    offset: Math.max(0, parseInt(offset, 10) || 0),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'avatar']
      },
      {
        model: User,
        as: 'winner',
        attributes: ['id', 'name', 'avatar']
      },
      {
        model: BountySolution,
        as: 'solutions',
        attributes: ['id', 'authorId', 'upvotesCount', 'isAccepted']
      }
    ]
  });

  return {
    total: count,
    bounties: rows
  };
}

/**
 * Gets full details of a specific bounty along with solutions.
 */
async function getBountyById(bountyId) {
  const bounty = await Bounty.findByPk(bountyId, {
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'avatar']
      },
      {
        model: User,
        as: 'winner',
        attributes: ['id', 'name', 'avatar']
      },
      {
        model: BountySolution,
        as: 'solutions',
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'avatar']
          }
        ]
      }
    ],
    order: [[{ model: BountySolution, as: 'solutions' }, 'isAccepted', 'DESC'], [{ model: BountySolution, as: 'solutions' }, 'upvotesCount', 'DESC']]
  });

  if (!bounty) {
    throw new Error('Bounty not found.');
  }

  return bounty;
}

/**
 * Submits a community solution for a bounty.
 */
async function submitSolution({ bountyId, authorId, content }) {
  if (!bountyId || !authorId || !content) {
    throw new Error('Bounty ID, author ID, and content are required.');
  }

  const bounty = await Bounty.findByPk(bountyId);
  if (!bounty) {
    throw new Error('Bounty not found.');
  }

  if (bounty.status !== 'OPEN') {
    throw new Error('Cannot submit solutions to a closed or solved bounty.');
  }

  const solution = await BountySolution.create({
    bountyId,
    authorId,
    content: content.trim(),
    upvotesCount: 0,
    downvotesCount: 0,
    isAccepted: false
  });

  return solution;
}

/**
 * Upvotes or downvotes a community solution.
 */
async function voteSolution({ solutionId, userId, voteType }) {
  if (!solutionId || !userId || !['UP', 'DOWN'].includes(voteType)) {
    throw new Error('Solution ID, User ID, and voteType ("UP" or "DOWN") are required.');
  }

  const solution = await BountySolution.findByPk(solutionId);
  if (!solution) {
    throw new Error('Solution not found.');
  }

  const existingVote = await BountySolutionVote.findOne({
    where: { solutionId, userId }
  });

  if (existingVote) {
    if (existingVote.voteType === voteType) {
      // Toggle off vote if clicked same type again
      await existingVote.destroy();
    } else {
      // Update vote type
      existingVote.voteType = voteType;
      await existingVote.save();
    }
  } else {
    // Create new vote
    await BountySolutionVote.create({ solutionId, userId, voteType });
  }

  // Recalculate upvote/downvote totals for solution
  const upvotesCount = await BountySolutionVote.count({ where: { solutionId, voteType: 'UP' } });
  const downvotesCount = await BountySolutionVote.count({ where: { solutionId, voteType: 'DOWN' } });

  solution.upvotesCount = upvotesCount;
  solution.downvotesCount = downvotesCount;
  await solution.save();

  return {
    solutionId,
    upvotesCount,
    downvotesCount
  };
}

/**
 * Accepts a solution, transfers XP bounty to the answer author, and awards "Verified Solution" badge.
 */
async function acceptSolution({ bountyId, authorId, solutionId }) {
  if (!bountyId || !authorId || !solutionId) {
    throw new Error('Bounty ID, author ID, and Solution ID are required.');
  }

  const bounty = await Bounty.findByPk(bountyId);
  if (!bounty) {
    throw new Error('Bounty not found.');
  }

  if (bounty.authorId !== authorId) {
    throw new Error('Only the bounty author can accept a solution.');
  }

  if (bounty.status !== 'OPEN') {
    throw new Error('Bounty is already solved or closed.');
  }

  const solution = await BountySolution.findOne({
    where: { id: solutionId, bountyId }
  });

  if (!solution) {
    throw new Error('Solution not found for this bounty.');
  }

  const winningUser = await User.findByPk(solution.authorId);
  if (!winningUser) {
    throw new Error('Winning solution author user record not found.');
  }

  // Mark solution as accepted
  solution.isAccepted = true;
  await solution.save();

  // Update bounty status
  bounty.status = 'SOLVED';
  bounty.winnerId = solution.authorId;
  bounty.acceptedSolutionId = solution.id;
  await bounty.save();

  // Disburse XP bounty to winning author
  const xpReward = await addXP(winningUser, bounty.bountyXP);

  // Find or create "Verified Solution" Badge
  let [verifiedBadge] = await Badge.findOrCreate({
    where: { name: 'Verified Solution' },
    defaults: {
      name: 'Verified Solution',
      description: 'Answered a peer study bounty accepted as the official solution.',
      icon: '🏆',
      category: 'BOUNTY'
    }
  });

  // Award badge to winner
  if (verifiedBadge) {
    await UserBadge.findOrCreate({
      where: {
        userId: winningUser.id,
        badgeId: verifiedBadge.id
      }
    });
  }

  return {
    bountyId: bounty.id,
    solutionId: solution.id,
    winnerId: winningUser.id,
    bountyXP: bounty.bountyXP,
    winnerXP: xpReward
  };
}

module.exports = {
  createBounty,
  getBounties,
  getBountyById,
  submitSolution,
  voteSolution,
  acceptSolution
};
