/**
 * @fileoverview Controller for handling PDF study guide export requests.
 */
const pdfGenerationService = require('../services/pdfGenerationService');

/**
 * Compiles selected flashcard decks, notes, and formula sheets into a downloadable PDF.
 */
const exportPDF = async (req, res) => {
    try {
        const { title, studentName, watermark, includeFlashcards, includeNotes, includeFormulas } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: 'Study guide title is required.' });
        }

        // Mock data fetching based on user selections
        const sections = [];
        if (includeNotes) {
            sections.push({
                title: 'High-Yield Notes',
                type: 'notes',
                content: 'This is a mock high-yield note section. In production, this would contain the user\'s saved notes from the database, formatted for print.'
            });
        }
        if (includeFlashcards) {
            sections.push({
                title: 'Key Flashcards',
                type: 'flashcards',
                items: [
                    { front: 'What is the capital of France?', back: 'Paris' },
                    { front: 'What is the time complexity of binary search?', back: 'O(log n)' }
                ]
            });
        }
        if (includeFormulas) {
            sections.push({
                title: 'Formula Cheat-Sheet',
                type: 'formulas',
                content: 'Quadratic Formula: x = (-b ± √(b² - 4ac)) / 2a\nPythagorean Theorem: a² + b² = c²'
            });
        }

        if (sections.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one content type must be selected.' });
        }

        const pdfBuffer = await pdfGenerationService.generateStudyGuidePDF({
            title,
            studentName,
            watermark,
            sections,
        });

        // Set headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}_StudyGuide.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);
    } catch (error) {
        console.error('[StudyGuideController] Export PDF error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during PDF generation.' });
    }
};

module.exports = {
    exportPDF,
};
