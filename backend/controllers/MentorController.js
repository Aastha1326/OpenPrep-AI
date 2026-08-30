const MentorMatchingService = require('../services/MentorMatchingService');

class MentorController {

    // POST /api/mentors/discover
    static async discover(req, res) {
        try {
            // e.g { targetIndustry: 'Tech', desiredSkills: ['React', 'Node'], targetCompany: 'Google' }
            const rankedMentors = await MentorMatchingService.discoverMentors(req.body);
            return res.status(200).json({ success: true, data: rankedMentors });
        } catch (error) {
            console.error('[discover error]', error);
            res.status(500).json({ error: 'Failed to discover mentors' });
        }
    }

    // POST /api/mentors/:id/connect
    static async requestConnection(req, res) {
        try {
            const studentId = req.user?.id || req.body.studentId;
            const { message } = req.body;

            if (!studentId || !message) {
                return res.status(400).json({ error: 'Missing student credentials or introduction message' });
            }

            const connectionResponse = await MentorMatchingService.requestConnection(studentId, req.params.id, message);
            return res.status(200).json({ success: true, data: connectionResponse });
        } catch (error) {
            console.error('[requestConnection error]', error);
            res.status(400).json({ error: error.message || 'Connection request failed' });
        }
    }

    // GET /api/mentors/telemetry
    static async telemetry(req, res) {
        try {
            const telemetry = await MentorMatchingService.getTelemetry();
            return res.status(200).json({ success: true, data: telemetry });
        } catch (error) {
            console.error('[telemetry error]', error);
            res.status(500).json({ error: 'Failed to retrieve mentorship analytics' });
        }
    }
}

module.exports = MentorController;
