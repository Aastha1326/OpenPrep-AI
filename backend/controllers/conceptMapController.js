/**
 * @fileoverview Controller for managing concept map generation requests.
 */
const knowledgeGraphService = require('../services/knowledgeGraphService');

/**
 * Generates a knowledge graph from provided text or topics.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const generateConceptMap = async (req, res) => {
    try {
        const { inputText } = req.body;

        if (!inputText || typeof inputText !== 'string' || inputText.trim().length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Valid input text is required (minimum 20 characters).'
            });
        }

        const graphData = await knowledgeGraphService.generateKnowledgeGraph(inputText.trim());

        res.status(200).json({
            success: true,
            data: graphData,
        });
    } catch (error) {
        console.error('Error in concept map generation:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error while generating concept map.'
        });
    }
};

module.exports = {
    generateConceptMap,
};
