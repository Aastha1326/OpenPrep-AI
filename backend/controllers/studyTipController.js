const studyTipService = require('../services/studyTipService');

/** POST /api/study-tips/generate — Generate fresh personalized tips */
exports.generate = async (req, res, next) => {
  try {
    const tips = await studyTipService.generateTips(req.user.id);
    res.status(201).json({ success: true, data: tips, count: tips.length });
  } catch (error) { next(error); }
};

/** GET /api/study-tips/active — Get active (non-dismissed, non-expired) tips */
exports.getActive = async (req, res, next) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit, 10) || 10);
    const tips = await studyTipService.getActiveTips(req.user.id, limit);
    res.status(200).json({ success: true, data: tips });
  } catch (error) { next(error); }
};

/** GET /api/study-tips — List all tips (paginated) */
exports.getAll = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const { count, rows } = await studyTipService.getAllTips(req.user.id, page, limit);
    res.status(200).json({ success: true, totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page, data: rows });
  } catch (error) { next(error); }
};

/** GET /api/study-tips/:id — Get a specific tip */
exports.getById = async (req, res, next) => {
  try {
    const tip = await require('../models/StudyTip').findOne({ where: { id: req.params.id, user: req.user.id } });
    if (!tip) return res.status(404).json({ success: false, error: 'Tip not found' });
    res.status(200).json({ success: true, data: tip });
  } catch (error) { next(error); }
};

/** PUT /api/study-tips/:id/view — Mark tip as viewed */
exports.markViewed = async (req, res, next) => {
  try {
    const tip = await studyTipService.markViewed(req.params.id, req.user.id);
    if (!tip) return res.status(404).json({ success: false, error: 'Tip not found' });
    res.status(200).json({ success: true, data: tip });
  } catch (error) { next(error); }
};

/** PUT /api/study-tips/:id/rate — Rate a tip as helpful or not */
exports.rate = async (req, res, next) => {
  try {
    const { helpful } = req.body;
    if (typeof helpful !== 'boolean') return res.status(400).json({ success: false, error: 'helpful must be a boolean' });
    const tip = await studyTipService.rateTip(req.params.id, req.user.id, helpful);
    if (!tip) return res.status(404).json({ success: false, error: 'Tip not found' });
    res.status(200).json({ success: true, data: tip });
  } catch (error) { next(error); }
};

/** PUT /api/study-tips/:id/dismiss — Dismiss a tip */
exports.dismiss = async (req, res, next) => {
  try {
    const tip = await studyTipService.dismissTip(req.params.id, req.user.id);
    if (!tip) return res.status(404).json({ success: false, error: 'Tip not found' });
    res.status(200).json({ success: true, data: tip });
  } catch (error) { next(error); }
};

/** GET /api/study-tips/stats — Get engagement statistics */
exports.getStats = async (req, res, next) => {
  try {
    const stats = await studyTipService.getEngagementStats(req.user.id);
    res.status(200).json({ success: true, data: stats });
  } catch (error) { next(error); }
};
