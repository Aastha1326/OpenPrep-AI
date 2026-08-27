const studyCompanionService = require('../services/studyCompanionService');

/** POST /api/chat/sessions — Create a new chat session */
exports.createSession = async (req, res, next) => {
  try {
    const sessionId = studyCompanionService.createSession();
    res.status(201).json({ success: true, data: { sessionId } });
  } catch (error) { next(error); }
};

/** POST /api/chat/:sessionId/messages — Send a message and get AI response */
exports.sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ success: false, error: 'message is required' });
    const history = await studyCompanionService.getSessionHistory(req.user.id, req.params.sessionId, 10);
    const response = await studyCompanionService.generateResponse(req.user.id, req.params.sessionId, message.trim(), history);
    res.status(201).json({ success: true, data: response });
  } catch (error) { next(error); }
};

/** GET /api/chat/:sessionId/messages — Get chat history for a session */
exports.getHistory = async (req, res, next) => {
  try {
    const messages = await studyCompanionService.getSessionHistory(req.user.id, req.params.sessionId);
    res.status(200).json({ success: true, data: messages });
  } catch (error) { next(error); }
};

/** GET /api/chat/sessions — Get all user sessions */
exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await studyCompanionService.getUserSessions(req.user.id);
    res.status(200).json({ success: true, data: sessions });
  } catch (error) { next(error); }
};

/** PUT /api/chat/messages/:id/rate — Rate a response */
exports.rateMessage = async (req, res, next) => {
  try {
    const { helpful } = req.body;
    if (typeof helpful !== 'boolean') return res.status(400).json({ success: false, error: 'helpful must be boolean' });
    const msg = await studyCompanionService.rateMessage(req.params.id, req.user.id, helpful);
    if (!msg) return res.status(404).json({ success: false, error: 'Message not found' });
    res.status(200).json({ success: true, data: msg });
  } catch (error) { next(error); }
};

/** GET /api/chat/stats — Get chat usage stats */
exports.getStats = async (req, res, next) => {
  try {
    const stats = await studyCompanionService.getChatStats(req.user.id);
    res.status(200).json({ success: true, data: stats });
  } catch (error) { next(error); }
};
