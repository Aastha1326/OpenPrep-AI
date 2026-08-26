/**
 * @fileoverview Controller for handling document comparison requests.
 */
const comparisonService = require('../services/documentComparisonService');

/**
 * Compares two provided text documents.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const compareDocs = async (req, res) => {
    try {
        const { textA, textB } = req.body;

        if (!textA || !textB || typeof textA !== 'string' || typeof textB !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Both textA and textB are required and must be strings.'
            });
        }

        if (textA.trim().length < 50 || textB.trim().length < 50) {
            return res.status(400).json({
                success: false,
                message: 'Each document must contain at least 50 characters for meaningful comparison.'
            });
        }

        const analysis = await comparisonService.compareDocuments(textA, textB);

        res.status(200).json({
            success: true,
            data: analysis,
        });
    } catch (error) {
        console.error('Error in document comparison:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error during comparison.'
        });
    }
};

module.exports = {
    compareDocs,
};
