/**
 * @fileoverview Controller for handling multi-modal doubt solving requests.
 */
const doubtService = require('../services/multimodalDoubtService');

/**
 * Processes an uploaded image and text to generate a solution.
 * 
 * @param {Object} req - Express request object (expects file in req.file).
 * @param {Object} res - Express response object.
 */
const solveDoubt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'An image file is required.' });
        }

        const { context } = req.body;

        // Convert buffer to base64
        const base64Image = req.file.buffer.toString('base64');

        const solution = await doubtService.solveDoubt(base64Image, context || '');

        res.status(200).json({
            success: true,
            data: {
                solution,
                imageName: req.file.originalname,
            },
        });
    } catch (error) {
        console.error('Error solving doubt:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
    }
};

module.exports = {
    solveDoubt,
};
