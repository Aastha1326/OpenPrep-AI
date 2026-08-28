const milestoneRewardService = require('../services/milestoneRewardService');

/** POST /api/milestones/evaluate — Evaluate and update all milestones */
exports.evaluate = async (req, res, next) => {
  try {
    const { milestones, newlyEarned } = await milestoneRewardService.evaluateMilestones(req.user.id);
    res.status(200).json({ success: true, data: { milestones, newlyEarned, newlyEarnedCount: newlyEarned.length } });
  } catch (error) { next(error); }
};

/** GET /api/milestones — Get all milestones */
exports.getAll = async (req, res, next) => {
  try {
    const milestones = await milestoneRewardService.getAllMilestones(req.user.id);
    res.status(200).json({ success: true, data: milestones });
  } catch (error) { next(error); }
};

/** GET /api/milestones/stats — Get summary stats */
exports.getStats = async (req, res, next) => {
  try {
    const stats = await milestoneRewardService.getRewardStats(req.user.id);
    res.status(200).json({ success: true, data: stats });
  } catch (error) { next(error); }
};

/** PUT /api/milestones/:id/claim — Claim a reward */
exports.claim = async (req, res, next) => {
  try {
    const milestone = await milestoneRewardService.claimReward(req.user.id, req.params.id);
    if (!milestone) return res.status(400).json({ success: false, error: 'Milestone not available for claiming' });
    res.status(200).json({ success: true, data: milestone });
  } catch (error) { next(error); }
};

/** GET /api/milestones/:id — Get a single milestone */
exports.getById = async (req, res, next) => {
  try {
    const m = await require('../models/MilestoneReward').findOne({ where: { id: req.params.id, user: req.user.id } });
    if (!m) return res.status(404).json({ success: false, error: 'Milestone not found' });
    res.status(200).json({ success: true, data: m });
  } catch (error) { next(error); }
};
