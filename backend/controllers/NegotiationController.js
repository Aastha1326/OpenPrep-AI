const NegotiationService = require('../services/NegotiationService');

class NegotiationController {

    // POST /api/negotiation/init
    static async initiate(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const session = await NegotiationService.initiateSimulation(userId, req.body);
            return res.status(201).json({ success: true, data: session });
        } catch (error) {
            console.error('[initiate error]', error);
            res.status(500).json({ error: 'Failed to initialize negotiation' });
        }
    }

    // POST /api/negotiation/:id/start
    static async start(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;
            const data = await NegotiationService.startSimulation(req.params.id, userId);

            return res.status(200).json({ success: true, data });
        } catch (error) {
            console.error('[start error]', error);
            res.status(400).json({ error: error.message || 'Failed to start' });
        }
    }

    // POST /api/negotiation/:id/reply
    static async submitReply(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;
            const { text, extractedAsk } = req.body;

            if (!text) return res.status(400).json({ error: 'Message text is required' });

            const responsePayload = await NegotiationService.submitCounterOffer(req.params.id, userId, text, extractedAsk);
            return res.status(200).json({ success: true, data: responsePayload });
        } catch (error) {
            console.error('[submitReply error]', error);
            res.status(400).json({ error: error.message || 'Failed to process reply' });
        }
    }
}

module.exports = NegotiationController;
