const bountyService = require('../services/bountyService');
const { Bounty, BountySolution, User } = require('../models');

describe('Bounty Service', () => {
  let author, solver;

  beforeAll(async () => {
    author = await User.create({
      name: 'Bounty Author',
      email: `bountyauthor_${Date.now()}@test.com`,
      xp: 1000,
    });

    solver = await User.create({
      name: 'Bounty Solver',
      email: `bountysolver_${Date.now()}@test.com`,
      xp: 200,
    });
  });

  test('createBounty deducts XP and creates OPEN bounty', async () => {
    const bounty = await bountyService.createBounty({
      authorId: author.id,
      title: 'How to solve 2nd order differential equations?',
      description: 'Need step by step derivation for characteristic equation method.',
      subject: 'Math',
      bountyXP: 100,
    });

    expect(bounty.id).toBeDefined();
    expect(bounty.status).toBe('OPEN');
    expect(bounty.bountyXP).toBe(100);

    const updatedAuthor = await User.findByPk(author.id);
    expect(updatedAuthor.xp).toBe(900); // 1000 - 100
  });

  test('submitSolution creates community solution', async () => {
    const bounties = await bountyService.getBounties({ status: 'OPEN' });
    const targetBounty = bounties.bounties[0];

    const solution = await bountyService.submitSolution({
      bountyId: targetBounty.id,
      authorId: solver.id,
      content: 'Assume y = e^(rx), substitute into homogeneous equation to get characteristic polynomial r^2 + ar + b = 0.',
    });

    expect(solution.id).toBeDefined();
    expect(solution.isAccepted).toBe(false);
    expect(solution.upvotesCount).toBe(0);
  });

  test('acceptSolution transfers XP and marks bounty as SOLVED', async () => {
    const bounties = await bountyService.getBounties({ status: 'OPEN' });
    const targetBounty = bounties.bounties[0];
    const bountyDetails = await bountyService.getBountyById(targetBounty.id);
    const solution = bountyDetails.solutions[0];

    const result = await bountyService.acceptSolution({
      bountyId: targetBounty.id,
      authorId: author.id,
      solutionId: solution.id,
    });

    expect(result.bountyId).toBe(targetBounty.id);
    expect(result.winnerId).toBe(solver.id);

    const updatedSolver = await User.findByPk(solver.id);
    expect(updatedSolver.xp).toBe(300); // 200 + 100 XP bounty transferred
  });
});
