const studyStreakService = require('../services/studyStreakService');

/** POST /api/streaks/record — Record study activity for today */
exports.record = async (req, res, next) => {
  try {
    const record = await studyStreakService.recordActivity(req.user.id, req.body);
    const stats = await studyStreakService.getStreakStats(req.user.id);
    res.status(201).json({ success: true, data: record, stats });
  } catch (error) { next(error); }
};

/** GET /api/streaks/stats — Get full streak statistics */
exports.getStats = async (req, res, next) => {
  try {
    const stats = await studyStreakService.getStreakStats(req.user.id);
    res.status(200).json({ success: true, data: stats });
  } catch (error) { next(error); }
};

/** GET /api/streaks/heatmap — Get calendar heatmap data */
exports.getHeatmap = async (req, res, next) => {
  try {
    const days = Math.min(365, Math.max(7, parseInt(req.query.days, 10) || 90));
    const data = await studyStreakService.getHeatmapData(req.user.id, days);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

/** GET /api/streaks/weekly — Get weekly summary for last N weeks */
exports.getWeekly = async (req, res, next) => {
  try {
    const weeks = Math.min(52, Math.max(1, parseInt(req.query.weeks, 10) || 12));
    const data = await studyStreakService.getWeeklySummary(req.user.id, weeks);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

/** GET /api/streaks/prediction — Get streak continuation prediction */
exports.getPrediction = async (req, res, next) => {
  try {
    const data = await studyStreakService.getStreakPrediction(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

/** GET /api/streaks/current — Get current streak only */
exports.getCurrent = async (req, res, next) => {
  try {
    const current = await studyStreakService.getCurrentStreak(req.user.id);
    res.status(200).json({ success: true, data: { currentStreak: current } });
  } catch (error) { next(error); }
};
