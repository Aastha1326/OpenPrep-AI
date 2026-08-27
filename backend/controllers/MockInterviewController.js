const MockInterviewService = require('../services/MockInterviewService');

class MockInterviewController {

    // POST /api/interviews/init
    static async initiate(req, res) {
        try {
            const userId = req.user?.id || req.body.userId; // fallback
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const session = await MockInterviewService.initiateSession(userId, req.body);
            return res.status(201).json({ success: true, data: session });
        } catch (error) {
            console.error('[initiate error]', error);
            res.status(500).json({ error: 'Failed to initialize session' });
        }
    }

    // POST /api/interviews/:id/start
    static async start(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;
            const { session, initialGreeting } = await MockInterviewService.startSession(req.params.id, userId);

            return res.status(200).json({ success: true, data: { session, initialGreeting } });
        } catch (error) {
            console.error('[start error]', error);
            res.status(400).json({ error: error.message || 'Failed to start' });
        }
    }

    // POST /api/interviews/:id/reply
    static async submitReply(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;
            const { text } = req.body;

            if (!text) return res.status(400).json({ error: 'Message text is required' });

            const responsePayload = await MockInterviewService.submitResponse(req.params.id, userId, text);
            return res.status(200).json({ success: true, data: responsePayload });
        } catch (error) {
            console.error('[submitReply error]', error);
            res.status(400).json({ error: error.message || 'Failed to process reply' });
        }
    }
    // GET /api/interviews/:id/evaluation
    static async getEvaluation(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;

            const evaluation =
                await MockInterviewService.getEvaluationMetadata(
                    req.params.id,
                    userId
                );

            return res.status(200).json({
                success: true,
                data: evaluation,
            });
        } catch (error) {
            console.error('[getEvaluation error]', error);
            return res.status(400).json({
                error: error.message || 'Failed to get evaluation metadata',
            });
        }
    }

    // GET /api/interviews/:id/compare/:version
    static async compareEvaluation(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;

            const comparison =
                await MockInterviewService.compareEvaluationVersions(
                    req.params.id,
                    userId,
                    req.params.version
                );

            return res.status(200).json({
                success: true,
                data: comparison,
            });
        } catch (error) {
            console.error('[compareEvaluation error]', error);
            return res.status(400).json({
                error: error.message || 'Failed to compare evaluation versions',
            });
        }
    }
    // POST /api/interviews/:id/conclude
    static async conclude(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;
            const finalSession = await MockInterviewService.concludeSession(req.params.id, userId);

            return res.status(200).json({ success: true, data: finalSession });
        } catch (error) {
            console.error('[conclude error]', error);
            res.status(400).json({ error: error.message || 'Failed to conclude session' });
        }
    }
}

module.exports = MockInterviewController;
