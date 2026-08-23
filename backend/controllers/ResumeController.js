const ResumeParsingService = require('../services/ResumeParsingService');

class ResumeController {

    // POST /api/resume/upload
    static async upload(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;
            const { fileName, targetRole } = req.body;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const session = await ResumeParsingService.initSession(userId, fileName, targetRole);
            return res.status(201).json({ success: true, data: session });
        } catch (error) {
            console.error('[upload error]', error);
            res.status(500).json({ error: 'Failed to initialize upload session' });
        }
    }

    // POST /api/resume/:id/process
    static async process(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;
            const { rawText } = req.body;
            if (!rawText) return res.status(400).json({ error: 'Resume text is required for processing' });

            const data = await ResumeParsingService.processResume(req.params.id, userId, rawText);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            console.error('[process error]', error);
            res.status(400).json({ error: error.message || 'Processing failed' });
        }
    }

    // GET /api/resume/analytics
    static async analytics(req, res) {
        try {
            const userId = req.user?.id || req.query.userId || req.body.userId;

            const data = await ResumeParsingService.fetchAtsAnalytics(userId);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            console.error('[analytics error]', error);
            res.status(500).json({ error: 'Failed to retrieve ATS analytics' });
        }
    }
}

module.exports = ResumeController;
