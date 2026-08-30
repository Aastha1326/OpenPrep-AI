/**
 * @fileoverview REST controller for whiteboard persistence and management.
 */
const whiteboardSocketService = require('../services/whiteboardSocketService');
// const Whiteboard = require('../models/Whiteboard'); // Uncomment when model is created

/**
 * Fetches saved whiteboards for a specific squad
 */
const getSquadWhiteboards = async (req, res) => {
    try {
        const { squadId } = req.params;
        // Mock response: In production, fetch from DB
        const boards = [
            { id: 'wb_1', name: 'Thermodynamics Brainstorm', createdAt: new Date().toISOString() },
            { id: 'wb_2', name: 'Calculus Mind Map', createdAt: new Date(Date.now() - 86400000).toISOString() }
        ];

        res.status(200).json({ success: true, data: boards });
    } catch (error) {
        console.error('Error fetching squad whiteboards:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Creates a new whiteboard instance for a squad
 */
const createWhiteboard = async (req, res) => {
    try {
        const { squadId, name } = req.body;

        // Mock DB creation
        const newBoard = {
            id: `wb_${Date.now()}`,
            squadId,
            name,
            createdAt: new Date().toISOString(),
            state: { strokes: [], nodes: [], edges: [] }
        };

        res.status(201).json({ success: true, data: newBoard });
    } catch (error) {
        console.error('Error creating whiteboard:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Saves a serialized snapshot of the canvas state
 */
const saveWhiteboardSnapshot = async (req, res) => {
    try {
        const { id } = req.params;
        const { state } = req.body;

        if (!state || typeof state !== 'object') {
            return res.status(400).json({ success: false, message: 'Valid state object is required' });
        }

        // Mock DB update
        console.log(`[Controller] Saved snapshot for whiteboard ${id}`);

        res.status(200).json({ success: true, message: 'Snapshot saved successfully' });
    } catch (error) {
        console.error('Error saving snapshot:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Archives or deletes a whiteboard
 */
const deleteWhiteboard = async (req, res) => {
    try {
        const { id } = req.params;

        // Mock DB deletion
        console.log(`[Controller] Deleted whiteboard ${id}`);

        res.status(200).json({ success: true, message: 'Whiteboard deleted successfully' });
    } catch (error) {
        console.error('Error deleting whiteboard:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getSquadWhiteboards,
    createWhiteboard,
    saveWhiteboardSnapshot,
    deleteWhiteboard,
};
