const examStrategyService = require('../services/examStrategyService');
const ExamStrategy = require('../models/ExamStrategy');

/** POST /api/exam-strategies/generate — Generate a new AI exam strategy */
exports.generate = async (req, res, next) => {
  try {
    const { examId } = req.body;
    if (!examId) return res.status(400).json({ success: false, error: 'examId is required' });
    const strategy = await examStrategyService.generateStrategy(req.user.id, examId);
    res.status(201).json({ success: true, data: strategy });
  } catch (error) {
    if (error.message === 'Exam not found') return res.status(404).json({ success: false, error: error.message });
    next(error);
  }
};

/** GET /api/exam-strategies/active — Get the active strategy */
exports.getActive = async (req, res, next) => {
  try {
    const strategy = await examStrategyService.getActiveStrategy(req.user.id, req.query.examId);
    res.status(200).json({ success: true, data: strategy || null });
  } catch (error) { next(error); }
};

/** GET /api/exam-strategies — List all strategies (paginated) */
exports.getAll = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { count, rows } = await examStrategyService.getAllStrategies(req.user.id, page, limit);
    res.status(200).json({ success: true, totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page, data: rows });
  } catch (error) { next(error); }
};

/** GET /api/exam-strategies/:id — Get a specific strategy */
exports.getById = async (req, res, next) => {
  try {
    const s = await ExamStrategy.findOne({ where: { id: req.params.id, user: req.user.id } });
    if (!s) return res.status(404).json({ success: false, error: 'Strategy not found' });
    res.status(200).json({ success: true, data: s });
  } catch (error) { next(error); }
};

/** PUT /api/exam-strategies/:id/view — Mark as viewed */
exports.markViewed = async (req, res, next) => {
  try {
    const s = await examStrategyService.markViewed(req.params.id, req.user.id);
    if (!s) return res.status(404).json({ success: false, error: 'Strategy not found' });
    res.status(200).json({ success: true, data: s });
  } catch (error) { next(error); }
};

/** PUT /api/exam-strategies/:id/feedback — Record feedback */
exports.recordFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, error: 'rating must be 1-5' });
    const s = await examStrategyService.recordFeedback(req.params.id, req.user.id, rating, comment);
    if (!s) return res.status(404).json({ success: false, error: 'Strategy not found' });
    res.status(200).json({ success: true, data: s });
  } catch (error) { next(error); }
};

/** PUT /api/exam-strategies/:id/complete-action — Mark one action done */
exports.completeAction = async (req, res, next) => {
  try {
    const s = await examStrategyService.completeAction(req.params.id, req.user.id);
    if (!s) return res.status(404).json({ success: false, error: 'Strategy not found' });
    res.status(200).json({ success: true, data: s });
  } catch (error) { next(error); }
};

/** DELETE /api/exam-strategies/:id — Archive a strategy */
exports.archive = async (req, res, next) => {
  try {
    const s = await ExamStrategy.findOne({ where: { id: req.params.id, user: req.user.id } });
    if (!s) return res.status(404).json({ success: false, error: 'Strategy not found' });
    s.status = 'archived'; await s.save();
    res.status(200).json({ success: true, data: s });
  } catch (error) { next(error); }
};
