/**
 * @fileoverview Controller for managing note highlights and nested discussion threads.
 */
// const NoteHighlight = require('../models/NoteHighlight');
// const DiscussionReply = require('../models/DiscussionReply');

/**
 * Creates a new highlight and optional initial discussion comment.
 */
const createHighlight = async (req, res) => {
    try {
        const { noteId, startOffset, endOffset, highlightedText, color, initialComment } = req.body;
        // const userId = req.user.id;

        if (!noteId || startOffset === undefined || endOffset === undefined || !highlightedText) {
            return res.status(400).json({ success: false, message: 'noteId, startOffset, endOffset, and highlightedText are required.' });
        }

        // Mock creation
        const newHighlight = {
            id: `hl_${Date.now()}`,
            noteId,
            userId: 'mock-user-id',
            startOffset,
            endOffset,
            highlightedText,
            color: color || '#fde047',
            isResolved: false,
            comments: initialComment ? [{ id: 'cmt_1', userId: 'mock-user-id', text: initialComment, createdAt: new Date().toISOString() }] : []
        };

        res.status(201).json({ success: true, data: newHighlight });
    } catch (error) {
        console.error('Error creating highlight:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Fetches all highlights and discussions for a specific note.
 */
const getNoteHighlights = async (req, res) => {
    try {
        const { noteId } = req.params;

        // Mock data
        const mockHighlights = [
            {
                id: 'hl_1',
                userId: 'user_A',
                startOffset: 15,
                endOffset: 35,
                highlightedText: 'mitochondria is the powerhouse',
                color: '#fde047',
                isResolved: false,
                comments: [
                    { id: 'cmt_1', userId: 'user_A', text: 'Classic biology fact!', createdAt: new Date().toISOString() },
                    { id: 'cmt_2', userId: 'user_B', text: 'But why though?', createdAt: new Date().toISOString() }
                ]
            }
        ];

        res.status(200).json({ success: true, data: mockHighlights });
    } catch (error) {
        console.error('Error fetching highlights:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Adds a reply to an existing highlight discussion thread.
 */
const addDiscussionReply = async (req, res) => {
    try {
        const { highlightId } = req.params;
        const { text } = req.body;
        // const userId = req.user.id;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Reply text is required.' });
        }

        // Mock reply addition
        const newReply = {
            id: `cmt_${Date.now()}`,
            userId: 'mock-user-id',
            text: text.trim(),
            createdAt: new Date().toISOString()
        };

        res.status(201).json({ success: true, data: newReply });
    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Resolves or deletes a highlight (moderation).
 */
const moderateHighlight = async (req, res) => {
    try {
        const { highlightId } = req.params;
        const { action } = req.body; // 'resolve' or 'delete'

        if (!['resolve', 'delete'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid action. Use "resolve" or "delete".' });
        }

        res.status(200).json({ success: true, message: `Highlight ${action}d successfully.` });
    } catch (error) {
        console.error('Error moderating highlight:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    createHighlight,
    getNoteHighlights,
    addDiscussionReply,
    moderateHighlight,
};
