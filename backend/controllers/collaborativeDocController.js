/**
 * @fileoverview Controller for managing collaborative document state and version history.
 */
// const Document = require('../models/Document');
// const DocumentVersion = require('../models/DocumentVersion');

/**
 * Fetches the current state of a shared document.
 */
const getDocument = async (req, res) => {
    try {
        const { docId } = req.params;

        // Mock document state
        const mockDoc = {
            id: docId,
            title: 'Group Study Notes',
            content: 'Welcome to the collaborative editor. Start typing!',
            version: 1,
            activeUsers: ['user_A', 'user_B']
        };

        res.status(200).json({ success: true, data: mockDoc });
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Saves a snapshot of the document state for version history.
 */
const saveVersion = async (req, res) => {
    try {
        const { docId, content, version } = req.body;

        if (!docId || !content) {
            return res.status(400).json({ success: false, message: 'docId and content are required.' });
        }

        // Mock version saving
        // await DocumentVersion.create({ docId, content, version, savedBy: req.user.id });

        res.status(200).json({
            success: true,
            message: 'Document version saved successfully.',
            data: { version: version + 1 }
        });
    } catch (error) {
        console.error('Error saving version:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getDocument,
    saveVersion,
};
