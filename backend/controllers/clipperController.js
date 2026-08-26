/**
 * @fileoverview Controller for handling web clipper ingestion and note saving.
 */
const webClipperService = require('../services/webClipperService');
// const Note = require('../models/Note'); // Uncomment when model is integrated

/**
 * Ingests a web URL, parses clean text, extracts images, and returns structured draft notes.
 */
const ingestUrl = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url || !/^https?:\/\/.+/.test(url)) {
            return res.status(400).json({ success: false, message: 'A valid HTTP/HTTPS URL is required.' });
        }

        const articleData = await webClipperService.extractArticleContent(url);
        const aiDistillation = await webClipperService.distillArticle(articleData.title, articleData.textContent);

        res.status(200).json({
            success: true,
            data: {
                ...articleData,
                summary: aiDistillation.summary,
                keyTakeaways: aiDistillation.keyTakeaways,
                suggestedSubject: aiDistillation.suggestedSubject,
                tags: aiDistillation.tags,
            },
        });
    } catch (error) {
        console.error('[ClipperController] Ingest URL error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error during ingestion.' });
    }
};

/**
 * Saves the clipped note directly into the user's chosen Subject notebook.
 */
const saveNote = async (req, res) => {
    try {
        const { title, content, subject, tags, url } = req.body;
        // const userId = req.user.id;

        if (!title || !content || !subject) {
            return res.status(400).json({ success: false, message: 'Title, content, and subject are required.' });
        }

        // Mock database save
        const savedNote = {
            id: `note_${Date.now()}`,
            title,
            content,
            subject,
            tags: tags || [],
            sourceUrl: url,
            createdAt: new Date().toISOString(),
        };

        // In production: await Note.create({ userId, ...savedNote });

        res.status(201).json({
            success: true,
            data: savedNote,
            message: 'Note saved successfully to your notebook.',
        });
    } catch (error) {
        console.error('[ClipperController] Save note error:', error);
        res.status(500).json({ success: false, message: 'Internal server error while saving note.' });
    }
};

module.exports = {
    ingestUrl,
    saveNote,
};
