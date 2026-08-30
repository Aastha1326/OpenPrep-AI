/**
 * @fileoverview Controller for managing shared notes and collaborative annotations.
 */
// const SharedNote = require('../models/SharedNote');

/**
 * Fetches a list of public shared notes.
 */
const getSharedNotes = async (req, res) => {
    try {
        // Mock response for demonstration
        const mockNotes = [
            {
                id: 'note-1',
                title: 'Calculus Cheat Sheet',
                ownerName: 'Alice',
                annotationCount: 12,
                createdAt: new Date().toISOString(),
            },
            {
                id: 'note-2',
                title: 'Organic Chemistry Reactions',
                ownerName: 'Bob',
                annotationCount: 5,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
            }
        ];

        res.status(200).json({
            success: true,
            data: mockNotes,
        });
    } catch (error) {
        console.error('Error fetching shared notes:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * Adds a new annotation to a shared note.
 */
const addAnnotation = async (req, res) => {
    try {
        const { noteId } = req.params;
        const { x, y, text } = req.body;
        // const userId = req.user.id; // In production

        if (!x || !y || !text) {
            return res.status(400).json({ success: false, message: 'x, y, and text are required for an annotation.' });
        }

        const newAnnotation = {
            id: `ann_${Date.now()}`,
            userId: 'mock-user-id',
            x,
            y,
            text,
            timestamp: new Date().toISOString(),
        };

        // Mock DB update
        // const note = await SharedNote.findByPk(noteId);
        // note.annotations = [...note.annotations, newAnnotation];
        // await note.save();

        res.status(201).json({
            success: true,
            data: newAnnotation,
        });
    } catch (error) {
        console.error('Error adding annotation:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * Deletes an annotation (only if owner).
 */
const deleteAnnotation = async (req, res) => {
    try {
        const { noteId, annotationId } = req.params;

        // Mock DB update
        // const note = await SharedNote.findByPk(noteId);
        // note.annotations = note.annotations.filter(ann => ann.id !== annotationId);
        // await note.save();

        res.status(200).json({
            success: true,
            message: 'Annotation deleted successfully.',
        });
    } catch (error) {
        console.error('Error deleting annotation:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = {
    getSharedNotes,
    addAnnotation,
    deleteAnnotation,
};
