const bountyService = require('../services/bountyService');

// @desc    Create a new question XP bounty
// @route   POST /api/bounties
// @access  Private
exports.createBounty = async (req, res, next) => {
  try {
    const { title, description, subject, bountyXP } = req.body;
    const authorId = req.user.id;

    const bounty = await bountyService.createBounty({
      authorId,
      title,
      description,
      subject,
      bountyXP
    });

    res.status(201).json({
      success: true,
      data: bounty
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of study bounties
// @route   GET /api/bounties
// @access  Public / Private
exports.getBounties = async (req, res, next) => {
  try {
    const { status, subject, limit, offset } = req.query;

    const result = await bountyService.getBounties({
      status,
      subject,
      limit,
      offset
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bounty details and solutions
// @route   GET /api/bounties/:id
// @access  Public / Private
exports.getBountyDetails = async (req, res, next) => {
  try {
    const bountyId = req.params.id;

    const bounty = await bountyService.getBountyById(bountyId);

    res.status(200).json({
      success: true,
      data: bounty
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a community solution to a bounty
// @route   POST /api/bounties/:id/solutions
// @access  Private
exports.submitSolution = async (req, res, next) => {
  try {
    const bountyId = req.params.id;
    const authorId = req.user.id;
    const { content } = req.body;

    const solution = await bountyService.submitSolution({
      bountyId,
      authorId,
      content
    });

    res.status(201).json({
      success: true,
      data: solution
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a solution and disburse XP bounty
// @route   POST /api/bounties/:id/accept/:solutionId
// @access  Private
exports.acceptSolution = async (req, res, next) => {
  try {
    const { id: bountyId, solutionId } = req.params;
    const authorId = req.user.id;

    const result = await bountyService.acceptSolution({
      bountyId,
      authorId,
      solutionId
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upvote or downvote a solution
// @route   POST /api/bounties/:id/solutions/:solutionId/vote
// @access  Private
exports.voteSolution = async (req, res, next) => {
  try {
    const { solutionId } = req.params;
    const { voteType } = req.body; // 'UP' or 'DOWN'
    const userId = req.user.id;

    const result = await bountyService.voteSolution({
      solutionId,
      userId,
      voteType
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
