/**
 * @fileoverview Controller for handling flashcard deck export requests.
 */
const ankiExportService = require('../services/ankiExportService');
// const FlashcardDeck = require('../models/FlashcardDeck'); // Mock model

/**
 * Exports a specific flashcard deck to Anki .apkg format.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const exportToAnki = async (req, res) => {
    try {
        const { deckId } = req.params;

        if (!deckId) {
            return res.status(400).json({ success: false, message: 'Deck ID is required.' });
        }

        // Mock fetching deck data. Replace with actual DB query.
        // const deck = await FlashcardDeck.findByPk(deckId, { include: ['cards'] });
        const mockDeck = {
            name: 'Exported Deck',
            cards: [
                { front: 'What is React?', back: 'A JavaScript library for building UIs.', interval: 3, easeFactor: 2.5, repetitions: 2 },
                { front: 'What is a Closure?', back: 'A function bundled with its lexical environment.', interval: 1, easeFactor: 2.5, repetitions: 1 }
            ]
        };

        if (!mockDeck) {
            return res.status(404).json({ success: false, message: 'Deck not found.' });
        }

        // Generate the .apkg buffer
        const apkgBuffer = await ankiExportService.generateAnkiPackage(
            mockDeck.cards,
            mockDeck.name
        );

        // Send file with correct headers
        res.setHeader('Content-Type', 'application/apkg');
        res.setHeader('Content-Disposition', `attachment; filename="${mockDeck.name.replace(/\s+/g, '_')}.apkg"`);
        res.setHeader('Content-Length', apkgBuffer.length);

        res.send(apkgBuffer);
    } catch (error) {
        console.error('Error exporting to Anki:', error);
        res.status(500).json({ success: false, message: 'Failed to generate Anki package.' });
    }
};

module.exports = {
    exportToAnki,
};
