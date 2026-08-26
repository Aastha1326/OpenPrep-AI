const JobTrackerService = require('../services/JobTrackerService');

class JobTrackerController {

    // POST /api/jobs
    static async createJob(req, res) {
        try {
            const userId = req.user?.id || req.body.userId; // fallback for demo
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const newJob = await JobTrackerService.addJob(userId, req.body);
            return res.status(201).json({ success: true, data: newJob });
        } catch (error) {
            console.error('[createJob] error:', error);
            return res.status(500).json({ error: 'Failed to create job application' });
        }
    }

    // GET /api/jobs/board
    static async getBoard(req, res) {
        try {
            const userId = req.user?.id || req.query.userId || req.body.userId;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const board = await JobTrackerService.fetchBoardState(userId);
            return res.status(200).json({ success: true, data: board });
        } catch (error) {
            console.error('[getBoard] error:', error);
            return res.status(500).json({ error: 'Failed to fetch board state' });
        }
    }

    // PUT /api/jobs/:id/move
    static async moveJob(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;
            const { status, newOrder } = req.body;
            const jobId = req.params.id;

            if (!userId || !status || typeof newOrder !== 'number') {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            const updatedJob = await JobTrackerService.moveJob(userId, jobId, status, newOrder);
            return res.status(200).json({ success: true, data: updatedJob });
        } catch (error) {
            console.error('[moveJob] error:', error);
            return res.status(500).json({ error: 'Failed to move job application' });
        }
    }

    // GET /api/jobs/analytics
    static async getAnalytics(req, res) {
        try {
            const userId = req.user?.id || req.query.userId || req.body.userId;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const analytics = await JobTrackerService.getAnalytics(userId);
            return res.status(200).json({ success: true, data: analytics });
        } catch (error) {
            console.error('[getAnalytics] error:', error);
            return res.status(500).json({ error: 'Failed to get analytics' });
        }
    }
}

module.exports = JobTrackerController;
