const attemptHistoryService = require('../services/attemptHistoryService');

exports.getAttemptHistory = async (req, res) => {
  try {
    const { subjectId, topicId, page, limit } = req.query;
    const data = await attemptHistoryService.getAttemptHistory(req.user.id, { subjectId, topicId, page: parseInt(page || 1), limit: parseInt(limit || 50) });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get attempt history' });
  }
};

exports.getScoreTrends = async (req, res) => {
  try {
    const { subjectId, groupBy, limit } = req.query;
    const data = await attemptHistoryService.getScoreTrends(req.user.id, { subjectId, groupBy: groupBy || 'day', limit: parseInt(limit || 60) });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get score trends' });
  }
};

exports.getTopicProgress = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const data = await attemptHistoryService.getTopicProgress(req.user.id, subjectId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get topic progress' });
  }
};

exports.getPerformanceSummary = async (req, res) => {
  try {
    const data = await attemptHistoryService.getPerformanceSummary(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get performance summary' });
  }
};
