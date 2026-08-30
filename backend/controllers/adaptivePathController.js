/**
 * @fileoverview Controller for managing adaptive study path generation and updates.
 */
const adaptivePathService = require('../services/adaptivePathService');

/**
 * Generates a new adaptive study path for the user.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createAdaptivePath = async (req, res) => {
    try {
        const { weakTopics, completedTopics, daysUntilExam, subject } = req.body;

        if (!subject || !Array.isArray(weakTopics) || !Array.isArray(completedTopics) || !daysUntilExam) {
            return res.status(400).json({
                success: false,
                message: 'subject, weakTopics (array), completedTopics (array), and daysUntilExam are required.'
            });
        }

        if (daysUntilExam <= 0) {
            return res.status(400).json({
                success: false,
                message: 'daysUntilExam must be greater than 0.'
            });
        }

        const pathData = await adaptivePathService.generateAdaptivePath(
            weakTopics,
            completedTopics,
            daysUntilExam,
            subject
        );

        // In a full implementation, save this path to the database linked to req.user.id

        res.status(201).json({
            success: true,
            data: pathData,
        });
    } catch (error) {
        console.error('Error creating adaptive path:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error while generating study path.'
        });
    }
};

/**
 * Updates an existing study path based on recent performance.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateAdaptivePath = async (req, res) => {
    try {
        const { pathId } = req.params;
        const { completedNodeId, score } = req.body;

        if (!completedNodeId || typeof score !== 'number' || score < 0 || score > 100) {
            return res.status(400).json({
                success: false,
                message: 'Valid completedNodeId and score (0-100) are required.'
            });
        }

        // Mock fetching current path. Replace with DB query in production.
        const mockCurrentPath = {
            pathName: "Calculus Mastery",
            nodes: [
                { id: "node_1", topic: "Limits", difficulty: "Medium", status: "available" },
                { id: "node_2", topic: "Derivatives", difficulty: "Hard", status: "locked" }
            ],
            edges: [{ source: "node_1", target: "node_2", relationship: "prerequisite for" }]
        };

        const updatedPath = await adaptivePathService.updatePathDynamically(
            mockCurrentPath,
            completedNodeId,
            score
        );

        res.status(200).json({
            success: true,
            data: updatedPath,
        });
    } catch (error) {
        console.error('Error updating adaptive path:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error while updating study path.'
        });
    }
};

module.exports = {
    createAdaptivePath,
    updateAdaptivePath,
};
